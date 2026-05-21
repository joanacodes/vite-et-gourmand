// ============================================================
// ROUTES D'UPLOAD D'IMAGES
// ============================================================
// POST /api/upload/:categorie    -> upload une image (admin/employe)
// DELETE /api/upload/:categorie/:fichier -> supprime une image
//
// Categories acceptees : "plats", "menus"
// ============================================================

import { Router } from "express";
import {
    uploadImage,
    gererUpload,
    supprimerImage,
    gererErreurMulter,
} from "../controleurs/upload";
import { estEmploye } from "../middlewares/auth";

const routeur = Router();

// Upload (champ form : "image")
routeur.post(
    "/:categorie",
    estEmploye,
    uploadImage.single("image"),
    gererErreurMulter,
    gererUpload,
);

// Suppression
routeur.delete("/:categorie/:fichier", estEmploye, supprimerImage);

export default routeur;
