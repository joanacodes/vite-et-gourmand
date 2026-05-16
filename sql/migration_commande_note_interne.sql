-- ============================================================
-- MIGRATION : CREATION DE LA TABLE commande_note_interne
--
-- Besoin metier : permettre a l'equipe interne (employes, admin)
-- d'echanger des notes a propos d'une commande, invisibles au client.
--
-- Exemples d'usage :
-- - "Cliente fidele, a soigner. Sans gluten pour 2 personnes."
-- - "Materiel supplementaire reserve. Preparation prevue le 18 mai 8h."
-- - "Allergie aux fruits a coque pour la belle-mere. Vu avec Jose."
--
-- Differences avec commande.notes_client :
-- - notes_client : visible client + equipe, 1 par commande, ecrit par le client
-- - commande_note_interne : equipe uniquement, N par commande, ecrit par les employes
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Creation de la table (IF NOT EXISTS pour idempotence)
CREATE TABLE IF NOT EXISTS commande_note_interne (
    note_id          SERIAL PRIMARY KEY,
    numero_commande  VARCHAR(50) NOT NULL,
    auteur_id        INT NOT NULL,
    contenu          TEXT NOT NULL,
    date_creation    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Cascade : si la commande est supprimee, ses notes le sont aussi
    CONSTRAINT fk_note_commande
        FOREIGN KEY (numero_commande)
        REFERENCES commande(numero_commande)
        ON DELETE CASCADE,
    
    -- Restrict : on empeche la suppression d'un utilisateur qui a ecrit des notes
    -- (preservation de la tracabilite)
    CONSTRAINT fk_note_auteur
        FOREIGN KEY (auteur_id)
        REFERENCES utilisateur(utilisateur_id)
        ON DELETE RESTRICT,
    
    -- Contrainte de longueur (max 2000 caracteres, coherent avec l'UI)
    CONSTRAINT chk_note_contenu_longueur
        CHECK (LENGTH(contenu) <= 2000 AND LENGTH(contenu) > 0)
);


-- 2. Index sur numero_commande pour acceler les requetes
-- "afficher toutes les notes d'une commande" (cas tres frequent)
CREATE INDEX IF NOT EXISTS idx_note_interne_commande 
ON commande_note_interne(numero_commande);


-- 3. Index sur auteur_id pour acceler les requetes
-- "afficher toutes les notes ecrites par un employe" (stats internes)
CREATE INDEX IF NOT EXISTS idx_note_interne_auteur 
ON commande_note_interne(auteur_id);


-- 4. Commentaires descriptifs (utiles dans pgAdmin et la doc)
COMMENT ON TABLE commande_note_interne IS 
'Notes internes echangees par l''equipe a propos d''une commande. Invisibles au client.';

COMMENT ON COLUMN commande_note_interne.note_id IS 
'Identifiant auto-incremente de la note';

COMMENT ON COLUMN commande_note_interne.numero_commande IS 
'Reference vers la commande concernee';

COMMENT ON COLUMN commande_note_interne.auteur_id IS 
'Reference vers l''utilisateur (employe ou admin) qui a ecrit la note';

COMMENT ON COLUMN commande_note_interne.contenu IS 
'Texte de la note (max 2000 caracteres)';

COMMENT ON COLUMN commande_note_interne.date_creation IS 
'Date et heure exactes de creation de la note';


-- 5. Verification : la table doit exister avec les bonnes contraintes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'commande_note_interne'
ORDER BY ordinal_position;

-- 6. Verification des contraintes (FK et CHECK)
SELECT 
    conname AS contrainte,
    contype AS type
FROM pg_constraint
WHERE conrelid = 'commande_note_interne'::regclass;
