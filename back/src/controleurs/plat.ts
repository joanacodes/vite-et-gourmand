// ============================================================
// CONTROLEUR DES PLATS
// Contient toute la logique pour :
// - Lister les plats (avec filtres)
// - Voir le detail d'un plat
// - Creer un plat (employe/admin)
// - Modifier un plat (employe/admin)
// - Supprimer un plat (employe/admin)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";


// ============================================================
// LISTER TOUS LES PLATS (avec filtres)
// GET /api/plats
// Filtres possibles (query params) :
// - type : "entree", "plat", ou "dessert"
// - sansAllergene : id de l'allergene a exclure
// ============================================================
export async function listerPlats(req: Request, res: Response) {
    try {
        const { type, sansAllergene } = req.query;

        // Requete de base : recupere tous les plats avec leurs allergenes
        let requete = `
            SELECT p.plat_id, p.titre, p.type, p.photo
            FROM plat p
        `;

        const conditions: string[] = [];
        const parametres: any[] = [];
        let indexParam = 1;

        // Filtre par type de plat
        if (type) {
            conditions.push(`p.type = $${indexParam}`);
            parametres.push(type);
            indexParam++;
        }

        // Filtre : exclure les plats contenant un allergene specifique
        if (sansAllergene) {
            conditions.push(`p.plat_id NOT IN (
                SELECT plat_id FROM contient WHERE allergene_id = $${indexParam}
            )`);
            parametres.push(parseInt(sansAllergene as string));
            indexParam++;
        }

        if (conditions.length > 0) {
            requete += ` WHERE ` + conditions.join(" AND ");
        }

        requete += ` ORDER BY p.type, p.plat_id`;

        const resultat = await pool.query(requete, parametres);

        // Pour chaque plat, on recupere ses allergenes
        const plats = [];
        for (const plat of resultat.rows) {
            const resultatAllergenes = await pool.query(
                `SELECT a.allergene_id, a.libelle
                 FROM allergene a
                 JOIN contient c ON a.allergene_id = c.allergene_id
                 WHERE c.plat_id = $1`,
                [plat.plat_id]
            );
            plats.push({
                ...plat,
                allergenes: resultatAllergenes.rows
            });
        }

        res.json({
            plats: plats,
            nombre: plats.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des plats :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// VOIR LE DETAIL D'UN PLAT
// GET /api/plats/:id
// ============================================================
export async function detailPlat(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const resultat = await pool.query(
            `SELECT p.plat_id, p.titre, p.type, p.photo
             FROM plat p
             WHERE p.plat_id = $1`,
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Plat introuvable" });
        }

        const plat = resultat.rows[0];

        // Recuperation des allergenes
        const resultatAllergenes = await pool.query(
            `SELECT a.allergene_id, a.libelle
             FROM allergene a
             JOIN contient c ON a.allergene_id = c.allergene_id
             WHERE c.plat_id = $1`,
            [id]
        );

        // Recuperation des menus dans lesquels ce plat est utilise
        const resultatMenus = await pool.query(
            `SELECT m.menu_id, m.titre
             FROM menu m
             JOIN propose pr ON m.menu_id = pr.menu_id
             WHERE pr.plat_id = $1`,
            [id]
        );

        res.json({
            plat: {
                ...plat,
                allergenes: resultatAllergenes.rows,
                menus: resultatMenus.rows
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation du plat :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// CREER UN PLAT
// POST /api/plats
// Reserve aux employes et admins
// Body : { titre, type, photo, allergenes: [] }
// ============================================================
export async function creerPlat(req: Request, res: Response) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { titre, type, photo, allergenes } = req.body;

        // Verification des champs obligatoires
        if (!titre || !type) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Les champs titre et type sont obligatoires"
            });
        }

        // Verification que le type est valide
        if (!["entree", "plat", "dessert"].includes(type)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Le type doit etre 'entree', 'plat' ou 'dessert'"
            });
        }

        // Insertion du plat
        const resultat = await client.query(
            `INSERT INTO plat (titre, type, photo)
             VALUES ($1, $2, $3)
             RETURNING plat_id`,
            [titre, type, photo || null]
        );

        const nouveauPlatId = resultat.rows[0].plat_id;

        // Association des allergenes si fournis
        if (allergenes && Array.isArray(allergenes) && allergenes.length > 0) {
            for (const allergeneId of allergenes) {
                await client.query(
                    `INSERT INTO contient (plat_id, allergene_id) VALUES ($1, $2)`,
                    [nouveauPlatId, allergeneId]
                );
            }
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Plat cree avec succes",
            platId: nouveauPlatId
        });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la creation du plat :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// MODIFIER UN PLAT
// PUT /api/plats/:id
// Reserve aux employes et admins
// ============================================================
export async function modifierPlat(req: Request, res: Response) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { titre, type, photo, allergenes } = req.body;

        // Verification que le plat existe
        const platExiste = await client.query(
            "SELECT plat_id FROM plat WHERE plat_id = $1",
            [id]
        );

        if (platExiste.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ erreur: "Plat introuvable" });
        }

        // Verification du type si fourni
        if (type && !["entree", "plat", "dessert"].includes(type)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Le type doit etre 'entree', 'plat' ou 'dessert'"
            });
        }

        // Mise a jour du plat
        await client.query(
            `UPDATE plat 
             SET titre = $1, type = $2, photo = $3
             WHERE plat_id = $4`,
            [titre, type, photo, id]
        );

        // Si on a fourni des allergenes, on remplace tous les allergenes du plat
        if (allergenes && Array.isArray(allergenes)) {
            await client.query("DELETE FROM contient WHERE plat_id = $1", [id]);
            
            for (const allergeneId of allergenes) {
                await client.query(
                    `INSERT INTO contient (plat_id, allergene_id) VALUES ($1, $2)`,
                    [id, allergeneId]
                );
            }
        }

        await client.query("COMMIT");

        res.json({ message: "Plat modifie avec succes" });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la modification du plat :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// SUPPRIMER UN PLAT
// DELETE /api/plats/:id
// Reserve aux employes et admins
// ============================================================
export async function supprimerPlat(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // Verification que le plat existe
        const platExiste = await pool.query(
            "SELECT plat_id FROM plat WHERE plat_id = $1",
            [id]
        );

        if (platExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Plat introuvable" });
        }

        // Verification que le plat n'est pas utilise dans un menu
        const menusLies = await pool.query(
            "SELECT COUNT(*) AS nb FROM propose WHERE plat_id = $1",
            [id]
        );

        if (parseInt(menusLies.rows[0].nb) > 0) {
            return res.status(409).json({
                erreur: "Impossible de supprimer ce plat car il est utilise dans un ou plusieurs menus"
            });
        }

        // Suppression (les associations dans "contient" sont supprimees automatiquement grace au CASCADE)
        await pool.query("DELETE FROM plat WHERE plat_id = $1", [id]);

        res.json({ message: "Plat supprime avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la suppression du plat :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
