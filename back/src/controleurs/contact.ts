// ============================================================
// CONTROLEUR DU FORMULAIRE DE CONTACT
// Permet aux visiteurs (connectes ou non) d'envoyer un message
// a Julie et Jose via le formulaire de contact du site
// ============================================================

import { Request, Response } from "express";
import { envoyerEmailContact } from "../services/email";


// ============================================================
// ENVOYER UN MESSAGE DE CONTACT
// POST /api/contact
// Body : { nom, email, sujet, message }
// ============================================================
export async function envoyerMessage(req: Request, res: Response) {
    try {
        const { nom, email, sujet, message } = req.body;

        // Verification des champs obligatoires
        if (!nom || !email || !sujet || !message) {
            return res.status(400).json({
                erreur: "Tous les champs sont obligatoires (nom, email, sujet, message)"
            });
        }

        // Verification basique du format email
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(email)) {
            return res.status(400).json({
                erreur: "Format d'email invalide"
            });
        }

        // Verification longueurs (anti-spam basique)
        if (nom.length > 100) {
            return res.status(400).json({ erreur: "Le nom est trop long (max 100 caracteres)" });
        }
        if (sujet.length > 200) {
            return res.status(400).json({ erreur: "Le sujet est trop long (max 200 caracteres)" });
        }
        if (message.length > 5000) {
            return res.status(400).json({ erreur: "Le message est trop long (max 5000 caracteres)" });
        }

        // Envoi de l'email a Julie/Jose
        await envoyerEmailContact(nom, email, sujet, message);

        res.json({
            message: "Votre message a bien ete envoye. Nous vous repondrons dans les plus brefs delais."
        });

    } catch (erreur) {
        console.error("Erreur lors de l'envoi du message de contact :", erreur);
        res.status(500).json({ erreur: "Erreur serveur lors de l'envoi du message" });
    }
}
