-- ============================================================
-- MIGRATION : HISTORIQUE DES STATUTS DE COMMANDE
-- "Le suivi de la commande enumere tous les etats de sa commande
--  suivi de la date et l'heure de modification."
-- ============================================================

-- 1. Creation de la table d'historique
CREATE TABLE IF NOT EXISTS commande_statut_historique (
    historique_id SERIAL PRIMARY KEY,
    numero_commande VARCHAR(50) NOT NULL REFERENCES commande(numero_commande) ON DELETE CASCADE,
    statut VARCHAR(50) NOT NULL,
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_par INT REFERENCES utilisateur(utilisateur_id),
    commentaire TEXT
);

-- 2. Index pour optimiser les requetes
CREATE INDEX IF NOT EXISTS idx_historique_numero_commande 
    ON commande_statut_historique(numero_commande);

CREATE INDEX IF NOT EXISTS idx_historique_date 
    ON commande_statut_historique(date_modification DESC);

-- 3. Initialisation : creer une entree pour les commandes existantes
INSERT INTO commande_statut_historique (numero_commande, statut, date_modification)
SELECT numero_commande, statut, COALESCE(date_commande::timestamp, NOW())
FROM commande
WHERE NOT EXISTS (
    SELECT 1 FROM commande_statut_historique h
    WHERE h.numero_commande = commande.numero_commande
);

-- 4. Verification
SELECT 
    h.historique_id, 
    h.numero_commande, 
    h.statut, 
    h.date_modification
FROM commande_statut_historique h
ORDER BY h.date_modification DESC;