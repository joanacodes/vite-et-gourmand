// ============================================================
// ROUTES DES AVIS
// Definit les URLs pour la gestion des avis
// ============================================================

import { Router } from "express";
import { 
    listerAvis, 
    avisParMenu, 
    creerAvis, 
    modifierAvis, 
    supprimerAvis, 
    modererAvis,
    listerAvisPourModeration
} from "../controleurs/avis";
import { estConnecte, estEmploye } from "../middlewares/auth";

const routeur = Router();

// Routes publiques (tout le monde peut lire les avis publies)
routeur.get("/", listerAvis);
routeur.get("/menu/:id", avisParMenu);

// Routes pour les employes/admins (moderation)
// IMPORTANT : declarer cette route AVANT /:id pour qu'elle soit prioritaire
routeur.get("/moderation", estEmploye, listerAvisPourModeration);
routeur.put("/:id/moderer", estEmploye, modererAvis);

// Routes pour les utilisateurs connectes
routeur.post("/", estConnecte, creerAvis);
routeur.put("/:id", estConnecte, modifierAvis);
routeur.delete("/:id", estConnecte, supprimerAvis);

export default routeur;
