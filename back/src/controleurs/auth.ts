// ============================================================
// CONTROLEUR D'AUTHENTIFICATION
// Contient toute la logique pour :
// - L'inscription d'un nouvel utilisateur
// - La connexion d'un utilisateur existant
// - La deconnexion
// - Recuperer les infos de l'utilisateur connecte
// - Demander une reinitialisation de mot de passe
// - Reinitialiser son mot de passe avec un token
// ============================================================

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/postgres";
import { envoyerEmailBienvenue, envoyerEmailReinitialisation } from "../services/email";
import TokenReinitialisation from "../modeles/token";

// ============================================================
// INSCRIPTION
// POST /api/auth/inscription
// Body : { email, motDePasse, nom, prenom, telephone, ville, pays, adressePostale }
// ============================================================
export async function inscription(req: Request, res: Response) {
    try {
        // On recupere les donnees envoyees par le client
        const { email, motDePasse, nom, prenom, telephone, ville, pays, adressePostale } = req.body;

        // Verification que les champs obligatoires sont presents
        if (!email || !motDePasse || !nom || !prenom) {
            return res.status(400).json({
                erreur: "Les champs email, motDePasse, nom et prenom sont obligatoires"
            });
        }

        // Verification du format du mot de passe
        // Au moins 10 caracteres, une majuscule, une minuscule, un chiffre, un caractere special
        const regexMotDePasse = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;
        if (!regexMotDePasse.test(motDePasse)) {
            return res.status(400).json({
                erreur: "Le mot de passe doit contenir au moins 10 caracteres, une majuscule, une minuscule, un chiffre et un caractere special"
            });
        }

        // Verification que l'email n'existe pas deja
        const emailExiste = await pool.query(
            "SELECT utilisateur_id FROM utilisateur WHERE email = $1",
            [email]
        );

        if (emailExiste.rows.length > 0) {
            return res.status(409).json({
                erreur: "Cet email est deja utilise"
            });
        }

        // Hashage du mot de passe avec bcrypt (cout 10)
        const motDePasseHashe = await bcrypt.hash(motDePasse, 10);

        // Insertion du nouvel utilisateur en BDD avec le role "utilisateur" (id = 1)
        const resultat = await pool.query(
            `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, telephone, ville, pays, adresse_postale, role_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
             RETURNING utilisateur_id, email, nom, prenom`,
            [email, motDePasseHashe, nom, prenom, telephone, ville, pays, adressePostale]
        );

        const nouvelUtilisateur = resultat.rows[0];

        // Envoi de l'email de bienvenue (asynchrone, on n'attend pas)
        envoyerEmailBienvenue(email, prenom).catch((erreur) => {
            console.error("Erreur lors de l'envoi de l'email de bienvenue :", erreur);
        });

        // Reponse au client
        res.status(201).json({
            message: "Compte cree avec succes",
            utilisateur: {
                id: nouvelUtilisateur.utilisateur_id,
                email: nouvelUtilisateur.email,
                nom: nouvelUtilisateur.nom,
                prenom: nouvelUtilisateur.prenom
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de l'inscription :", erreur);
        res.status(500).json({ erreur: "Erreur serveur lors de l'inscription" });
    }
}


// ============================================================
// CONNEXION
// POST /api/auth/connexion
// Body : { email, motDePasse }
// ============================================================
export async function connexion(req: Request, res: Response) {
    try {
        const { email, motDePasse } = req.body;

        // Verification que les champs sont presents
        if (!email || !motDePasse) {
            return res.status(400).json({
                erreur: "L'email et le mot de passe sont obligatoires"
            });
        }

        // Recuperation de l'utilisateur en BDD avec son role
        const resultat = await pool.query(
            `SELECT u.utilisateur_id, u.email, u.mot_de_passe, u.nom, u.prenom, u.actif, r.libelle AS role
             FROM utilisateur u
             JOIN role r ON u.role_id = r.role_id
             WHERE u.email = $1`,
            [email]
        );

        // On ne dit pas si c'est l'email ou le mot de passe qui est faux (securite)
        if (resultat.rows.length === 0) {
            return res.status(401).json({ erreur: "Email ou mot de passe incorrect" });
        }

        const utilisateur = resultat.rows[0];

        // Verification que le compte est actif
        if (!utilisateur.actif) {
            return res.status(403).json({ erreur: "Ce compte est desactive" });
        }

        // Verification du mot de passe avec bcrypt
        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);

        if (!motDePasseValide) {
            return res.status(401).json({ erreur: "Email ou mot de passe incorrect" });
        }

        // Creation de la session
        req.session.utilisateur = {
            id: utilisateur.utilisateur_id,
            email: utilisateur.email,
            role: utilisateur.role
        };

        // Reponse au client
        res.json({
            message: "Connexion reussie",
            utilisateur: {
                id: utilisateur.utilisateur_id,
                email: utilisateur.email,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                role: utilisateur.role
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de la connexion :", erreur);
        res.status(500).json({ erreur: "Erreur serveur lors de la connexion" });
    }
}


// ============================================================
// DECONNEXION
// POST /api/auth/deconnexion
// ============================================================
export async function deconnexion(req: Request, res: Response) {
    // On detruit la session
    req.session.destroy((erreur) => {
        if (erreur) {
            console.error("Erreur lors de la deconnexion :", erreur);
            return res.status(500).json({ erreur: "Erreur lors de la deconnexion" });
        }

        // On supprime le cookie de session cote client
        res.clearCookie("connect.sid");
        res.json({ message: "Deconnexion reussie" });
    });
}


// ============================================================
// QUI SUIS-JE
// GET /api/auth/moi
// Retourne les infos de l'utilisateur connecte (utile pour le front)
// ============================================================
export async function moi(req: Request, res: Response) {
    // Si pas de session, l'utilisateur n'est pas connecte
    if (!req.session.utilisateur) {
        return res.status(401).json({ erreur: "Non connecte" });
    }

    try {
        // On recupere les infos completes de l'utilisateur
        const resultat = await pool.query(
            `SELECT u.utilisateur_id, u.email, u.nom, u.prenom, u.telephone, u.ville, u.pays, u.adresse_postale, r.libelle AS role
             FROM utilisateur u
             JOIN role r ON u.role_id = r.role_id
             WHERE u.utilisateur_id = $1`,
            [req.session.utilisateur.id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        const utilisateur = resultat.rows[0];

        res.json({
            utilisateur: {
                id: utilisateur.utilisateur_id,
                email: utilisateur.email,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                telephone: utilisateur.telephone,
                ville: utilisateur.ville,
                pays: utilisateur.pays,
                adressePostale: utilisateur.adresse_postale,
                role: utilisateur.role
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation du profil :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MOT DE PASSE OUBLIE - DEMANDE
// POST /api/auth/mot-de-passe-oublie
// Body : { email }
// 
// Cette route :
// 1. Verifie si l'email existe (mais ne le dit pas pour des raisons de securite)
// 2. Genere un token aleatoire et le stocke dans MongoDB (expire dans 1h)
// 3. Envoie un email contenant le lien de reinitialisation
// 
// IMPORTANT : pour la securite, on retourne TOUJOURS un 200 OK,
// meme si l'email n'existe pas (pour ne pas reveler si un compte existe)
// ============================================================
export async function motDePasseOublie(req: Request, res: Response) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ erreur: "L'email est obligatoire" });
        }

        // Recherche de l'utilisateur
        const resultat = await pool.query(
            "SELECT utilisateur_id, prenom FROM utilisateur WHERE email = $1 AND actif = true",
            [email]
        );

        // Si l'utilisateur existe, on traite la demande
        if (resultat.rows.length > 0) {
            const utilisateur = resultat.rows[0];

            // Generation d'un token aleatoire securise (32 octets = 64 caracteres hex)
            const token = crypto.randomBytes(32).toString("hex");

            // Stockage en MongoDB (avec TTL automatique de 1h)
            await TokenReinitialisation.create({
                token,
                utilisateurId: utilisateur.utilisateur_id
            });

            // Construction du lien de reinitialisation
            const urlFront = process.env.FRONT_URL || "http://localhost:5173";
            const lienReinitialisation = `${urlFront}/reinitialiser-mot-de-passe?token=${token}`;

            // Envoi de l'email (asynchrone, on n'attend pas)
            envoyerEmailReinitialisation(email, lienReinitialisation).catch((erreur) => {
                console.error("Erreur lors de l'envoi de l'email de reinitialisation :", erreur);
            });
        }

        // Reponse SECURISEE : on retourne TOUJOURS le meme message
        // (pour ne pas reveler si l'email existe ou non dans la BDD)
        res.json({
            message: "Si cet email existe dans notre systeme, un lien de reinitialisation a ete envoye"
        });

    } catch (erreur) {
        console.error("Erreur lors de la demande de reinitialisation :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MOT DE PASSE OUBLIE - REINITIALISATION
// POST /api/auth/reinitialiser-mot-de-passe
// Body : { token, nouveauMotDePasse }
// 
// Cette route :
// 1. Verifie que le token existe et n'est pas expire
// 2. Valide le format du nouveau mot de passe
// 3. Hash le nouveau mot de passe et le sauvegarde en BDD
// 4. Supprime le token (usage unique)
// ============================================================
export async function reinitialiserMotDePasse(req: Request, res: Response) {
    try {
        const { token, nouveauMotDePasse } = req.body;

        if (!token || !nouveauMotDePasse) {
            return res.status(400).json({
                erreur: "Le token et le nouveau mot de passe sont obligatoires"
            });
        }

        // Verification du format du nouveau mot de passe
        const regexMotDePasse = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;
        if (!regexMotDePasse.test(nouveauMotDePasse)) {
            return res.status(400).json({
                erreur: "Le mot de passe doit contenir au moins 10 caracteres, une majuscule, une minuscule, un chiffre et un caractere special"
            });
        }

        // Recherche du token en MongoDB
        const tokenDoc = await TokenReinitialisation.findOne({ token });

        if (!tokenDoc) {
            return res.status(404).json({
                erreur: "Token invalide ou expire. Veuillez refaire une demande de reinitialisation."
            });
        }

        // Hashage du nouveau mot de passe
        const motDePasseHashe = await bcrypt.hash(nouveauMotDePasse, 10);

        // Mise a jour du mot de passe en BDD
        await pool.query(
            "UPDATE utilisateur SET mot_de_passe = $1 WHERE utilisateur_id = $2",
            [motDePasseHashe, tokenDoc.utilisateurId]
        );

        // Suppression du token (usage unique)
        await TokenReinitialisation.deleteOne({ token });

        res.json({
            message: "Votre mot de passe a ete reinitialise avec succes. Vous pouvez maintenant vous connecter."
        });

    } catch (erreur) {
        console.error("Erreur lors de la reinitialisation du mot de passe :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
