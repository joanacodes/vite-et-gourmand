-- =====================================================================
-- SCRIPT DE CREATION DES TABLES - PROJET VITE & GOURMAND
-- Base de donnees : PostgreSQL
-- Auteur : Joana
-- Date : 2026
-- =====================================================================

-- Supprime les tables si elles existent (utile pour reinitialiser la base)
-- ATTENTION : ces DROP suppriment toutes les donnees !
DROP TABLE IF EXISTS contient CASCADE;
DROP TABLE IF EXISTS propose CASCADE;
DROP TABLE IF EXISTS adopte CASCADE;
DROP TABLE IF EXISTS publie CASCADE;
DROP TABLE IF EXISTS possede CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS commande CASCADE;
DROP TABLE IF EXISTS plat CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS allergene CASCADE;
DROP TABLE IF EXISTS theme CASCADE;
DROP TABLE IF EXISTS regime CASCADE;
DROP TABLE IF EXISTS horaire CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;
DROP TABLE IF EXISTS role CASCADE;


-- =====================================================================
-- TABLE : role
-- Stocke les differents roles (utilisateur, employe, administrateur)
-- =====================================================================
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- TABLE : utilisateur
-- Stocke tous les comptes (visiteurs inscrits, employes, admins)
-- =====================================================================
CREATE TABLE utilisateur (
    utilisateur_id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL, -- mot de passe hashe avec bcrypt
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    telephone VARCHAR(20),
    ville VARCHAR(100),
    pays VARCHAR(100),
    adresse_postale VARCHAR(255),
    actif BOOLEAN NOT NULL DEFAULT TRUE, -- pour desactiver un employe par exemple
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role_id INT NOT NULL,
    CONSTRAINT fk_utilisateur_role FOREIGN KEY (role_id) REFERENCES role(role_id)
);


-- =====================================================================
-- TABLE : theme
-- Themes possibles d'un menu (Noel, Paques, classique, evenement)
-- =====================================================================
CREATE TABLE theme (
    theme_id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- TABLE : regime
-- Regimes alimentaires possibles (vegetarien, vegan, classique...)
-- =====================================================================
CREATE TABLE regime (
    regime_id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- TABLE : allergene
-- Liste des allergenes possibles (gluten, lactose, fruits a coque...)
-- =====================================================================
CREATE TABLE allergene (
    allergene_id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- TABLE : horaire
-- Horaires d'ouverture du lundi au dimanche
-- =====================================================================
CREATE TABLE horaire (
    horaire_id SERIAL PRIMARY KEY,
    jour VARCHAR(20) NOT NULL UNIQUE,
    heure_ouverture VARCHAR(10),
    heure_fermeture VARCHAR(10)
);


-- =====================================================================
-- TABLE : menu
-- Stocke les menus proposes par le traiteur
-- =====================================================================
CREATE TABLE menu (
    menu_id SERIAL PRIMARY KEY,
    titre VARCHAR(100) NOT NULL,
    description TEXT,
    nombre_personnes_minimum INT NOT NULL,
    prix_par_personne DECIMAL(10, 2) NOT NULL,
    conditions TEXT, -- conditions specifiques (delai, stockage...)
    quantite_restante INT NOT NULL DEFAULT 0, -- stock disponible
    theme_id INT NOT NULL,
    CONSTRAINT fk_menu_theme FOREIGN KEY (theme_id) REFERENCES theme(theme_id)
);


-- =====================================================================
-- TABLE : plat
-- Stocke les plats (entrees, plats principaux, desserts)
-- =====================================================================
CREATE TABLE plat (
    plat_id SERIAL PRIMARY KEY,
    titre VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'entree', 'plat', 'dessert'
    photo VARCHAR(255) -- chemin de la photo du plat
);


-- =====================================================================
-- TABLE : commande
-- Stocke les commandes passees par les utilisateurs
-- =====================================================================
CREATE TABLE commande (
    numero_commande VARCHAR(50) PRIMARY KEY,
    date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_prestation DATE NOT NULL,
    heure_livraison VARCHAR(10),
    lieu_livraison VARCHAR(255),
    nombre_personnes INT NOT NULL,
    prix_menu DECIMAL(10, 2) NOT NULL,
    prix_livraison DECIMAL(10, 2) NOT NULL DEFAULT 0,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente', 
    -- statuts : en_attente, accepte, en_preparation, en_livraison, 
    -- livre, en_attente_retour_materiel, terminee, annulee
    pret_materiel BOOLEAN NOT NULL DEFAULT FALSE,
    motif_annulation TEXT,
    mode_contact_annulation VARCHAR(50), -- 'GSM' ou 'mail'
    utilisateur_id INT NOT NULL,
    menu_id INT NOT NULL,
    CONSTRAINT fk_commande_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(utilisateur_id),
    CONSTRAINT fk_commande_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id)
);


-- =====================================================================
-- TABLE : avis
-- Stocke les avis laisses par les utilisateurs sur leurs commandes
-- =====================================================================
CREATE TABLE avis (
    avis_id SERIAL PRIMARY KEY,
    note INT NOT NULL CHECK (note >= 1 AND note <= 5),
    description TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente', -- 'valide', 'refuse', 'en_attente'
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id INT NOT NULL,
    CONSTRAINT fk_avis_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(utilisateur_id)
);


-- =====================================================================
-- TABLES D'ASSOCIATION (relations N-N)
-- =====================================================================

-- Association : un menu propose plusieurs plats / un plat est dans plusieurs menus
CREATE TABLE propose (
    menu_id INT NOT NULL,
    plat_id INT NOT NULL,
    PRIMARY KEY (menu_id, plat_id),
    CONSTRAINT fk_propose_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE,
    CONSTRAINT fk_propose_plat FOREIGN KEY (plat_id) REFERENCES plat(plat_id) ON DELETE CASCADE
);

-- Association : un menu adopte plusieurs regimes / un regime concerne plusieurs menus
CREATE TABLE adopte (
    menu_id INT NOT NULL,
    regime_id INT NOT NULL,
    PRIMARY KEY (menu_id, regime_id),
    CONSTRAINT fk_adopte_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE,
    CONSTRAINT fk_adopte_regime FOREIGN KEY (regime_id) REFERENCES regime(regime_id) ON DELETE CASCADE
);

-- Association : un plat contient plusieurs allergenes
CREATE TABLE contient (
    plat_id INT NOT NULL,
    allergene_id INT NOT NULL,
    PRIMARY KEY (plat_id, allergene_id),
    CONSTRAINT fk_contient_plat FOREIGN KEY (plat_id) REFERENCES plat(plat_id) ON DELETE CASCADE,
    CONSTRAINT fk_contient_allergene FOREIGN KEY (allergene_id) REFERENCES allergene(allergene_id) ON DELETE CASCADE
);

-- Association : un avis concerne une commande (un avis = une commande)
CREATE TABLE publie (
    avis_id INT NOT NULL,
    numero_commande VARCHAR(50) NOT NULL,
    PRIMARY KEY (avis_id, numero_commande),
    CONSTRAINT fk_publie_avis FOREIGN KEY (avis_id) REFERENCES avis(avis_id) ON DELETE CASCADE,
    CONSTRAINT fk_publie_commande FOREIGN KEY (numero_commande) REFERENCES commande(numero_commande) ON DELETE CASCADE
);


-- =====================================================================
-- INDEX UTILES POUR LES PERFORMANCES
-- =====================================================================
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_commande_utilisateur ON commande(utilisateur_id);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_menu_theme ON menu(theme_id);


-- =====================================================================
-- FIN DU SCRIPT DE CREATION
-- Pour executer ce script :
-- 1. Ouvrir pgAdmin
-- 2. Se connecter a la base 'vite_et_gourmand'
-- 3. Ouvrir le Query Tool (icone eclair)
-- 4. Coller ce script et l'executer (F5)
-- =====================================================================
