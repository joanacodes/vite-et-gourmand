// ============================================================
// ROUTES DES HORAIRES
//
// URL de base : /api/horaires
//
// Lecture publique (page Contact, Accueil, footer),
// modification reservee aux admins.
// ============================================================

import { Router } from "express";
import {
    listerHoraires,
    modifierHoraires,
} from "../controleurs/horaire";
import { estAdmin } from "../middlewares/auth";

console.log("✅ Le fichier routes/horaire.ts est bien charge !");

const routeur = Router();

// Lister les horaires (public, affichage page Contact/Accueil/footer)
routeur.get("/", listerHoraires);

// Modifier les horaires d'un jour (admin uniquement)
routeur.put("/:id", estAdmin, modifierHoraires);

export default routeur;
