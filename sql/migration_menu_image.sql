-- ============================================================
-- MIGRATION : CREATION DE LA TABLE menu_image
--
-- Besoin metier : permettre d'associer plusieurs images a chaque menu
-- (galerie photo dans la vue Detail menu et formulaire Creer/Modifier un menu).
--
-- Une image principale (couverture) + plusieurs images secondaires
-- (differents angles, ambiance, dressage).
--
-- La colonne 'url' est volontairement flexible : elle peut contenir
-- une URL externe (Unsplash, Cloudinary...) ou un chemin local
-- (/images/menus/cocktail-1.jpg).
--
-- Date : 2026
-- Auteur : Joana
-- ============================================================

-- 1. Creation de la table (IF NOT EXISTS pour idempotence)
CREATE TABLE IF NOT EXISTS menu_image (
    image_id          SERIAL PRIMARY KEY,
    menu_id           INT NOT NULL,
    url               VARCHAR(500) NOT NULL,
    legende           VARCHAR(200),
    est_principale    BOOLEAN NOT NULL DEFAULT FALSE,
    ordre_affichage   INT NOT NULL DEFAULT 0,
    date_ajout        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Cascade : si le menu est supprime, ses images le sont aussi
    CONSTRAINT fk_image_menu
        FOREIGN KEY (menu_id)
        REFERENCES menu(menu_id)
        ON DELETE CASCADE,
    
    -- Contrainte de longueur sur l'url (max 500 caracteres = standard pour URL)
    CONSTRAINT chk_image_url_longueur
        CHECK (LENGTH(url) > 0 AND LENGTH(url) <= 500),
    
    -- Contrainte de longueur sur la legende (max 200 caracteres)
    CONSTRAINT chk_image_legende_longueur
        CHECK (legende IS NULL OR LENGTH(legende) <= 200),
    
    -- Contrainte sur l'ordre d'affichage (positif)
    CONSTRAINT chk_image_ordre_positif
        CHECK (ordre_affichage >= 0)
);


-- 2. Index UNIQUE PARTIEL : un seul menu ne peut avoir qu'UNE seule image principale
-- (genial avec PostgreSQL : la contrainte ne s'applique que sur les lignes ou est_principale = TRUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_image_principale_unique
ON menu_image(menu_id)
WHERE est_principale = TRUE;


-- 3. Index sur menu_id pour acceler les requetes
-- "afficher toutes les images du menu X" (cas tres frequent en page Detail menu)
CREATE INDEX IF NOT EXISTS idx_menu_image_menu
ON menu_image(menu_id);


-- 4. Index compose (menu_id, ordre_affichage) pour le tri rapide de la galerie
CREATE INDEX IF NOT EXISTS idx_menu_image_ordre
ON menu_image(menu_id, ordre_affichage);


-- 5. Commentaires descriptifs (utiles dans pgAdmin et la doc)
COMMENT ON TABLE menu_image IS 
'Galerie d''images associees a un menu. Une image principale + plusieurs images secondaires.';

COMMENT ON COLUMN menu_image.image_id IS 
'Identifiant auto-incremente de l''image';

COMMENT ON COLUMN menu_image.menu_id IS 
'Reference vers le menu concerne';

COMMENT ON COLUMN menu_image.url IS 
'URL de l''image (externe type Unsplash/Cloudinary ou chemin local type /images/menus/xxx.jpg)';

COMMENT ON COLUMN menu_image.legende IS 
'Texte alternatif optionnel (accessibilite + SEO)';

COMMENT ON COLUMN menu_image.est_principale IS 
'TRUE si c''est l''image de couverture (un seul TRUE par menu, garanti par index unique partiel)';

COMMENT ON COLUMN menu_image.ordre_affichage IS 
'Ordre dans la galerie (0 = premier, croissant)';

COMMENT ON COLUMN menu_image.date_ajout IS 
'Date et heure d''ajout de l''image (pour historique admin)';


-- 6. Verification : doit afficher les colonnes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'menu_image'
ORDER BY ordinal_position;

-- 7. Verification des contraintes
SELECT 
    conname AS contrainte,
    contype AS type
FROM pg_constraint
WHERE conrelid = 'menu_image'::regclass;
