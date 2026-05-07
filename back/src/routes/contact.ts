// ============================================================
// ROUTES DU FORMULAIRE DE CONTACT
// Route publique : tout le monde peut envoyer un message
// ============================================================

import { Router } from "express";
import { envoyerMessage } from "../controleurs/contact";

const routeur = Router();

// POST /api/contact : envoyer un message
routeur.post("/", envoyerMessage);

export default routeur;
