// ============================================================
// ROUTES DES COMMANDES
// Definit les URLs pour la gestion des commandes
// ============================================================

import { Router } from "express";
import {
    creerCommande,
    listerCommandes,
    detailCommande,
    modifierStatutCommande,
    annulerCommande,
    obtenirHistoriqueCommande,
} from "../controleurs/commande";
import { estConnecte, estEmploye } from "../middlewares/auth";

console.log("✅ Le fichier routes/commande.ts est bien charge !");

const routeur = Router();

// Toutes les routes de commandes necessitent d'etre connecte
routeur.use(estConnecte);

// Lister les commandes (selon le role)
routeur.get("/", listerCommandes);

// Voir le detail d'une commande
routeur.get("/:numero", detailCommande);

// Voir l'historique des statuts d'une commande
routeur.get("/:numero/historique", obtenirHistoriqueCommande);

// Creer une commande
routeur.post("/", creerCommande);

// Annuler une commande (utilisateur ou employe)
routeur.put("/:numero/annuler", annulerCommande);

// Modifier le statut (employe/admin uniquement)
routeur.put("/:numero/statut", estEmploye, modifierStatutCommande);

console.log("📋 Nombre de routes enregistrees :", routeur.stack.length);

export default routeur;