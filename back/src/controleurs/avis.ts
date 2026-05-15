// ============================================================
// CONTROLEUR DES AVIS
// Contient toute la logique pour :
// - Lister les avis valides (publics)
// - Voir les avis d'un menu specifique
// - Creer un avis (utilisateur connecte, lie a une commande)
// - Modifier son avis
// - Supprimer un avis (utilisateur ou admin)
// - Moderer un avis (admin uniquement)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";


// ============================================================
// LISTER TOUS LES AVIS PUBLIES (PUBLIC)
// GET /api/avis
// Retourne tous les avis dont le statut est "valide"
// ============================================================
export async function listerAvis(req: Request, res: Response) {
    try {
        const resultat = await pool.query(
            `SELECT a.avis_id, a.note, a.description, a.date_creation,
                    u.prenom AS auteur_prenom, u.nom AS auteur_nom,
                    m.menu_id, m.titre AS menu_titre,
                    p.numero_commande
             FROM avis a
             JOIN utilisateur u ON a.utilisateur_id = u.utilisateur_id
             JOIN publie p ON a.avis_id = p.avis_id
             JOIN commande c ON p.numero_commande = c.numero_commande
             JOIN menu m ON c.menu_id = m.menu_id
             WHERE a.statut = 'valide'
             ORDER BY a.date_creation DESC`
        );

        res.json({
            avis: resultat.rows,
            nombre: resultat.rows.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// LISTER LES AVIS D'UN MENU SPECIFIQUE (PUBLIC)
// GET /api/avis/menu/:id
// Retourne les avis valides pour un menu donne + la note moyenne
// ============================================================
export async function avisParMenu(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // Recuperation des avis du menu
        const resultatAvis = await pool.query(
            `SELECT a.avis_id, a.note, a.description, a.date_creation,
                    u.prenom AS auteur_prenom
             FROM avis a
             JOIN utilisateur u ON a.utilisateur_id = u.utilisateur_id
             JOIN publie p ON a.avis_id = p.avis_id
             JOIN commande c ON p.numero_commande = c.numero_commande
             WHERE c.menu_id = $1 AND a.statut = 'valide'
             ORDER BY a.date_creation DESC`,
            [id]
        );

        // Calcul de la note moyenne
        const resultatMoyenne = await pool.query(
            `SELECT ROUND(AVG(a.note)::numeric, 1) AS moyenne, COUNT(*) AS nombre
             FROM avis a
             JOIN publie p ON a.avis_id = p.avis_id
             JOIN commande c ON p.numero_commande = c.numero_commande
             WHERE c.menu_id = $1 AND a.statut = 'valide'`,
            [id]
        );

        res.json({
            avis: resultatAvis.rows,
            moyenne: resultatMoyenne.rows[0].moyenne ? parseFloat(resultatMoyenne.rows[0].moyenne) : 0,
            nombre: parseInt(resultatMoyenne.rows[0].nombre)
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des avis du menu :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// CREER UN AVIS
// POST /api/avis
// Reserve aux utilisateurs connectes
// Body : { numeroCommande, note, description }
// L'utilisateur doit avoir passe LA commande (verification de securite)
// ============================================================
export async function creerAvis(req: Request, res: Response) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const utilisateurId = req.session.utilisateur!.id;
        const { numeroCommande, note, description } = req.body;

        // Verification des champs obligatoires
        if (!numeroCommande || !note) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Les champs numeroCommande et note sont obligatoires"
            });
        }

        // Verification que la note est entre 1 et 5
        if (note < 1 || note > 5) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "La note doit etre comprise entre 1 et 5"
            });
        }

        // Verification que la commande existe ET appartient a l'utilisateur
        const resultatCommande = await client.query(
            `SELECT numero_commande, utilisateur_id, statut
             FROM commande
             WHERE numero_commande = $1`,
            [numeroCommande]
        );

        if (resultatCommande.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ erreur: "Commande introuvable" });
        }

        const commande = resultatCommande.rows[0];

        // Securite : c'est bien la commande de cet utilisateur ?
        if (commande.utilisateur_id !== utilisateurId) {
            await client.query("ROLLBACK");
            return res.status(403).json({ erreur: "Vous ne pouvez laisser un avis que sur vos propres commandes" });
        }

        // Verification que la commande a ete livree (sinon pas d'avis)
        if (commande.statut !== "livre" && commande.statut !== "terminee") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                erreur: "Vous ne pouvez laisser un avis que sur une commande livree ou terminee"
            });
        }

        // Verification qu'il n'y a pas deja un avis pour cette commande
        const avisExistant = await client.query(
            "SELECT avis_id FROM publie WHERE numero_commande = $1",
            [numeroCommande]
        );

        if (avisExistant.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                erreur: "Un avis a deja ete laisse pour cette commande"
            });
        }

        // Insertion de l'avis (statut = "en_attente" = en attente de moderation)
        const resultatAvis = await client.query(
            `INSERT INTO avis (note, description, statut, date_creation, utilisateur_id)
             VALUES ($1, $2, 'en_attente', NOW(), $3)
             RETURNING avis_id`,
            [note, description || null, utilisateurId]
        );

        const nouvelAvisId = resultatAvis.rows[0].avis_id;

        // Liaison avec la commande
        await client.query(
            `INSERT INTO publie (avis_id, numero_commande) VALUES ($1, $2)`,
            [nouvelAvisId, numeroCommande]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Avis cree avec succes (en attente de moderation)",
            avisId: nouvelAvisId
        });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la creation de l'avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// MODIFIER SON AVIS
// PUT /api/avis/:id
// L'utilisateur ne peut modifier QUE son propre avis
// Body : { note, description }
// ============================================================
export async function modifierAvis(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;
        const { id } = req.params;
        const { note, description } = req.body;

        if (!note) {
            return res.status(400).json({ erreur: "La note est obligatoire" });
        }

        if (note < 1 || note > 5) {
            return res.status(400).json({ erreur: "La note doit etre comprise entre 1 et 5" });
        }

        // Verification que l'avis existe ET appartient a cet utilisateur
        const resultat = await pool.query(
            "SELECT utilisateur_id FROM avis WHERE avis_id = $1",
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Avis introuvable" });
        }

        if (resultat.rows[0].utilisateur_id !== utilisateurId) {
            return res.status(403).json({ erreur: "Vous ne pouvez modifier que votre propre avis" });
        }

        // Mise a jour (passage en "en_attente" pour re-moderation)
        await pool.query(
            `UPDATE avis 
             SET note = $1, description = $2, statut = 'en_attente'
             WHERE avis_id = $3`,
            [note, description || null, id]
        );

        res.json({ message: "Avis modifie (en attente de re-moderation)" });

    } catch (erreur) {
        console.error("Erreur lors de la modification de l'avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// SUPPRIMER UN AVIS
// DELETE /api/avis/:id
// L'utilisateur peut supprimer son propre avis
// L'admin/employe peut supprimer n'importe quel avis (moderation)
// ============================================================
export async function supprimerAvis(req: Request, res: Response) {
    try {
        const utilisateur = req.session.utilisateur!;
        const { id } = req.params;

        const resultat = await pool.query(
            "SELECT utilisateur_id FROM avis WHERE avis_id = $1",
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Avis introuvable" });
        }

        // Securite : utilisateur normal ne peut supprimer QUE son avis
        const proprietaireId = resultat.rows[0].utilisateur_id;
        if (utilisateur.role === "utilisateur" && proprietaireId !== utilisateur.id) {
            return res.status(403).json({ erreur: "Vous ne pouvez supprimer que votre propre avis" });
        }

        // Suppression (la liaison "publie" est supprimee automatiquement par CASCADE)
        await pool.query("DELETE FROM avis WHERE avis_id = $1", [id]);

        res.json({ message: "Avis supprime avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la suppression de l'avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MODERER UN AVIS (employe/admin)
// PUT /api/avis/:id/moderer
// Body : { statut: "valide" | "refuse" }
// ============================================================
export async function modererAvis(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        const statutsValides = ["valide", "refuse", "en_attente"];
        if (!statut || !statutsValides.includes(statut)) {
            return res.status(400).json({
                erreur: `Le statut doit etre l'un des suivants : ${statutsValides.join(", ")}`
            });
        }

        const avisExiste = await pool.query(
            "SELECT avis_id FROM avis WHERE avis_id = $1",
            [id]
        );

        if (avisExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Avis introuvable" });
        }

        await pool.query(
            "UPDATE avis SET statut = $1 WHERE avis_id = $2",
            [statut, id]
        );

        res.json({ message: `Avis modere : statut = ${statut}` });

    } catch (erreur) {
        console.error("Erreur lors de la moderation de l'avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// LISTER TOUS LES AVIS POUR LA MODERATION (employe/admin)
// GET /api/avis/moderation
// Retourne tous les avis (toutes statuts confondus) pour la moderation
// ============================================================
export async function listerAvisPourModeration(req: Request, res: Response) {
    try {
        const { statut } = req.query;

        let requete = `
            SELECT a.avis_id, a.note, a.description, a.statut, a.date_creation,
                   u.prenom AS auteur_prenom, u.nom AS auteur_nom, u.email AS auteur_email,
                   m.titre AS menu_titre,
                   p.numero_commande
            FROM avis a
            JOIN utilisateur u ON a.utilisateur_id = u.utilisateur_id
            JOIN publie p ON a.avis_id = p.avis_id
            JOIN commande c ON p.numero_commande = c.numero_commande
            JOIN menu m ON c.menu_id = m.menu_id
        `;

        const parametres: any[] = [];
        if (statut) {
            requete += ` WHERE a.statut = $1`;
            parametres.push(statut);
        }

        requete += ` ORDER BY a.date_creation DESC`;

        const resultat = await pool.query(requete, parametres);

        res.json({
            avis: resultat.rows,
            nombre: resultat.rows.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des avis :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
