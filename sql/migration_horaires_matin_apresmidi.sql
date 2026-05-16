-- ============================================================
-- MIGRATION : EVOLUTION DE LA TABLE horaire (matin / apres-midi)
--
-- Besoin metier : un traiteur ferme generalement entre midi et 14h.
-- Il faut donc pouvoir definir 2 plages horaires par jour
-- (matin + apres-midi).
--
-- Strategie : on ajoute 4 nouvelles colonnes (matin/apres-midi)
-- et on conserve les anciennes (heure_ouverture / heure_fermeture)
-- pour la retro-compatibilite. Les anciennes colonnes seront
-- supprimees une fois le code migre.
--
-- On ajoute aussi un booleen 'ferme' pour les jours de fermeture
-- (plus propre que des NULL partout).
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Ajout des nouvelles colonnes
ALTER TABLE horaire 
ADD COLUMN IF NOT EXISTS heure_ouverture_matin VARCHAR(10);

ALTER TABLE horaire 
ADD COLUMN IF NOT EXISTS heure_fermeture_matin VARCHAR(10);

ALTER TABLE horaire 
ADD COLUMN IF NOT EXISTS heure_ouverture_apresmidi VARCHAR(10);

ALTER TABLE horaire 
ADD COLUMN IF NOT EXISTS heure_fermeture_apresmidi VARCHAR(10);

ALTER TABLE horaire 
ADD COLUMN IF NOT EXISTS ferme BOOLEAN NOT NULL DEFAULT FALSE;


-- 2. Migration des donnees existantes
-- Les anciennes valeurs (heure_ouverture, heure_fermeture) sont
-- recopiees dans le creneau "matin" par defaut. L'admin pourra
-- ensuite split en matin + apres-midi via l'interface.
-- 
-- Si l'ancienne plage etait NULL, on marque le jour comme ferme.
UPDATE horaire
SET 
    heure_ouverture_matin = heure_ouverture,
    heure_fermeture_matin = heure_fermeture,
    ferme = (heure_ouverture IS NULL AND heure_fermeture IS NULL)
WHERE heure_ouverture_matin IS NULL;


-- 3. Contrainte de coherence : si le jour n'est pas ferme,
--    au moins un creneau (matin OU apres-midi) doit etre defini
ALTER TABLE horaire
DROP CONSTRAINT IF EXISTS chk_horaire_creneau_ou_ferme;

ALTER TABLE horaire
ADD CONSTRAINT chk_horaire_creneau_ou_ferme
CHECK (
    ferme = TRUE 
    OR (heure_ouverture_matin IS NOT NULL AND heure_fermeture_matin IS NOT NULL)
    OR (heure_ouverture_apresmidi IS NOT NULL AND heure_fermeture_apresmidi IS NOT NULL)
);


-- 4. Commentaires descriptifs
COMMENT ON COLUMN horaire.heure_ouverture_matin IS 
'Heure d''ouverture du creneau matin (ex: "09:00"). NULL si pas de service matin.';

COMMENT ON COLUMN horaire.heure_fermeture_matin IS 
'Heure de fermeture du creneau matin (ex: "12:00"). NULL si pas de service matin.';

COMMENT ON COLUMN horaire.heure_ouverture_apresmidi IS 
'Heure d''ouverture du creneau apres-midi (ex: "14:00"). NULL si pas de service apres-midi.';

COMMENT ON COLUMN horaire.heure_fermeture_apresmidi IS 
'Heure de fermeture du creneau apres-midi (ex: "19:00"). NULL si pas de service apres-midi.';

COMMENT ON COLUMN horaire.ferme IS 
'TRUE si le restaurant est ferme ce jour-la (plus propre que 4 NULL).';


-- 5. Verification : les 5 nouvelles colonnes sont presentes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'horaire'
ORDER BY ordinal_position;

-- 6. Verification des donnees migrees (pour s'assurer que rien n'a saute)
SELECT 
    jour, 
    heure_ouverture AS ancien_ouvert, heure_fermeture AS ancien_ferme,
    heure_ouverture_matin, heure_fermeture_matin,
    heure_ouverture_apresmidi, heure_fermeture_apresmidi,
    ferme
FROM horaire
ORDER BY 
    CASE jour
        WHEN 'lundi' THEN 1
        WHEN 'mardi' THEN 2
        WHEN 'mercredi' THEN 3
        WHEN 'jeudi' THEN 4
        WHEN 'vendredi' THEN 5
        WHEN 'samedi' THEN 6
        WHEN 'dimanche' THEN 7
        ELSE 8
    END;
