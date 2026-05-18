-- ============================================================
-- MISE A JOUR DES PHOTOS DES PLATS - URLs Unsplash
-- Version corrigee : update par plat_id (plus fiable que par titre)
-- ============================================================

-- === ENTREES (plat_id 1 a 5) ===

UPDATE plat SET photo = 'https://images.unsplash.com/photo-1625938145744-533e82c0d2a5?w=600&q=80' WHERE plat_id = 1; -- Foie gras
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80' WHERE plat_id = 2; -- Veloute potimarron
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80' WHERE plat_id = 3; -- Salade chevre
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80' WHERE plat_id = 4; -- Tartare saumon
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1547308283-b941a3a0a6d3?w=600&q=80' WHERE plat_id = 5; -- Soupe legumes

-- === PLATS PRINCIPAUX (plat_id 6 a 11) ===

UPDATE plat SET photo = 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=600&q=80' WHERE plat_id = 6;  -- Chapon farci
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80' WHERE plat_id = 7;  -- Filet boeuf
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' WHERE plat_id = 8;  -- Agneau
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1633964913295-ceb43826a07f?w=600&q=80' WHERE plat_id = 9;  -- Risotto
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80' WHERE plat_id = 10; -- Saumon papillote
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80' WHERE plat_id = 11; -- Curry legumes

-- === DESSERTS (plat_id 12 a 16) ===

UPDATE plat SET photo = 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=600&q=80' WHERE plat_id = 12; -- Buche
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80' WHERE plat_id = 13; -- Tarte citron
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80' WHERE plat_id = 14; -- Salade fruits
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=600&q=80' WHERE plat_id = 15; -- Mousse choco
UPDATE plat SET photo = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80' WHERE plat_id = 16; -- Pavlova


-- ============================================================
-- VERIFICATION : doit afficher tous les plats avec une URL Unsplash
-- ============================================================

SELECT plat_id, titre, type,
       CASE
           WHEN photo LIKE 'https://images.unsplash.com%' THEN 'OK'
           WHEN photo IS NULL THEN 'NULL'
           ELSE 'ANCIEN'
       END AS statut
FROM plat
ORDER BY plat_id;
