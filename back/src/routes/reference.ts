// Routes des donnees de reference (themes, regimes, allergenes)
// Toutes en lecture seule et publiques.

import { Router } from "express";
import {
    listerThemes,
    listerRegimes,
    listerAllergenes,
} from "../controleurs/reference";

const routeur = Router();

routeur.get("/themes", listerThemes);
routeur.get("/regimes", listerRegimes);
routeur.get("/allergenes", listerAllergenes);

export default routeur;
