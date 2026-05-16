-- ============================================================
-- MIGRATION : PREFERENCES DE NOTIFICATIONS SUR utilisateur
--
-- Conformite RGPD : consentement granulaire (CNIL).
-- L'utilisateur peut choisir quels types d'emails il recoit.
--
-- Distinction emails transactionnels (TRUE par defaut) vs marketing (FALSE) :
-- - notif_commandes : transactionnel, lie au contrat (suivi commande, livraison)
--   Default TRUE car necessaire a l'execution du service.
-- - notif_newsletter, notif_offres, notif_conseils : marketing.
--   Default FALSE car opt-in explicite requis par la CNIL.
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Ajout des 4 colonnes (IF NOT EXISTS pour idempotence)
ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS notif_commandes BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS notif_newsletter BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS notif_offres BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS notif_conseils BOOLEAN NOT NULL DEFAULT FALSE;


-- 2. Commentaires descriptifs (utiles pour pgAdmin et le jury)
COMMENT ON COLUMN utilisateur.notif_commandes IS 
'Email transactionnel : suivi de commande (confirmation, statut, livraison). Default TRUE car necessaire au contrat.';

COMMENT ON COLUMN utilisateur.notif_newsletter IS 
'Email marketing : newsletter mensuelle Vite & Gourmand. Default FALSE (opt-in CNIL).';

COMMENT ON COLUMN utilisateur.notif_offres IS 
'Email marketing : promotions et offres speciales. Default FALSE (opt-in CNIL).';

COMMENT ON COLUMN utilisateur.notif_conseils IS 
'Email marketing : conseils culinaires, recettes. Default FALSE (opt-in CNIL).';


-- 3. Verification : les 4 colonnes sont presentes avec les bons defaults
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateur'
  AND column_name LIKE 'notif_%'
ORDER BY column_name;

-- 4. Bonus : nombre d'utilisateurs et stats de consentement
SELECT 
    COUNT(*) AS total_utilisateurs,
    SUM(CASE WHEN notif_commandes THEN 1 ELSE 0 END) AS opt_commandes,
    SUM(CASE WHEN notif_newsletter THEN 1 ELSE 0 END) AS opt_newsletter,
    SUM(CASE WHEN notif_offres THEN 1 ELSE 0 END) AS opt_offres,
    SUM(CASE WHEN notif_conseils THEN 1 ELSE 0 END) AS opt_conseils
FROM utilisateur
WHERE est_anonymise = FALSE;
