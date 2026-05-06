// ============================================================
// ROUTES D'AUTHENTIFICATION
// Definit les URLs accessibles pour l'authentification
// ============================================================

import { Router } from "express";
import { inscription, connexion, deconnexion, moi } from "../controleurs/auth";

const routeur = Router();

// POST /api/auth/inscription : creer un compte
routeur.post("/inscription", inscription);

// POST /api/auth/connexion : se connecter
routeur.post("/connexion", connexion);

// POST /api/auth/deconnexion : se deconnecter
routeur.post("/deconnexion", deconnexion);

// GET /api/auth/moi : recuperer les infos de l'utilisateur connecte
routeur.get("/moi", moi);

export default routeur;
