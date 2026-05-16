// ============================================================
// CONTROLEUR DES HORAIRES
//
// Gere les horaires d'ouverture du traiteur (page publique + admin).
// Une ligne par jour de la semaine, avec 2 creneaux possibles
// (matin et apres-midi) pour gerer les pauses dejeuner.
//
// Routes :
// - GET /api/horaires                    -> lister (public, page Contact/Accueil)
// - PUT /api/horaires/:id                -> modifier un jour (admin)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";

// ============================================================
// LISTER LES HORAIRES (public)
// GET /api/horaires
// Retourne les 7 jours dans l'ordre (lundi -> dimanche)
// ============================================================
export async function listerHoraires(req: Request, res: Response) {
    try {
        const resultat = await pool.query(
            `SELECT horaire_id, jour, 
                    heure_ouverture_matin, heure_fermeture_matin,
                    heure_ouverture_apresmidi, heure_fermeture_apresmidi,
                    ferme
             FROM horaire
             ORDER BY 
                CASE jour
                    WHEN 'lundi' THEN 1
                    WHEN 'mardi' THEN 2
                    WHEN 'mercredi' THEN 3
                    WHEN 'jeudi' THEN 4
                    WHEN 'vendredi' THEN 5
                    WHEN 'samedi' THEN 6
                    WHEN 'dimanche' THEN 7
                    ELSE 8
                END`
        );

        res.json({ horaires: resultat.rows });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des horaires :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}

// ============================================================
// MODIFIER LES HORAIRES D'UN JOUR (admin)
// PUT /api/horaires/:id
// Body : { 
//   heureOuvertureMatin?, heureFermetureMatin?,
//   heureOuvertureApresmidi?, heureFermetureApresmidi?,
//   ferme?
// }
//
// Regles metier :
// - Si ferme = true, on vide automatiquement les 4 creneaux
// - Si ferme = false, au moins un creneau doit etre fourni (CHECK BDD)
// - Format des heures : "HH:MM" (validation cote serveur)
// ============================================================
export async function modifierHoraires(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const {
            heureOuvertureMatin,
            heureFermetureMatin,
            heureOuvertureApresmidi,
            heureFermetureApresmidi,
            ferme
        } = req.body;

        // Validation du format des heures (HH:MM)
        const regexHeure = /^([01]\d|2[0-3]):([0-5]\d)$/;
        const heuresAValider = [
            heureOuvertureMatin,
            heureFermetureMatin,
            heureOuvertureApresmidi,
            heureFermetureApresmidi
        ];

        for (const heure of heuresAValider) {
            if (heure !== undefined && heure !== null && heure !== "" && !regexHeure.test(heure)) {
                return res.status(400).json({
                    erreur: `Format d'heure invalide : "${heure}". Attendu : HH:MM (ex: "09:00")`
                });
            }
        }

        // Verifier que le jour existe
        const horaireExiste = await pool.query(
            "SELECT horaire_id FROM horaire WHERE horaire_id = $1",
            [id]
        );

        if (horaireExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Horaire introuvable" });
        }

        // Si ferme = true, on vide tous les creneaux automatiquement
        if (ferme === true) {
            await pool.query(
                `UPDATE horaire 
                 SET ferme = TRUE,
                     heure_ouverture_matin = NULL,
                     heure_fermeture_matin = NULL,
                     heure_ouverture_apresmidi = NULL,
                     heure_fermeture_apresmidi = NULL
                 WHERE horaire_id = $1`,
                [id]
            );
            return res.json({ message: "Jour marque comme ferme" });
        }

        // Sinon, construction dynamique du UPDATE (seuls les champs fournis)
        const champsModifies: string[] = ["ferme = FALSE"];
        const valeurs: any[] = [];
        let index = 1;

        if (heureOuvertureMatin !== undefined) {
            champsModifies.push(`heure_ouverture_matin = $${index++}`);
            valeurs.push(heureOuvertureMatin || null);
        }
        if (heureFermetureMatin !== undefined) {
            champsModifies.push(`heure_fermeture_matin = $${index++}`);
            valeurs.push(heureFermetureMatin || null);
        }
        if (heureOuvertureApresmidi !== undefined) {
            champsModifies.push(`heure_ouverture_apresmidi = $${index++}`);
            valeurs.push(heureOuvertureApresmidi || null);
        }
        if (heureFermetureApresmidi !== undefined) {
            champsModifies.push(`heure_fermeture_apresmidi = $${index++}`);
            valeurs.push(heureFermetureApresmidi || null);
        }

        if (valeurs.length === 0) {
            return res.status(400).json({
                erreur: "Aucune modification fournie"
            });
        }

        // Ajout de l'id pour le WHERE
        valeurs.push(id);

        const resultat = await pool.query(
            `UPDATE horaire 
             SET ${champsModifies.join(", ")}
             WHERE horaire_id = $${index}
             RETURNING horaire_id, jour, 
                       heure_ouverture_matin, heure_fermeture_matin,
                       heure_ouverture_apresmidi, heure_fermeture_apresmidi,
                       ferme`,
            valeurs
        );

        res.json({
            message: "Horaire modifie avec succes",
            horaire: resultat.rows[0]
        });

    } catch (erreur: any) {
        // Si la contrainte CHECK echoue (aucun creneau et pas ferme)
        if (erreur.code === "23514") {
            return res.status(400).json({
                erreur: "Le jour doit etre soit ferme, soit avoir au moins un creneau defini (matin ou apres-midi)"
            });
        }
        console.error("Erreur lors de la modification des horaires :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
