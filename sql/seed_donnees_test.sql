-- ============================================================
-- SEED COMPLEMENTAIRE - DONNEES DE TEST
--
-- Ce script ajoute des donnees de test aux donnees de reference
-- existantes (deja seedees via donnees.sql).
--
-- Idempotent : on supprime d'abord les anciennes donnees test
-- avant de les recreer. Permet de relancer le script autant
-- de fois qu'on veut pour reset un etat propre.
--
-- Ce que ce script ajoute :
--   - 18 images Unsplash (3 par menu)
--   - 4 commandes test (statuts varies : en_attente, accepte, livre, terminee)
--   - 3 avis valides
--   - 3 notes internes equipe
--
-- Prerequis : creation.sql + donnees.sql + toutes les migrations executees
-- (notes_client, commande_note_interne, menu_image, RGPD, notifications, horaires)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. RESET DES DONNEES TEST (suppression idempotente)
-- ============================================================

-- Suppression des avis lies aux commandes test
DELETE FROM publie WHERE numero_commande LIKE 'CMD-TEST-%';
DELETE FROM avis WHERE avis_id IN (
    SELECT avis_id FROM publie WHERE numero_commande LIKE 'CMD-TEST-%'
);

-- Suppression des notes internes sur commandes test (CASCADE inutile, on est defensif)
DELETE FROM commande_note_interne WHERE numero_commande LIKE 'CMD-TEST-%';

-- Suppression de l'historique des commandes test
DELETE FROM commande_statut_historique WHERE numero_commande LIKE 'CMD-TEST-%';

-- Suppression des commandes test
DELETE FROM commande WHERE numero_commande LIKE 'CMD-TEST-%';

-- Suppression des images existantes (les memes seront re-creees)
DELETE FROM menu_image WHERE menu_id IN (1, 2, 3, 4, 5, 6);


-- ============================================================
-- 2. IMAGES UNSPLASH POUR LES 6 MENUS
-- 
-- URLs publiques Unsplash, libres de droits (license Unsplash).
-- 1 image principale + 2 images secondaires par menu.
-- ============================================================

-- Menu 1 : Menu de Noel Tradition
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (1, 'https://images.unsplash.com/photo-1577303935007-0d306ee638cf?w=800', 'Table de Noel dressee avec elegance', TRUE, 0),
    (1, 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=800', 'Foie gras et toasts', FALSE, 1),
    (1, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800', 'Buche de Noel artisanale', FALSE, 2);

-- Menu 2 : Menu de Paques Printanier
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (2, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'Agneau roti aux herbes printanieres', TRUE, 0),
    (2, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', 'Tarte au citron meringuee', FALSE, 1),
    (2, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800', 'Dessert aux fraises de saison', FALSE, 2);

-- Menu 3 : Menu Classique du Chef
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (3, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', 'Filet de boeuf signature', TRUE, 0),
    (3, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800', 'Saumon en croute', FALSE, 1),
    (3, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'Ambiance restaurant', FALSE, 2);

-- Menu 4 : Menu Vegetarien Decouverte
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (4, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 'Assiette vegetarienne coloree', TRUE, 0),
    (4, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 'Buddha bowl du marche', FALSE, 1),
    (4, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 'Plat aux legumes de saison', FALSE, 2);

-- Menu 5 : Menu Mariage Prestige
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (5, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', 'Table de mariage elegante', TRUE, 0),
    (5, 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', 'Piece montee artisanale', FALSE, 1),
    (5, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', 'Decoration florale raffinee', FALSE, 2);

-- Menu 6 : Menu Anniversaire Convivial
INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage) VALUES
    (6, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800', 'Buffet d''anniversaire convivial', TRUE, 0),
    (6, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800', 'Gateau d''anniversaire', FALSE, 1),
    (6, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'Plats partages entre amis', FALSE, 2);


-- ============================================================
-- 3. COMMANDES TEST (statuts varies)
-- 
-- Utilisateur "Sophie Durand" (id=3) passe plusieurs commandes
-- pour tester l'interface utilisateur.
--
-- Les distances et prix livraison sont coherents avec la formule
-- (5 EUR fixe + 0,59 EUR/km).
-- ============================================================

INSERT INTO commande (
    numero_commande, date_commande, date_prestation, heure_livraison,
    lieu_livraison, distance_km, nombre_personnes,
    prix_menu, prix_livraison, statut, pret_materiel, 
    notes_client, utilisateur_id, menu_id
) VALUES
    -- Commande EN ATTENTE (utilisateur peut modifier/annuler)
    ('CMD-TEST-001', '2026-05-10', '2026-06-15', '12:00',
     '45 Avenue Berthelot, 33300 Bordeaux', 3.5, 10,
     500.00, 7.07, 'en_attente', TRUE,
     'Allergie aux fruits a coque pour 2 personnes. Acces parking arriere du batiment.', 3, 3),
    
    -- Commande ACCEPTEE (employe a valide)
    ('CMD-TEST-002', '2026-05-08', '2026-05-25', '19:00',
     '12 rue des Faures, 33000 Bordeaux', 1.2, 15,
     720.00, 5.71, 'accepte', TRUE,
     'Anniversaire de mariage, prevoir un petit message sur le gateau.', 4, 6),
    
    -- Commande LIVREE (utilisateur peut laisser un avis)
    ('CMD-TEST-003', '2026-04-15', '2026-04-30', '18:30',
     '8 Cours de Verdun, 33000 Bordeaux', 0.8, 8,
     400.00, 5.47, 'livre', FALSE,
     NULL, 5, 3),
    
    -- Commande TERMINEE (cycle complet)
    ('CMD-TEST-004', '2026-03-20', '2026-04-05', '12:30',
     '22 Rue Sainte-Catherine, 33000 Bordeaux', 0.5, 12,
     576.00, 5.30, 'terminee', FALSE,
     'Repas d''affaires, presentation soignee SVP.', 3, 6);


-- ============================================================
-- 4. NOTES INTERNES EQUIPE (sur certaines commandes)
-- 
-- Note : commande_note_interne a ete creee dans une migration.
-- Auteur = Julie (id=2) ou Jose (id=1).
-- ============================================================

INSERT INTO commande_note_interne (numero_commande, auteur_id, contenu) VALUES
    -- Note de Julie sur la commande en attente
    ('CMD-TEST-001', 2, 
     'Cliente fidele, a soigner. Verifier l''absence totale de fruits a coque dans la preparation. J''ai discute avec Jose, on adaptera la recette de la salade.'),
    
    -- Note de Jose sur la commande acceptee
    ('CMD-TEST-002', 1, 
     'Materiel supplementaire reserve (presentoir + decoration). Preparation prevue pour le 24 mai a 8h00.'),
    
    -- Note de Julie sur la commande terminee
    ('CMD-TEST-004', 2, 
     'Excellent retour client par telephone. Beaucoup apprecie la presentation. A noter comme client potentiel pour des prestations recurrentes.');


-- ============================================================
-- 5. AVIS (lies aux commandes livrees / terminees)
-- 
-- Avis 1 : sur CMD-TEST-003 (livre) - Sophie Durand (id=3, mais on
--          a mis utilisateur_id=5 pour CMD-003, donc on utilise 5)
-- Avis 2 : sur CMD-TEST-004 (terminee) - Sophie Durand (id=3)
-- Avis 3 : avis general (sans commande liee)
-- ============================================================

-- Avis 1 : sur la commande LIVREE (Pierre Martin)
WITH nouvel_avis AS (
    INSERT INTO avis (note, description, statut, utilisateur_id) VALUES
    (5, 'Excellent menu classique, le filet de boeuf etait parfaitement cuit. Le service de livraison etait ponctuel et professionnel. Je recommande sans hesitation !', 'valide', 5)
    RETURNING avis_id
)
INSERT INTO publie (avis_id, numero_commande)
SELECT avis_id, 'CMD-TEST-003' FROM nouvel_avis;

-- Avis 2 : sur la commande TERMINEE (Sophie Durand)
WITH nouvel_avis AS (
    INSERT INTO avis (note, description, statut, utilisateur_id) VALUES
    (4, 'Tres bonne prestation pour notre repas d''affaires. La presentation etait soignee comme demande, les clients ont apprecie. Petit bemol sur le timing de livraison qui aurait pu etre plus precis.', 'valide', 3)
    RETURNING avis_id
)
INSERT INTO publie (avis_id, numero_commande)
SELECT avis_id, 'CMD-TEST-004' FROM nouvel_avis;

-- Avis 3 : avis sans commande liee (avis general)
-- Note : ce cas est rare en pratique (l'avis doit etre lie a une commande
-- pour eviter le spam), mais on en met un pour tester l'affichage public
INSERT INTO avis (note, description, statut, utilisateur_id) VALUES
    (5, 'Vite & Gourmand m''accompagne pour tous mes evenements depuis 2 ans. Une equipe a l''ecoute, des produits frais et locaux, je recommande !', 'valide', 4);


COMMIT;


-- ============================================================
-- 6. VERIFICATIONS
-- ============================================================

-- Verification des images
SELECT 'Images creees' AS info, COUNT(*) AS nombre FROM menu_image;

-- Verification des commandes test
SELECT 'Commandes test' AS info, COUNT(*) AS nombre 
FROM commande WHERE numero_commande LIKE 'CMD-TEST-%';

-- Verification des notes internes
SELECT 'Notes internes' AS info, COUNT(*) AS nombre FROM commande_note_interne;

-- Verification des avis
SELECT 'Avis valides' AS info, COUNT(*) AS nombre 
FROM avis WHERE statut = 'valide';

-- Apercu commandes test
SELECT numero_commande, statut, prix_menu + prix_livraison AS total, nombre_personnes
FROM commande 
WHERE numero_commande LIKE 'CMD-TEST-%'
ORDER BY numero_commande;
