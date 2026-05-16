-- ============================================================
-- MIGRATION : AJOUT DU CHAMP notes_client SUR LA TABLE commande
-- 
-- Besoin metier : permettre au client de communiquer des informations
-- specifiques lors de la commande (allergies, instructions de livraison,
-- demandes particulieres...)
-- 
-- Le champ est TEXT pour flexibilite, mais limite a 500 caracteres
-- via une contrainte CHECK (coherent avec les maquettes UI).
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Ajout de la colonne (IF NOT EXISTS pour pouvoir relancer le script sans erreur)
ALTER TABLE commande 
ADD COLUMN IF NOT EXISTS notes_client TEXT;


-- 2. Ajout d'un commentaire descriptif (utile pour pgAdmin et la doc)
COMMENT ON COLUMN commande.notes_client IS 
'Notes/instructions optionnelles du client (allergies, acces livraison, demandes specifiques). Max 500 caracteres cote UI.';


-- 3. Contrainte de longueur (max 500 caracteres)
-- DROP si la contrainte existe deja, puis ADD : permet de relancer le script sans erreur
ALTER TABLE commande
DROP CONSTRAINT IF EXISTS chk_notes_client_longueur;

ALTER TABLE commande
ADD CONSTRAINT chk_notes_client_longueur 
CHECK (notes_client IS NULL OR LENGTH(notes_client) <= 500);


-- 4. Verification : doit afficher la colonne avec son type TEXT et son commentaire
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    col_description('commande'::regclass, ordinal_position) AS commentaire
FROM information_schema.columns 
WHERE table_name = 'commande' 
  AND column_name = 'notes_client';
