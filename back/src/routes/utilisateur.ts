// ============================================================
// ROUTES DES UTILISATEURS
// Definit les URLs pour la gestion des utilisateurs et profils
// ============================================================

import { Router } from "express";
import { 
    recupererProfil,
    modifierProfil,
    changerMotDePasse,
    desactiverPropreCompte,
    listerUtilisateurs,
    creerEmploye,
    modifierRole,
    desactiverUtilisateur,
    reactiverUtilisateur
} from "../controleurs/utilisateur";
import { estConnecte, estAdmin } from "../middlewares/auth";

const routeur = Router();

// ============================================================
// ROUTES PROFIL (utilisateurs connectes)
// ============================================================

// Recuperer son profil
routeur.get("/profil", estConnecte, recupererProfil);

// Modifier son profil
routeur.put("/profil", estConnecte, modifierProfil);

// Changer son mot de passe
routeur.put("/mot-de-passe", estConnecte, changerMotDePasse);

// Desactiver son propre compte
routeur.delete("/profil", estConnecte, desactiverPropreCompte);


// ============================================================
// ROUTES ADMIN (gestion globale)
// ============================================================

// Lister tous les utilisateurs (avec filtres role et actif)
routeur.get("/", estAdmin, listerUtilisateurs);

// Creer un compte employe
routeur.post("/employe", estAdmin, creerEmploye);

// Modifier le role d'un utilisateur
routeur.put("/:id/role", estAdmin, modifierRole);

// Desactiver un utilisateur
routeur.put("/:id/desactiver", estAdmin, desactiverUtilisateur);

// Reactiver un utilisateur
routeur.put("/:id/reactiver", estAdmin, reactiverUtilisateur);

export default routeur;
