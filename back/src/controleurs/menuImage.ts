// ============================================================
// CONTROLEUR DES IMAGES DE MENU
//
// Gere la galerie photo de chaque menu (Detail menu cote public,
// Creer/Modifier un menu cote admin).
//
// Routes :
// - GET    /api/menus/:menuId/images             -> lister (public)
// - POST   /api/menus/:menuId/images             -> ajouter (admin)
// - PUT    /api/menus/:menuId/images/:imageId    -> modifier (admin)
// - DELETE /api/menus/:menuId/images/:imageId    -> supprimer (admin)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";

// ============================================================
// LISTER LES IMAGES D'UN MENU
// GET /api/menus/:menuId/images
// Acces : public
// ============================================================
export async function listerImagesMenu(req: Request, res: Response) {
  try {
    const { menuId } = req.params;

    // Verifier que le menu existe
    const menuExiste = await pool.query(
      "SELECT menu_id FROM menu WHERE menu_id = $1",
      [menuId],
    );

    if (menuExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Menu introuvable" });
    }

    // Recuperer les images (principale en premier, puis par ordre d'affichage)
    const resultat = await pool.query(
      `SELECT image_id, menu_id, url, legende, est_principale, ordre_affichage, date_ajout
             FROM menu_image
             WHERE menu_id = $1
             ORDER BY est_principale DESC, ordre_affichage ASC, image_id ASC`,
      [menuId],
    );

    res.json({ images: resultat.rows });
  } catch (erreur) {
    console.error("Erreur lors de la recuperation des images du menu :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// AJOUTER UNE IMAGE A UN MENU
// POST /api/menus/:menuId/images
// Body : { url, legende?, estPrincipale? }
// Acces : employe, admin
//
// Si estPrincipale = true, on demote l'ancienne image principale (transaction).
// L'ordre_affichage est calcule automatiquement (max + 1).
// ============================================================
export async function ajouterImageMenu(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { menuId } = req.params;
    const { url, legende, estPrincipale } = req.body;

    // 1. Validation de l'url
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "L'URL de l'image est obligatoire" });
    }

    if (url.length > 500) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "L'URL ne peut pas depasser 500 caracteres" });
    }

    // 2. Validation de la legende (optionnelle mais limitee)
    if (legende !== undefined && legende !== null && legende.length > 200) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "La legende ne peut pas depasser 200 caracteres" });
    }

    // 3. Verifier que le menu existe
    const menuExiste = await client.query(
      "SELECT menu_id FROM menu WHERE menu_id = $1",
      [menuId],
    );

    if (menuExiste.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erreur: "Menu introuvable" });
    }

    // 4. Si l'image doit etre principale, on demote l'ancienne (un seul TRUE par menu)
    if (estPrincipale === true) {
      await client.query(
        "UPDATE menu_image SET est_principale = FALSE WHERE menu_id = $1 AND est_principale = TRUE",
        [menuId],
      );
    }

    // 5. Calcul automatique de l'ordre d'affichage (dernier + 1)
    const resultatOrdre = await client.query(
      "SELECT COALESCE(MAX(ordre_affichage), -1) AS max_ordre FROM menu_image WHERE menu_id = $1",
      [menuId],
    );
    const nouvelOrdre = resultatOrdre.rows[0].max_ordre + 1;

    // 6. Insertion de la nouvelle image
    const resultat = await client.query(
      `INSERT INTO menu_image (menu_id, url, legende, est_principale, ordre_affichage)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING image_id, menu_id, url, legende, est_principale, ordre_affichage, date_ajout`,
      [menuId, url.trim(), legende ? legende.trim() : null, estPrincipale === true, nouvelOrdre],
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Image ajoutee avec succes",
      image: resultat.rows[0],
    });
  } catch (erreur) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de l'ajout de l'image :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  } finally {
    client.release();
  }
}

// ============================================================
// MODIFIER UNE IMAGE DE MENU
// PUT /api/menus/:menuId/images/:imageId
// Body : { url?, legende?, estPrincipale?, ordreAffichage? }
// Acces : employe, admin
//
// Si on definit cette image comme principale, on demote l'ancienne (transaction).
// UPDATE dynamique : seuls les champs fournis sont modifies.
// ============================================================
export async function modifierImageMenu(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { menuId, imageId } = req.params;
    const { url, legende, estPrincipale, ordreAffichage } = req.body;

    // 1. Verifier que l'image existe et appartient bien au menu
    const imageExiste = await client.query(
      "SELECT image_id, menu_id FROM menu_image WHERE image_id = $1",
      [imageId],
    );

    if (imageExiste.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erreur: "Image introuvable" });
    }

    if (imageExiste.rows[0].menu_id !== parseInt(menuId as string)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "Cette image n'appartient pas a ce menu" });
    }

    // 2. Validations des champs fournis
    if (url !== undefined) {
      if (typeof url !== "string" || url.trim().length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ erreur: "L'URL ne peut pas etre vide" });
      }
      if (url.length > 500) {
        await client.query("ROLLBACK");
        return res.status(400).json({ erreur: "L'URL ne peut pas depasser 500 caracteres" });
      }
    }

    if (legende !== undefined && legende !== null && legende.length > 200) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "La legende ne peut pas depasser 200 caracteres" });
    }

    if (ordreAffichage !== undefined && (typeof ordreAffichage !== "number" || ordreAffichage < 0)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "L'ordre d'affichage doit etre un entier positif" });
    }

    // 3. Si on definit l'image comme principale, on demote l'ancienne
    if (estPrincipale === true) {
      await client.query(
        "UPDATE menu_image SET est_principale = FALSE WHERE menu_id = $1 AND est_principale = TRUE AND image_id != $2",
        [menuId, imageId],
      );
    }

    // 4. Construction dynamique de l'UPDATE (seuls les champs fournis)
    const champsModifies: string[] = [];
    const valeurs: any[] = [];
    let index = 1;

    if (url !== undefined) {
      champsModifies.push(`url = $${index++}`);
      valeurs.push(url.trim());
    }
    if (legende !== undefined) {
      champsModifies.push(`legende = $${index++}`);
      valeurs.push(legende ? legende.trim() : null);
    }
    if (estPrincipale !== undefined) {
      champsModifies.push(`est_principale = $${index++}`);
      valeurs.push(estPrincipale === true);
    }
    if (ordreAffichage !== undefined) {
      champsModifies.push(`ordre_affichage = $${index++}`);
      valeurs.push(ordreAffichage);
    }

    if (champsModifies.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erreur: "Aucune modification fournie" });
    }

    // Ajout de l'imageId pour le WHERE
    valeurs.push(imageId);

    const resultat = await client.query(
      `UPDATE menu_image SET ${champsModifies.join(", ")} 
             WHERE image_id = $${index}
             RETURNING image_id, menu_id, url, legende, est_principale, ordre_affichage, date_ajout`,
      valeurs,
    );

    await client.query("COMMIT");

    res.json({
      message: "Image modifiee avec succes",
      image: resultat.rows[0],
    });
  } catch (erreur) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la modification de l'image :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  } finally {
    client.release();
  }
}

// ============================================================
// SUPPRIMER UNE IMAGE DE MENU
// DELETE /api/menus/:menuId/images/:imageId
// Acces : employe, admin
// ============================================================
export async function supprimerImageMenu(req: Request, res: Response) {
  try {
    const { menuId, imageId } = req.params;

    // 1. Verifier que l'image existe et appartient bien au menu
    const imageExiste = await pool.query(
      "SELECT image_id, menu_id FROM menu_image WHERE image_id = $1",
      [imageId],
    );

    if (imageExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Image introuvable" });
    }

    if (imageExiste.rows[0].menu_id !== parseInt(menuId as string)) {
      return res.status(400).json({ erreur: "Cette image n'appartient pas a ce menu" });
    }

    // 2. Suppression
    await pool.query(
      "DELETE FROM menu_image WHERE image_id = $1",
      [imageId],
    );

    res.json({ message: "Image supprimee avec succes" });
  } catch (erreur) {
    console.error("Erreur lors de la suppression de l'image :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}
