// ============================================================
// CONTROLEUR DES MENUS
// Contient toute la logique pour :
// - Lister les menus (avec filtres)
// - Voir le detail d'un menu
// - Creer un menu (employe/admin)
// - Modifier un menu (employe/admin)
// - Supprimer un menu (employe/admin)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";


// ============================================================
// LISTER TOUS LES MENUS (avec filtres)
// GET /api/menus
// Filtres possibles (query params) :
// - prixMax : prix maximum par personne
// - prixMin : prix minimum par personne
// - themeId : id du theme
// - regimeId : id du regime
// - personnesMin : nombre minimum de personnes
// ============================================================
export async function listerMenus(req: Request, res: Response) {
    try {
        // On recupere les filtres dans la query string
        const { prixMax, prixMin, themeId, regimeId, personnesMin } = req.query;

        // On construit la requete SQL dynamiquement
        let requete = `
            SELECT DISTINCT m.menu_id, m.titre, m.description, m.nombre_personnes_minimum, 
                   m.prix_par_personne, m.conditions, m.quantite_restante,
                   t.libelle AS theme
            FROM menu m
            JOIN theme t ON m.theme_id = t.theme_id
        `;

        // Si on filtre par regime, on doit faire une jointure avec la table "adopte"
        if (regimeId) {
            requete += ` JOIN adopte a ON m.menu_id = a.menu_id`;
        }

        // Tableau des conditions WHERE et des parametres
        const conditions: string[] = [];
        const parametres: any[] = [];
        let indexParam = 1;

        if (prixMax) {
            conditions.push(`m.prix_par_personne <= $${indexParam}`);
            parametres.push(parseFloat(prixMax as string));
            indexParam++;
        }

        if (prixMin) {
            conditions.push(`m.prix_par_personne >= $${indexParam}`);
            parametres.push(parseFloat(prixMin as string));
            indexParam++;
        }

        if (themeId) {
            conditions.push(`m.theme_id = $${indexParam}`);
            parametres.push(parseInt(themeId as string));
            indexParam++;
        }

        if (regimeId) {
            conditions.push(`a.regime_id = $${indexParam}`);
            parametres.push(parseInt(regimeId as string));
            indexParam++;
        }

        if (personnesMin) {
            conditions.push(`m.nombre_personnes_minimum >= $${indexParam}`);
            parametres.push(parseInt(personnesMin as string));
            indexParam++;
        }

        // On ajoute les conditions a la requete
        if (conditions.length > 0) {
            requete += ` WHERE ` + conditions.join(" AND ");
        }

        requete += ` ORDER BY m.menu_id`;

        // Execution de la requete
        const resultat = await pool.query(requete, parametres);

        res.json({
            menus: resultat.rows,
            nombre: resultat.rows.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des menus :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// VOIR LE DETAIL D'UN MENU
// GET /api/menus/:id
// Retourne le menu avec ses plats, allergenes, regimes
// ============================================================
export async function detailMenu(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // Recuperation du menu
        const resultatMenu = await pool.query(
            `SELECT m.menu_id, m.titre, m.description, m.nombre_personnes_minimum, 
                    m.prix_par_personne, m.conditions, m.quantite_restante,
                    t.libelle AS theme, t.theme_id
             FROM menu m
             JOIN theme t ON m.theme_id = t.theme_id
             WHERE m.menu_id = $1`,
            [id]
        );

        if (resultatMenu.rows.length === 0) {
            return res.status(404).json({ erreur: "Menu introuvable" });
        }

        const menu = resultatMenu.rows[0];

        // Recuperation des plats du menu (avec leurs allergenes)
        const resultatPlats = await pool.query(
            `SELECT p.plat_id, p.titre, p.type, p.photo
             FROM plat p
             JOIN propose pr ON p.plat_id = pr.plat_id
             WHERE pr.menu_id = $1
             ORDER BY 
                CASE p.type 
                    WHEN 'entree' THEN 1 
                    WHEN 'plat' THEN 2 
                    WHEN 'dessert' THEN 3 
                END`,
            [id]
        );

        // Pour chaque plat, on recupere ses allergenes
        const plats = [];
        for (const plat of resultatPlats.rows) {
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

        // Recuperation des regimes du menu
        const resultatRegimes = await pool.query(
            `SELECT r.regime_id, r.libelle
             FROM regime r
             JOIN adopte a ON r.regime_id = a.regime_id
             WHERE a.menu_id = $1`,
            [id]
        );

        // Reponse complete
        res.json({
            menu: {
                ...menu,
                plats: plats,
                regimes: resultatRegimes.rows
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation du menu :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// CREER UN MENU
// POST /api/menus
// Reserve aux employes et admins
// Body : { titre, description, nombrePersonnesMinimum, prixParPersonne, 
//          conditions, quantiteRestante, themeId, plats: [], regimes: [] }
// ============================================================
export async function creerMenu(req: Request, res: Response) {
    // On utilise une transaction car on touche plusieurs tables
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { 
            titre, 
            description, 
            nombrePersonnesMinimum, 
            prixParPersonne, 
            conditions, 
            quantiteRestante, 
            themeId,
            plats,    // tableau des id de plats
            regimes   // tableau des id de regimes
        } = req.body;

        // Verification des champs obligatoires
        if (!titre || !nombrePersonnesMinimum || !prixParPersonne || !themeId) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Les champs titre, nombrePersonnesMinimum, prixParPersonne et themeId sont obligatoires"
            });
        }

        // Insertion du menu
        const resultat = await client.query(
            `INSERT INTO menu (titre, description, nombre_personnes_minimum, prix_par_personne, conditions, quantite_restante, theme_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING menu_id`,
            [titre, description, nombrePersonnesMinimum, prixParPersonne, conditions, quantiteRestante || 0, themeId]
        );

        const nouveauMenuId = resultat.rows[0].menu_id;

        // Association des plats si fournis
        if (plats && Array.isArray(plats) && plats.length > 0) {
            for (const platId of plats) {
                await client.query(
                    `INSERT INTO propose (menu_id, plat_id) VALUES ($1, $2)`,
                    [nouveauMenuId, platId]
                );
            }
        }

        // Association des regimes si fournis
        if (regimes && Array.isArray(regimes) && regimes.length > 0) {
            for (const regimeId of regimes) {
                await client.query(
                    `INSERT INTO adopte (menu_id, regime_id) VALUES ($1, $2)`,
                    [nouveauMenuId, regimeId]
                );
            }
        }

        // Si tout s'est bien passe, on valide la transaction
        await client.query("COMMIT");

        res.status(201).json({
            message: "Menu cree avec succes",
            menuId: nouveauMenuId
        });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la creation du menu :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// MODIFIER UN MENU
// PUT /api/menus/:id
// Reserve aux employes et admins
// ============================================================
export async function modifierMenu(req: Request, res: Response) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { 
            titre, 
            description, 
            nombrePersonnesMinimum, 
            prixParPersonne, 
            conditions, 
            quantiteRestante, 
            themeId,
            plats,
            regimes
        } = req.body;

        // Verification que le menu existe
        const menuExiste = await client.query(
            "SELECT menu_id FROM menu WHERE menu_id = $1",
            [id]
        );

        if (menuExiste.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ erreur: "Menu introuvable" });
        }

        // Mise a jour du menu
        await client.query(
            `UPDATE menu 
             SET titre = $1, description = $2, nombre_personnes_minimum = $3, 
                 prix_par_personne = $4, conditions = $5, quantite_restante = $6, theme_id = $7
             WHERE menu_id = $8`,
            [titre, description, nombrePersonnesMinimum, prixParPersonne, conditions, quantiteRestante, themeId, id]
        );

        // Si on a fourni des plats, on remplace tous les plats du menu
        if (plats && Array.isArray(plats)) {
            // On supprime les anciennes associations
            await client.query("DELETE FROM propose WHERE menu_id = $1", [id]);
            
            // On ajoute les nouvelles
            for (const platId of plats) {
                await client.query(
                    `INSERT INTO propose (menu_id, plat_id) VALUES ($1, $2)`,
                    [id, platId]
                );
            }
        }

        // Idem pour les regimes
        if (regimes && Array.isArray(regimes)) {
            await client.query("DELETE FROM adopte WHERE menu_id = $1", [id]);
            
            for (const regimeId of regimes) {
                await client.query(
                    `INSERT INTO adopte (menu_id, regime_id) VALUES ($1, $2)`,
                    [id, regimeId]
                );
            }
        }

        await client.query("COMMIT");

        res.json({ message: "Menu modifie avec succes" });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la modification du menu :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// SUPPRIMER UN MENU
// DELETE /api/menus/:id
// Reserve aux employes et admins
// ============================================================
export async function supprimerMenu(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // Verification que le menu existe
        const menuExiste = await pool.query(
            "SELECT menu_id FROM menu WHERE menu_id = $1",
            [id]
        );

        if (menuExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Menu introuvable" });
        }

        // On verifie qu'il n'y a pas de commandes liees a ce menu
        const commandesLiees = await pool.query(
            "SELECT COUNT(*) AS nb FROM commande WHERE menu_id = $1",
            [id]
        );

        if (parseInt(commandesLiees.rows[0].nb) > 0) {
            return res.status(409).json({
                erreur: "Impossible de supprimer ce menu car il a des commandes associees"
            });
        }

        // Suppression du menu (les associations sont supprimees automatiquement grace au CASCADE)
        await pool.query("DELETE FROM menu WHERE menu_id = $1", [id]);

        res.json({ message: "Menu supprime avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la suppression du menu :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
