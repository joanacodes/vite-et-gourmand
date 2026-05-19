// ============================================================
// SERVICE D'ENVOI D'EMAILS
// Centralise toutes les fonctions d'envoi d'emails de l'application
// Utilise Nodemailer + Mailtrap (en dev) / Brevo (en prod)
//
// RGPD : avant chaque envoi d'email transactionnel/marketing, on
// verifie la preference de l'utilisateur via verifierPreferenceEmail().
// Exceptions (toujours envoyes) :
// - Email de reinitialisation de mot de passe (securite obligatoire)
// - Email de formulaire de contact (envoye a l'equipe, pas au client)
// ============================================================

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pool from "../config/postgres";

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
// VERIFIER UNE PREFERENCE D'EMAIL (RGPD)
//
// Avant d'envoyer un email a un utilisateur, on verifie qu'il a
// bien donne son consentement pour ce type d'email.
//
// Retourne true si l'envoi est autorise, false sinon.
// Si l'utilisateur n'existe pas, on retourne false (securite).
//
// Note : on ignore les utilisateurs anonymises (est_anonymise = TRUE).
// ============================================================
type TypePreference = "notif_commandes" | "notif_newsletter" | "notif_offres" | "notif_conseils";

async function verifierPreferenceEmail(
    utilisateurId: number,
    typePreference: TypePreference
): Promise<boolean> {
    try {
        const resultat = await pool.query(
            `SELECT ${typePreference}, est_anonymise
             FROM utilisateur
             WHERE utilisateur_id = $1`,
            [utilisateurId]
        );

        if (resultat.rows.length === 0) {
            return false;
        }

        const utilisateur = resultat.rows[0];

        // On n'envoie pas d'email aux comptes anonymises
        if (utilisateur.est_anonymise) {
            return false;
        }

        return utilisateur[typePreference] === true;
    } catch (erreur) {
        console.error(`Erreur lors de la verification de la preference ${typePreference} :`, erreur);
        // En cas d'erreur, on prefere ne pas envoyer (principe de minimisation RGPD)
        return false;
    }
}


// ============================================================
// EMAIL DE BIENVENUE
// Envoye apres l'inscription d'un nouvel utilisateur
// Type : transactionnel (lie au compte cree) -> notif_commandes
// ============================================================
export async function envoyerEmailBienvenue(
    email: string,
    prenom: string,
    utilisateurId: number
) {
    // RGPD : verifier le consentement avant envoi
    const peutEnvoyer = await verifierPreferenceEmail(utilisateurId, "notif_commandes");
    if (!peutEnvoyer) {
        console.log(`[RGPD] Email de bienvenue non envoye a ${email} (preference desactivee)`);
        return;
    }

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
// EXCEPTION RGPD : toujours envoye (securite obligatoire)
// L'utilisateur ne peut pas refuser un email de securite
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
// Type : transactionnel (lie au contrat de vente) -> notif_commandes
// ============================================================
export async function envoyerEmailConfirmationCommande(
    email: string,
    prenom: string,
    numeroCommande: string,
    utilisateurId: number
) {
    // RGPD : verifier le consentement avant envoi
    const peutEnvoyer = await verifierPreferenceEmail(utilisateurId, "notif_commandes");
    if (!peutEnvoyer) {
        console.log(`[RGPD] Email de confirmation commande non envoye a ${email} (preference desactivee)`);
        return;
    }

    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c0392b;">Commande bien recue !</h1>
            <p>Bonjour ${prenom},</p>
            <p>Nous avons bien recu votre commande <strong>${numeroCommande}</strong>.</p>
            <p>Notre equipe va l'examiner et vous contacter rapidement pour la valider.</p>
            <p>Merci de votre confiance,</p>
            <p><strong>L'equipe Vite & Gourmand</strong></p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: email,
        subject: `Confirmation de reception : commande ${numeroCommande}`,
        html: contenuHTML
    });
}


// ============================================================
// EMAIL DE CHANGEMENT DE STATUT D'UNE COMMANDE
// Type : transactionnel -> notif_commandes
// ============================================================
export async function envoyerEmailStatutCommande(
    email: string,
    prenom: string,
    numeroCommande: string,
    nouveauStatut: string,
    utilisateurId: number
) {
    // RGPD : verifier le consentement avant envoi
    const peutEnvoyer = await verifierPreferenceEmail(utilisateurId, "notif_commandes");
    if (!peutEnvoyer) {
        console.log(`[RGPD] Email de changement de statut non envoye a ${email} (preference desactivee)`);
        return;
    }

    // Message personnalise selon le nouveau statut
    let messageStatut = "";
    let titre = "";

    switch (nouveauStatut) {
        case "accepte":
            titre = "Votre commande a ete acceptee !";
            messageStatut = "Notre equipe a valide votre commande. Nous commencerons bientot la preparation.";
            break;
        case "en_preparation":
            titre = "Votre commande est en preparation";
            messageStatut = "Notre equipe est actuellement en train de preparer votre commande avec soin.";
            break;
        case "en_cours_livraison":
            titre = "Votre commande est en cours de livraison";
            messageStatut = "Votre commande est en route ! Notre livreur sera bientot chez vous.";
            break;
        case "livre":
            titre = "Votre commande a ete livree !";
            messageStatut = "Votre commande a bien ete livree. Nous esperons que vous l'apprecierez ! N'hesitez pas a laisser un avis.";
            break;
        case "attente_retour_materiel":
            titre = "Retour du materiel a prevoir";
            messageStatut = "Votre commande est livree. Merci de prevoir le retour du materiel prete sous 10 jours.";
            break;
        case "terminee":
            titre = "Votre commande est terminee";
            messageStatut = "Tout est finalise. Merci pour votre confiance ! N'hesitez pas a laisser un avis sur notre site.";
            break;
        case "annulee":
            titre = "Votre commande a ete annulee";
            messageStatut = "Votre commande a ete annulee. Pour toute question, n'hesitez pas a nous contacter.";
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
// Type : transactionnel -> notif_commandes
// ============================================================
export async function envoyerEmailAnnulationCommande(
    email: string,
    prenom: string,
    numeroCommande: string,
    motifAnnulation: string,
    utilisateurId: number
) {
    // RGPD : verifier le consentement avant envoi
    const peutEnvoyer = await verifierPreferenceEmail(utilisateurId, "notif_commandes");
    if (!peutEnvoyer) {
        console.log(`[RGPD] Email d'annulation non envoye a ${email} (preference desactivee)`);
        return;
    }

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
// EXCEPTION RGPD : pas de verification de preference
// Envoye vers Julie/Jose, pas vers un utilisateur du site
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
// Type : transactionnel (lie a une action de l'utilisateur) -> notif_commandes
// ============================================================
export async function envoyerEmailAvisPublie(
    email: string,
    prenom: string,
    utilisateurId: number
) {
    // RGPD : verifier le consentement avant envoi
    const peutEnvoyer = await verifierPreferenceEmail(utilisateurId, "notif_commandes");
    if (!peutEnvoyer) {
        console.log(`[RGPD] Email avis publie non envoye a ${email} (preference desactivee)`);
        return;
    }

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


// ============================================================
// EMAIL LIBRE ENVOYE PAR UN EMPLOYE A UN CLIENT
// Lie a une commande - permet a l'equipe de contacter le client
// pour des precisions, modifications, etc.
// Type : transactionnel (lie a une action manuelle de l'equipe)
// ============================================================
export async function envoyerEmailLibreClient(
    emailClient: string,
    nomClient: string,
    sujet: string,
    message: string,
    numeroCommande: string,
    nomExpediteur: string
) {
    const contenuHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7B2D26;">Vite & Gourmand</h1>
            <p>Bonjour ${nomClient},</p>
            <div style="background: #FAF3E7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${message.replace(/\n/g, "<br>")}
            </div>
            <p style="color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
                Message envoye par ${nomExpediteur} concernant votre commande
                <strong>${numeroCommande}</strong>.<br>
                Vous pouvez repondre directement a cet email.
            </p>
        </div>
    `;

    return transporteur.sendMail({
        from: '"Vite & Gourmand" <contact@vite-et-gourmand.fr>',
        to: emailClient,
        subject: sujet,
        html: contenuHTML
    });
}
