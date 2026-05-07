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


// ============================================================
// EMAIL DE CHANGEMENT DE STATUT D'UNE COMMANDE
// Envoye quand l'employe/admin change le statut d'une commande
// ============================================================
export async function envoyerEmailStatutCommande(
    email: string, 
    prenom: string, 
    numeroCommande: string, 
    nouveauStatut: string
) {
    // Message personnalise selon le nouveau statut
    let messageStatut = "";
    let titre = "";

    switch (nouveauStatut) {
        case "confirmee":
            titre = "Votre commande est confirmee !";
            messageStatut = "Notre equipe a valide votre commande. Nous commencerons bientot la preparation.";
            break;
        case "en_preparation":
            titre = "Votre commande est en preparation";
            messageStatut = "Notre equipe est actuellement en train de preparer votre commande avec soin.";
            break;
        case "livree":
            titre = "Votre commande a ete livree !";
            messageStatut = "Votre commande a bien ete livree. Nous esperons que vous l'apprecierez ! N'hesitez pas a laisser un avis.";
            break;
        default:
            titre = "Mise a jour de votre commande";
            messageStatut = `Le statut de votre commande est maintenant : ${nouveauStatut}`;
    }

    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">${titre}</h1>
            <p>Bonjour ${prenom},</p>
            <p>${messageStatut}</p>
            <p><strong>Commande :</strong> ${numeroCommande}</p>
            <p>Merci de votre confiance,</p>
            <p><strong>L'equipe Vite & Gourmand</strong></p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: `${titre} (${numeroCommande})`,
        html: contenuHTML
    });
}


// ============================================================
// EMAIL D'ANNULATION DE COMMANDE
// Envoye quand une commande est annulee
// ============================================================
export async function envoyerEmailAnnulationCommande(
    email: string, 
    prenom: string, 
    numeroCommande: string, 
    motifAnnulation: string
) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Annulation de votre commande</h1>
            <p>Bonjour ${prenom},</p>
            <p>Votre commande <strong>${numeroCommande}</strong> a ete annulee.</p>
            <p><strong>Motif :</strong> ${motifAnnulation}</p>
            <p>Si vous avez la moindre question, n'hesitez pas a nous contacter.</p>
            <p>L'equipe Vite & Gourmand</p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: `Annulation de votre commande ${numeroCommande}`,
        html: contenuHTML
    });
}


// ============================================================
// EMAIL DE FORMULAIRE DE CONTACT
// Envoye a Julie/Jose quand un visiteur remplit le formulaire de contact
// ============================================================
export async function envoyerEmailContact(
    nom: string,
    email: string,
    sujet: string,
    message: string
) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Nouveau message de contact</h1>
            <p><strong>De :</strong> ${nom}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Sujet :</strong> ${sujet}</p>
            <hr>
            <p><strong>Message :</strong></p>
            <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #c0392b;">${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
                Vous pouvez repondre directement en repondant a cet email.
            </p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Site Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: process.env.MAIL_CONTACT || "contact@vite-et-gourmand.fr",
        replyTo: email, // Pour que Julie/Jose puissent repondre directement au visiteur
        subject: `[Contact site] ${sujet}`,
        html: contenuHTML
    });
}


// ============================================================
// EMAIL DE PUBLICATION D'UN AVIS
// Envoye quand un avis est modere et publie
// ============================================================
export async function envoyerEmailAvisPublie(
    email: string,
    prenom: string
) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Votre avis a ete publie !</h1>
            <p>Bonjour ${prenom},</p>
            <p>Votre avis a ete approuve et publie sur notre site.</p>
            <p>Merci de partager votre experience avec notre communaute !</p>
            <p>L'equipe Vite & Gourmand</p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: "Votre avis a ete publie !",
        html: contenuHTML
    });
}
