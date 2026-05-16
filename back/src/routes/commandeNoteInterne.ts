// ============================================================
// ROUTES DES NOTES INTERNES DE COMMANDE
//
// Toutes ces routes necessitent d'etre connecte ET d'etre employe/admin.
// Les notes sont INVISIBLES aux clients.
//
// URL de base : /api/commandes/:numero/notes-internes
// (montee dans index.ts via app.use)
// ============================================================

import { Router } from "express";
import {
    listerNotesInternes,
    ajouterNoteInterne,
    modifierNoteInterne,
    supprimerNoteInterne,
} from "../controleurs/commandeNoteInterne";
import { estConnecte, estEmploye } from "../middlewares/auth";

console.log("✅ Le fichier routes/commandeNoteInterne.ts est bien charge !");

// mergeParams: true permet de recuperer :numero depuis l'URL parente
const routeur = Router({ mergeParams: true });

// Toutes les routes des notes internes necessitent :
// - d'etre connecte (estConnecte)
// - d'avoir un role employe ou administrateur (estEmploye)
routeur.use(estConnecte, estEmploye);

// Lister les notes internes d'une commande
routeur.get("/", listerNotesInternes);

// Ajouter une note interne
routeur.post("/", ajouterNoteInterne);

// Modifier une note interne (auteur uniquement)
routeur.put("/:noteId", modifierNoteInterne);

// Supprimer une note interne (auteur ou admin)
routeur.delete("/:noteId", supprimerNoteInterne);

console.log("📋 Nombre de routes notes internes :", routeur.stack.length);

export default routeur;
