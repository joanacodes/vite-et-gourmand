-- ============================================================
-- SCRIPT DE MIGRATION - VITE & GOURMAND
-- Mise en conformite avec l'enonce ECF Studi
--
-- Modifications :
-- 1. Ajout de la colonne distance_km dans commande
-- 2. Mise a jour des statuts existants vers les nouveaux statuts
-- ============================================================

-- ============================================================
-- 1. AJOUT DE LA COLONNE distance_km
-- ============================================================

ALTER TABLE commande 
ADD COLUMN IF NOT EXISTS distance_km INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN commande.distance_km IS 
'Distance en km depuis Bordeaux pour le calcul des frais de livraison (5€ + 0,59€/km)';


-- ============================================================
-- 2. MISE A JOUR DES STATUTS EXISTANTS
-- 
-- Conformement a l'enonce, les nouveaux statuts sont :
-- - en_attente (nouveau, en attente de validation par employe)
-- - accepte (employe a valide la commande)
-- - en_preparation (cuisine en cours)
-- - en_cours_livraison (livraison en cours)
-- - livre (livre au client)
-- - attente_retour_materiel (si materiel prete)
-- - terminee (commande finie)
-- - annulee (commande annulee)
-- ============================================================

-- Conversion des anciens statuts vers les nouveaux
UPDATE commande SET statut = 'accepte' WHERE statut = 'confirmee';
UPDATE commande SET statut = 'livre' WHERE statut = 'livree';
-- Les autres statuts (en_attente, en_preparation, annulee) restent identiques


-- ============================================================
-- 3. VERIFICATION
-- ============================================================

-- Affiche les commandes avec leurs nouveaux statuts
SELECT numero_commande, statut, distance_km 
FROM commande 
ORDER BY date_commande DESC;
