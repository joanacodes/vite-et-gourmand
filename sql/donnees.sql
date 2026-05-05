-- =====================================================================
-- SCRIPT D'INSERTION DE DONNEES - PROJET VITE & GOURMAND
-- Base de donnees : PostgreSQL
-- 
-- IMPORTANT : ce script suppose que les tables sont DEJA CREEES
-- (executer creation.sql avant)
-- =====================================================================


-- =====================================================================
-- INSERTION : roles
-- =====================================================================
INSERT INTO role (libelle) VALUES
    ('utilisateur'),
    ('employe'),
    ('administrateur');


-- =====================================================================
-- INSERTION : utilisateurs (de test)
-- 
-- Les mots de passe sont deja hashes avec bcrypt (cout 10).
-- Mots de passe en clair pour les tests :
--   admin@vite-et-gourmand.fr      : Admin1234!
--   employe@vite-et-gourmand.fr    : Employe1234!
--   utilisateur@test.fr            : User1234!
--   marie.dupont@test.fr           : Marie1234!
--   pierre.martin@test.fr          : Pierre1234!
-- =====================================================================
INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, telephone, ville, pays, adresse_postale, role_id) VALUES
    ('admin@vite-et-gourmand.fr', '$2b$10$rGQq8e.TYz2H0Kf3rW.0xeGCJjEaP9zqGnUQjEgvFcDqNvF3rQmHa', 'Garcia', 'Jose', '0612345678', 'Bordeaux', 'France', '12 rue de la Gastronomie', 3),
    ('employe@vite-et-gourmand.fr', '$2b$10$rGQq8e.TYz2H0Kf3rW.0xeGCJjEaP9zqGnUQjEgvFcDqNvF3rQmHa', 'Lefevre', 'Julie', '0623456789', 'Bordeaux', 'France', '15 avenue des Saveurs', 2),
    ('utilisateur@test.fr', '$2b$10$rGQq8e.TYz2H0Kf3rW.0xeGCJjEaP9zqGnUQjEgvFcDqNvF3rQmHa', 'Durand', 'Sophie', '0634567890', 'Bordeaux', 'France', '8 rue des Vignes', 1),
    ('marie.dupont@test.fr', '$2b$10$rGQq8e.TYz2H0Kf3rW.0xeGCJjEaP9zqGnUQjEgvFcDqNvF3rQmHa', 'Dupont', 'Marie', '0645678901', 'Talence', 'France', '22 boulevard de la Plage', 1),
    ('pierre.martin@test.fr', '$2b$10$rGQq8e.TYz2H0Kf3rW.0xeGCJjEaP9zqGnUQjEgvFcDqNvF3rQmHa', 'Martin', 'Pierre', '0656789012', 'Pessac', 'France', '5 rue du Cassoulet', 1);


-- =====================================================================
-- INSERTION : themes
-- =====================================================================
INSERT INTO theme (libelle) VALUES
    ('Classique'),
    ('Noel'),
    ('Paques'),
    ('Evenement'),
    ('Mariage'),
    ('Anniversaire');


-- =====================================================================
-- INSERTION : regimes
-- =====================================================================
INSERT INTO regime (libelle) VALUES
    ('Classique'),
    ('Vegetarien'),
    ('Vegan'),
    ('Sans gluten'),
    ('Sans lactose'),
    ('Halal');


-- =====================================================================
-- INSERTION : allergenes
-- =====================================================================
INSERT INTO allergene (libelle) VALUES
    ('Gluten'),
    ('Lactose'),
    ('Oeufs'),
    ('Fruits a coque'),
    ('Arachides'),
    ('Poisson'),
    ('Crustaces'),
    ('Soja'),
    ('Moutarde'),
    ('Celeri'),
    ('Sulfites'),
    ('Sesame');


-- =====================================================================
-- INSERTION : horaires
-- =====================================================================
INSERT INTO horaire (jour, heure_ouverture, heure_fermeture) VALUES
    ('Lundi', '09:00', '19:00'),
    ('Mardi', '09:00', '19:00'),
    ('Mercredi', '09:00', '19:00'),
    ('Jeudi', '09:00', '19:00'),
    ('Vendredi', '09:00', '20:00'),
    ('Samedi', '10:00', '20:00'),
    ('Dimanche', '10:00', '14:00');


-- =====================================================================
-- INSERTION : plats
-- =====================================================================
INSERT INTO plat (titre, type, photo) VALUES
    -- entrees
    ('Foie gras maison sur pain d''epices', 'entree', '/images/plats/foie_gras.jpg'),
    ('Velloute de potimarron a la chataigne', 'entree', '/images/plats/veloute_potimarron.jpg'),
    ('Salade de chevre chaud aux noix', 'entree', '/images/plats/chevre_chaud.jpg'),
    ('Tartare de saumon a l''aneth', 'entree', '/images/plats/tartare_saumon.jpg'),
    ('Soupe de legumes du marche', 'entree', '/images/plats/soupe_legumes.jpg'),

    -- plats principaux
    ('Chapon farci aux marrons', 'plat', '/images/plats/chapon_marrons.jpg'),
    ('Filet de boeuf en croute', 'plat', '/images/plats/filet_boeuf.jpg'),
    ('Agneau de Paques aux herbes', 'plat', '/images/plats/agneau.jpg'),
    ('Risotto aux champignons', 'plat', '/images/plats/risotto.jpg'),
    ('Saumon en papillote', 'plat', '/images/plats/saumon_papillote.jpg'),
    ('Curry de legumes au lait de coco', 'plat', '/images/plats/curry_legumes.jpg'),

    -- desserts
    ('Buche de Noel chocolat-marrons', 'dessert', '/images/plats/buche.jpg'),
    ('Tarte au citron meringuee', 'dessert', '/images/plats/tarte_citron.jpg'),
    ('Salade de fruits frais', 'dessert', '/images/plats/salade_fruits.jpg'),
    ('Mousse au chocolat noir', 'dessert', '/images/plats/mousse_chocolat.jpg'),
    ('Pavlova aux fruits rouges', 'dessert', '/images/plats/pavlova.jpg');


-- =====================================================================
-- INSERTION : association plats / allergenes
-- =====================================================================
INSERT INTO contient (plat_id, allergene_id) VALUES
    (1, 1), (1, 2),  -- foie gras : gluten, lactose
    (2, 2),          -- veloute : lactose
    (3, 2), (3, 4),  -- chevre chaud : lactose, fruits a coque
    (4, 6),          -- tartare saumon : poisson
    (6, 1),          -- chapon : gluten
    (7, 1), (7, 2),  -- filet boeuf : gluten, lactose
    (9, 2),          -- risotto : lactose
    (10, 6),         -- saumon : poisson
    (12, 1), (12, 2), (12, 3),  -- buche : gluten, lactose, oeufs
    (13, 1), (13, 2), (13, 3),  -- tarte citron : gluten, lactose, oeufs
    (15, 2), (15, 3),           -- mousse chocolat : lactose, oeufs
    (16, 3);                    -- pavlova : oeufs


-- =====================================================================
-- INSERTION : menus
-- =====================================================================
INSERT INTO menu (titre, description, nombre_personnes_minimum, prix_par_personne, conditions, quantite_restante, theme_id) VALUES
    ('Menu de Noel Tradition', 'Un menu festif et traditionnel pour celebrer Noel en famille avec foie gras, chapon farci et buche.', 6, 65.00, 'Commande a passer minimum 7 jours avant la prestation. Conservation au frais 24h maximum.', 10, 2),
    ('Menu de Paques Printanier', 'Un menu fraicheur pour celebrer Paques avec agneau et tarte au citron.', 4, 55.00, 'Commande a passer minimum 5 jours avant la prestation.', 8, 3),
    ('Menu Classique du Chef', 'Notre menu signature avec saumon et filet de boeuf, parfait pour toutes occasions.', 4, 50.00, 'Commande a passer minimum 3 jours avant la prestation.', 15, 1),
    ('Menu Vegetarien Decouverte', 'Un menu 100% vegetarien aux saveurs du marche.', 4, 45.00, 'Commande a passer minimum 3 jours avant la prestation.', 12, 1),
    ('Menu Mariage Prestige', 'Notre menu d''exception pour vos plus beaux evenements.', 20, 85.00, 'Commande a passer minimum 30 jours avant la prestation. Devis personnalise possible.', 5, 5),
    ('Menu Anniversaire Convivial', 'Un menu chaleureux pour celebrer un anniversaire entre amis ou en famille.', 8, 48.00, 'Commande a passer minimum 7 jours avant la prestation.', 6, 6);


-- =====================================================================
-- INSERTION : association menus / plats
-- =====================================================================
INSERT INTO propose (menu_id, plat_id) VALUES
    -- Menu Noel Tradition (id 1) : foie gras, chapon, buche
    (1, 1), (1, 6), (1, 12),

    -- Menu Paques (id 2) : veloute, agneau, tarte citron
    (2, 2), (2, 8), (2, 13),

    -- Menu Classique (id 3) : tartare saumon, filet boeuf, mousse chocolat
    (3, 4), (3, 7), (3, 15),

    -- Menu Vegetarien (id 4) : soupe legumes, curry legumes, salade fruits
    (4, 5), (4, 11), (4, 14),

    -- Menu Mariage (id 5) : foie gras, filet boeuf, pavlova
    (5, 1), (5, 7), (5, 16),

    -- Menu Anniversaire (id 6) : chevre chaud, risotto, mousse chocolat
    (6, 3), (6, 9), (6, 15);


-- =====================================================================
-- INSERTION : association menus / regimes
-- =====================================================================
INSERT INTO adopte (menu_id, regime_id) VALUES
    (1, 1),         -- Noel : Classique
    (2, 1),         -- Paques : Classique
    (3, 1),         -- Classique : Classique
    (4, 1), (4, 2), (4, 3),  -- Vegetarien : Classique, Vegetarien, Vegan
    (5, 1),         -- Mariage : Classique
    (6, 1), (6, 2); -- Anniversaire : Classique, Vegetarien


-- =====================================================================
-- INSERTION : commandes (de test)
-- =====================================================================
INSERT INTO commande (numero_commande, date_commande, date_prestation, heure_livraison, lieu_livraison, nombre_personnes, prix_menu, prix_livraison, statut, pret_materiel, utilisateur_id, menu_id) VALUES
    ('CMD-2026-0001', '2026-04-01', '2026-04-15', '12:00', '8 rue des Vignes, Bordeaux', 4, 200.00, 0.00, 'terminee', FALSE, 3, 3),
    ('CMD-2026-0002', '2026-04-15', '2026-05-10', '19:00', '22 boulevard de la Plage, Talence', 6, 360.00, 12.00, 'accepte', FALSE, 4, 4),
    ('CMD-2026-0003', '2026-04-20', '2026-05-20', '13:00', '5 rue du Cassoulet, Pessac', 8, 384.00, 15.00, 'en_attente', FALSE, 5, 6),
    ('CMD-2026-0004', '2026-04-25', '2026-06-01', '20:00', '8 rue des Vignes, Bordeaux', 4, 220.00, 0.00, 'en_preparation', FALSE, 3, 2);


-- =====================================================================
-- INSERTION : avis (de test)
-- =====================================================================
INSERT INTO avis (note, description, statut, utilisateur_id) VALUES
    (5, 'Un menu absolument delicieux ! L''equipe est tres professionnelle et a l''ecoute. Je recommande vivement.', 'valide', 3),
    (4, 'Tres bonne prestation, plats savoureux et bien presentes. Petit bemol sur la livraison un peu en retard.', 'valide', 4),
    (5, 'Un service au top, des saveurs au rendez-vous. Bravo a Julie et Jose !', 'en_attente', 5);


-- =====================================================================
-- INSERTION : association avis / commande
-- =====================================================================
INSERT INTO publie (avis_id, numero_commande) VALUES
    (1, 'CMD-2026-0001');


-- =====================================================================
-- FIN DU SCRIPT D'INSERTION
-- =====================================================================
