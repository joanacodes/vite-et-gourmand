-- ============================================================
-- SCRIPT DE MIGRATION - STATUTS D'AVIS
-- Mise en conformite avec le schema (creation.sql)
--
-- Probleme : le code utilisait 'publie' alors que le schema 
--            attendait 'valide' pour la colonne avis.statut
-- Solution : convertir tous les avis 'publie' existants vers 'valide'
-- ============================================================

-- 1. Verification de l'etat actuel (avant migration)
SELECT statut, COUNT(*) AS nombre 
FROM avis 
GROUP BY statut 
ORDER BY statut;


-- 2. Migration des statuts 'publie' vers 'valide'
UPDATE avis 
SET statut = 'valide' 
WHERE statut = 'publie';


-- 3. Verification de l'etat final (apres migration)
-- Doit afficher uniquement : valide, refuse, en_attente
SELECT statut, COUNT(*) AS nombre 
FROM avis 
GROUP BY statut 
ORDER BY statut;


-- 4. (Optionnel) Securiser la colonne avec une contrainte CHECK
-- Empeche toute insertion future d'un statut invalide
-- ATTENTION : a executer SEULEMENT si l'etape 3 confirme qu'il n'y a plus que valide/refuse/en_attente
--
-- ALTER TABLE avis 
-- ADD CONSTRAINT chk_avis_statut 
-- CHECK (statut IN ('valide', 'refuse', 'en_attente'));
