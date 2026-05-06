// ============================================================
// SERVICE D'ENVOI D'EMAILS
// Centralise toutes les fonctions d'envoi d'emails de l'application
// Utilise Nodemailer + Mailtrap (en dev) / Brevo (en prod)
// ============================================================

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configuration du transporteur d'emails
const transporteur = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "2525"),
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

// ============================================================
// EMAIL DE BIENVENUE
// Envoye apres l'inscription d'un nouvel utilisateur
// ============================================================
export async function envoyerEmailBienvenue(email: string, prenom: string) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Bienvenue chez Vite & Gourmand, ${prenom} !</h1>
            <p>Nous sommes ravis de vous compter parmi nos clients.</p>
            <p>Vous pouvez maintenant decouvrir nos menus et passer commande directement depuis notre site.</p>
            <p>A tres bientot,</p>
            <p><strong>Julie et Jose</strong></p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: "Bienvenue chez Vite & Gourmand !",
        html: contenuHTML
    });
}


// ============================================================
// EMAIL DE REINITIALISATION DU MOT DE PASSE
// ============================================================
export async function envoyerEmailReinitialisation(email: string, lienReinitialisation: string) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Reinitialisation de votre mot de passe</h1>
            <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour le reinitialiser :</p>
            <a href="${lienReinitialisation}" style="background: #c0392b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reinitialiser mon mot de passe</a>
            <p>Ce lien est valable pendant 1 heure.</p>
            <p>Si vous n'avez pas demande cette reinitialisation, ignorez cet email.</p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: "Reinitialisation de votre mot de passe",
        html: contenuHTML
    });
}


// ============================================================
// EMAIL DE CONFIRMATION DE COMMANDE
// ============================================================
export async function envoyerEmailConfirmationCommande(email: string, prenom: string, numeroCommande: string) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Commande confirmee !</h1>
            <p>Bonjour ${prenom},</p>
            <p>Nous avons bien recu votre commande <strong>${numeroCommande}</strong>.</p>
            <p>Notre equipe va l'examiner et vous contacter rapidement.</p>
            <p>Merci de votre confiance,</p>
            <p><strong>L'equipe Vite & Gourmand</strong></p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: `Confirmation de votre commande ${numeroCommande}`,
        html: contenuHTML
    });
}
