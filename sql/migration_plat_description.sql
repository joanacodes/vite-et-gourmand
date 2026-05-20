-- =====================================================================
-- MIGRATION : Ajout de la colonne description a la table plat
-- =====================================================================
-- Permet de stocker une description courte (ingredients, preparation,
-- conseil du chef...) pour chaque plat.
-- Script idempotent : peut etre execute plusieurs fois sans erreur.
-- =====================================================================

ALTER TABLE plat ADD COLUMN IF NOT EXISTS description TEXT;
