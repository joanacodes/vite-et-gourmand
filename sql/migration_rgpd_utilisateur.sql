-- ============================================================
-- MIGRATION : CHAMPS RGPD SUR LA TABLE utilisateur
--
-- Conformite : RGPD article 17 "droit a l'oubli" + obligation legale
-- de conserver l'historique comptable (Code de commerce, 10 ans).
--
-- Strategie : "Soft delete + anonymisation"
-- 1. Client demande la suppression -> date_suppression_demandee = NOW()
-- 2. Compte desactive (impossible de se reconnecter)
-- 3. Apres 30 jours : un cron anonymise les donnees personnelles
--    (nom, email, telephone -> NULL ou "Utilisateur supprime")
--    en gardant l'utilisateur_id pour les FK (commandes, avis)
-- 4. Les donnees comptables restent legales (10 ans), mais anonymes.
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Ajout des 3 colonnes (IF NOT EXISTS pour idempotence)
ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS date_suppression_demandee TIMESTAMP;

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS date_suppression_effective TIMESTAMP;

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS est_anonymise BOOLEAN NOT NULL DEFAULT FALSE;


-- 2. Contrainte de coherence : si est_anonymise = TRUE, 
--    alors date_suppression_effective doit etre renseignee
ALTER TABLE utilisateur
DROP CONSTRAINT IF EXISTS chk_anonymisation_coherente;

ALTER TABLE utilisateur
ADD CONSTRAINT chk_anonymisation_coherente
CHECK (
    (est_anonymise = FALSE) 
    OR 
    (est_anonymise = TRUE AND date_suppression_effective IS NOT NULL)
);


-- 3. Contrainte : si date_suppression_effective est posee, 
--    la demande doit aussi etre posee
ALTER TABLE utilisateur
DROP CONSTRAINT IF EXISTS chk_suppression_demande_avant_effective;

ALTER TABLE utilisateur
ADD CONSTRAINT chk_suppression_demande_avant_effective
CHECK (
    date_suppression_effective IS NULL
    OR 
    (date_suppression_demandee IS NOT NULL AND date_suppression_effective >= date_suppression_demandee)
);


-- 4. Index sur date_suppression_demandee pour acceler le cron quotidien
-- Le cron cherche : "utilisateurs dont la demande date de plus de 30 jours et pas encore anonymises"
CREATE INDEX IF NOT EXISTS idx_utilisateur_suppression_demandee
ON utilisateur(date_suppression_demandee)
WHERE date_suppression_demandee IS NOT NULL AND est_anonymise = FALSE;


-- 5. Commentaires descriptifs
COMMENT ON COLUMN utilisateur.date_suppression_demandee IS 
'Date et heure de la demande de suppression du compte par l''utilisateur (NULL = jamais demande). Le compte est desactive des cette date.';

COMMENT ON COLUMN utilisateur.date_suppression_effective IS 
'Date et heure de l''anonymisation effective (effectuee par le cron 30 jours apres la demande). NULL = pas encore anonymise.';

COMMENT ON COLUMN utilisateur.est_anonymise IS 
'TRUE si l''utilisateur a ete anonymise. Permet des requetes rapides sans verifier les timestamps.';


-- 6. Vue pratique : utilisateurs ACTIFS uniquement (non anonymises et non en cours de suppression)
-- Utile pour les requetes courantes du back-end : SELECT * FROM utilisateur_actif WHERE ...
CREATE OR REPLACE VIEW utilisateur_actif AS
SELECT 
    utilisateur_id, email, mot_de_passe, nom, prenom, telephone,
    ville, pays, adresse_postale, actif, date_creation, role_id,
    date_suppression_demandee
FROM utilisateur
WHERE est_anonymise = FALSE
  AND date_suppression_demandee IS NULL;

COMMENT ON VIEW utilisateur_actif IS 
'Vue filtrant les utilisateurs actifs (non anonymises, sans demande de suppression en cours). A utiliser pour les requetes courantes du site.';


-- 7. Verification : les 3 colonnes doivent etre presentes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateur'
  AND column_name IN ('date_suppression_demandee', 'date_suppression_effective', 'est_anonymise')
ORDER BY ordinal_position;

-- 8. Verification des contraintes ajoutees
SELECT 
    conname AS contrainte,
    contype AS type
FROM pg_constraint
WHERE conrelid = 'utilisateur'::regclass
  AND conname LIKE 'chk_%suppression%' OR conname LIKE 'chk_anony%';
