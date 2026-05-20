// Routes des parametres de l'application.

import { Router } from "express";
import { listerParametres, modifierParametres } from "../controleurs/parametre";
import { estAdmin } from "../middlewares/auth";

const routeur = Router();

// Lecture publique (utilisee par le front)
routeur.get("/", listerParametres);

// Modification reservee aux admins
routeur.put("/", estAdmin, modifierParametres);

export default routeur;
