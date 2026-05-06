// ============================================================
// ROUTES DES MENUS
// Definit les URLs pour la gestion des menus
// ============================================================

import { Router } from "express";
import { listerMenus, detailMenu, creerMenu, modifierMenu, supprimerMenu } from "../controleurs/menu";
import { estEmploye } from "../middlewares/auth";

const routeur = Router();

// Routes publiques (accessibles a tous, meme non connectes)
routeur.get("/", listerMenus);
routeur.get("/:id", detailMenu);

// Routes reservees aux employes et admins
routeur.post("/", estEmploye, creerMenu);
routeur.put("/:id", estEmploye, modifierMenu);
routeur.delete("/:id", estEmploye, supprimerMenu);

export default routeur;
