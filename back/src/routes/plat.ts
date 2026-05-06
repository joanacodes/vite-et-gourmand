// ============================================================
// ROUTES DES PLATS
// Definit les URLs pour la gestion des plats
// ============================================================

import { Router } from "express";
import { listerPlats, detailPlat, creerPlat, modifierPlat, supprimerPlat } from "../controleurs/plat";
import { estEmploye } from "../middlewares/auth";

const routeur = Router();

// Routes publiques
routeur.get("/", listerPlats);
routeur.get("/:id", detailPlat);

// Routes reservees aux employes et admins
routeur.post("/", estEmploye, creerPlat);
routeur.put("/:id", estEmploye, modifierPlat);
routeur.delete("/:id", estEmploye, supprimerPlat);

export default routeur;
