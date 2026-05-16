// ============================================================
// ROUTES DES IMAGES DE MENU
//
// URL de base : /api/menus/:menuId/images
// (montee dans index.ts via app.use)
//
// Lecture publique (utile pour le front public),
// ecriture reservee aux employes/admins.
// ============================================================

import { Router } from "express";
import {
    listerImagesMenu,
    ajouterImageMenu,
    modifierImageMenu,
    supprimerImageMenu,
} from "../controleurs/menuImage";
import { estEmploye } from "../middlewares/auth";

console.log("✅ Le fichier routes/menuImage.ts est bien charge !");

// mergeParams: true permet de recuperer :menuId depuis l'URL parente
const routeur = Router({ mergeParams: true });

// Lister les images d'un menu (public, pour l'affichage de la galerie)
routeur.get("/", listerImagesMenu);

// Ajouter une image (admin/employe uniquement)
routeur.post("/", estEmploye, ajouterImageMenu);

// Modifier une image (admin/employe uniquement)
routeur.put("/:imageId", estEmploye, modifierImageMenu);

// Supprimer une image (admin/employe uniquement)
routeur.delete("/:imageId", estEmploye, supprimerImageMenu);

export default routeur;
