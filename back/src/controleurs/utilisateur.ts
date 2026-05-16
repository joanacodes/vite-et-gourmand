// ============================================================
// CONTROLEUR DES UTILISATEURS
// Contient toute la logique pour :
// PROFIL UTILISATEUR :
// - Recuperer son propre profil
// - Modifier son profil
// - Changer son mot de passe
// - Desactiver son compte
//
// GESTION ADMIN :
// - Lister tous les utilisateurs
// - Creer un compte employe
// - Modifier le role
// - Desactiver / Reactiver un compte
// ============================================================

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/postgres";


// ============================================================
// RECUPERER SON PROPRE PROFIL DETAILLE
// GET /api/utilisateurs/profil
// Reserve aux connectes
// ============================================================
export async function recupererProfil(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;

        const resultat = await pool.query(
            `SELECT u.utilisateur_id, u.email, u.nom, u.prenom, u.telephone, 
                    u.ville, u.pays, u.adresse_postale, u.actif, u.date_creation,
                    r.libelle AS role
             FROM utilisateur u
             JOIN role r ON u.role_id = r.role_id
             WHERE u.utilisateur_id = $1`,
            [utilisateurId]
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
                actif: utilisateur.actif,
                dateCreation: utilisateur.date_creation,
                role: utilisateur.role
            }
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation du profil :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MODIFIER SON PROFIL
// PUT /api/utilisateurs/profil
// Reserve aux connectes
// Body : { nom, prenom, telephone, ville, pays, adressePostale }
// L'email et le mot de passe ne sont PAS modifiables ici (routes dediees)
// ============================================================
export async function modifierProfil(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;
        const { nom, prenom, telephone, ville, pays, adressePostale } = req.body;

        if (!nom || !prenom) {
            return res.status(400).json({
                erreur: "Les champs nom et prenom sont obligatoires"
            });
        }

        await pool.query(
            `UPDATE utilisateur 
             SET nom = $1, prenom = $2, telephone = $3, ville = $4, pays = $5, adresse_postale = $6
             WHERE utilisateur_id = $7`,
            [nom, prenom, telephone || null, ville || null, pays || null, adressePostale || null, utilisateurId]
        );

        res.json({ message: "Profil modifie avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la modification du profil :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// CHANGER SON MOT DE PASSE
// PUT /api/utilisateurs/mot-de-passe
// Reserve aux connectes
// Body : { ancienMotDePasse, nouveauMotDePasse }
// ============================================================
export async function changerMotDePasse(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;
        const { ancienMotDePasse, nouveauMotDePasse } = req.body;

        if (!ancienMotDePasse || !nouveauMotDePasse) {
            return res.status(400).json({
                erreur: "Les champs ancienMotDePasse et nouveauMotDePasse sont obligatoires"
            });
        }

        // Verification du nouveau mot de passe
        const regexMotDePasse = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;
        if (!regexMotDePasse.test(nouveauMotDePasse)) {
            return res.status(400).json({
                erreur: "Le nouveau mot de passe doit contenir au moins 10 caracteres, une majuscule, une minuscule, un chiffre et un caractere special"
            });
        }

        // Recuperation du mot de passe actuel
        const resultat = await pool.query(
            "SELECT mot_de_passe FROM utilisateur WHERE utilisateur_id = $1",
            [utilisateurId]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        // Verification de l'ancien mot de passe
        const ancienValide = await bcrypt.compare(ancienMotDePasse, resultat.rows[0].mot_de_passe);
        if (!ancienValide) {
            return res.status(401).json({ erreur: "Ancien mot de passe incorrect" });
        }

        // Hashage et mise a jour du nouveau
        const nouveauHashe = await bcrypt.hash(nouveauMotDePasse, 10);
        await pool.query(
            "UPDATE utilisateur SET mot_de_passe = $1 WHERE utilisateur_id = $2",
            [nouveauHashe, utilisateurId]
        );

        res.json({ message: "Mot de passe modifie avec succes" });

    } catch (erreur) {
        console.error("Erreur lors du changement de mot de passe :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// DESACTIVER SON PROPRE COMPTE
// DELETE /api/utilisateurs/profil
// Reserve aux connectes
// ============================================================
export async function desactiverPropreCompte(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;

        await pool.query(
            "UPDATE utilisateur SET actif = false WHERE utilisateur_id = $1",
            [utilisateurId]
        );

        // Destruction de la session
        req.session.destroy((erreur) => {
            if (erreur) {
                console.error("Erreur lors de la destruction de la session :", erreur);
            }
            res.clearCookie("connect.sid");
            res.json({ message: "Votre compte a ete desactive" });
        });

    } catch (erreur) {
        console.error("Erreur lors de la desactivation du compte :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// LISTER TOUS LES UTILISATEURS (ADMIN)
// GET /api/utilisateurs
// Filtres : ?role=employe, ?actif=true
// ============================================================
export async function listerUtilisateurs(req: Request, res: Response) {
    try {
        const { role, actif } = req.query;

        let requete = `
            SELECT u.utilisateur_id, u.email, u.nom, u.prenom, u.telephone,
                   u.ville, u.pays, u.actif, u.date_creation,
                   r.libelle AS role
            FROM utilisateur u
            JOIN role r ON u.role_id = r.role_id
        `;

        const conditions: string[] = [];
        const parametres: any[] = [];
        let indexParam = 1;

        if (role) {
            conditions.push(`r.libelle = $${indexParam}`);
            parametres.push(role);
            indexParam++;
        }

        if (actif !== undefined) {
            conditions.push(`u.actif = $${indexParam}`);
            parametres.push(actif === "true");
            indexParam++;
        }

        if (conditions.length > 0) {
            requete += ` WHERE ` + conditions.join(" AND ");
        }

        requete += ` ORDER BY u.date_creation DESC`;

        const resultat = await pool.query(requete, parametres);

        res.json({
            utilisateurs: resultat.rows,
            nombre: resultat.rows.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des utilisateurs :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// CREER UN COMPTE EMPLOYE (ADMIN)
// POST /api/utilisateurs/employe
// Body : { email, motDePasse, nom, prenom, telephone, ville, pays, adressePostale }
// ============================================================
export async function creerEmploye(req: Request, res: Response) {
    try {
        const { email, motDePasse, nom, prenom, telephone, ville, pays, adressePostale } = req.body;

        if (!email || !motDePasse || !nom || !prenom) {
            return res.status(400).json({
                erreur: "Les champs email, motDePasse, nom et prenom sont obligatoires"
            });
        }

        // Verification du mot de passe
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
            return res.status(409).json({ erreur: "Cet email est deja utilise" });
        }

        // Hashage du mot de passe
        const motDePasseHashe = await bcrypt.hash(motDePasse, 10);

        // Insertion avec role_id = 2 (employe)
        const resultat = await pool.query(
            `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, telephone, ville, pays, adresse_postale, role_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 2)
             RETURNING utilisateur_id`,
            [email, motDePasseHashe, nom, prenom, telephone, ville, pays, adressePostale]
        );

        res.status(201).json({
            message: "Compte employe cree avec succes",
            utilisateurId: resultat.rows[0].utilisateur_id
        });

    } catch (erreur) {
        console.error("Erreur lors de la creation du compte employe :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MODIFIER LE ROLE D'UN UTILISATEUR (ADMIN)
// PUT /api/utilisateurs/:id/role
// Body : { roleId } (1=utilisateur, 2=employe, 3=administrateur)
// ============================================================
export async function modifierRole(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { roleId } = req.body;

        if (!roleId || ![1, 2, 3].includes(roleId)) {
            return res.status(400).json({
                erreur: "Le roleId doit etre 1 (utilisateur), 2 (employe) ou 3 (administrateur)"
            });
        }

        const utilisateurExiste = await pool.query(
            "SELECT utilisateur_id FROM utilisateur WHERE utilisateur_id = $1",
            [id]
        );

        if (utilisateurExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        await pool.query(
            "UPDATE utilisateur SET role_id = $1 WHERE utilisateur_id = $2",
            [roleId, id]
        );

        res.json({ message: "Role modifie avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la modification du role :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// DESACTIVER UN UTILISATEUR (ADMIN)
// PUT /api/utilisateurs/:id/desactiver
// ============================================================
export async function desactiverUtilisateur(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const utilisateurExiste = await pool.query(
            "SELECT utilisateur_id FROM utilisateur WHERE utilisateur_id = $1",
            [id]
        );

        if (utilisateurExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        await pool.query(
            "UPDATE utilisateur SET actif = false WHERE utilisateur_id = $1",
            [id]
        );

        res.json({ message: "Utilisateur desactive avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la desactivation :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// REACTIVER UN UTILISATEUR (ADMIN)
// PUT /api/utilisateurs/:id/reactiver
// ============================================================
export async function reactiverUtilisateur(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const utilisateurExiste = await pool.query(
            "SELECT utilisateur_id FROM utilisateur WHERE utilisateur_id = $1",
            [id]
        );

        if (utilisateurExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        await pool.query(
            "UPDATE utilisateur SET actif = true WHERE utilisateur_id = $1",
            [id]
        );

        res.json({ message: "Utilisateur reactive avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de la reactivation :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}

// ============================================================
// DEMANDER LA SUPPRESSION DE SON COMPTE (RGPD - DROIT A L'OUBLI)
// POST /api/utilisateurs/moi/demander-suppression
//
// Conformement au RGPD article 17, l'utilisateur peut demander
// la suppression de ses donnees. Periode de grace de 30 jours
// avant anonymisation effective (laisse le temps de revenir).
//
// Pendant ces 30 jours, le compte est desactive (connexion bloquee).
// Apres 30 jours, le cron anonymise les donnees personnelles.
// L'utilisateur_id reste pour les FK des commandes (obligation comptable).
// ============================================================
export async function demanderSuppressionRGPD(req: Request, res: Response) {
    try {
        const utilisateurId = req.session.utilisateur!.id;

        // Verifier que l'utilisateur n'a pas deja une demande en cours
        const resultat = await pool.query(
            `SELECT utilisateur_id, date_suppression_demandee, est_anonymise
             FROM utilisateur 
             WHERE utilisateur_id = $1`,
            [utilisateurId]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        const utilisateur = resultat.rows[0];

        if (utilisateur.est_anonymise) {
            return res.status(410).json({ 
                erreur: "Ce compte a deja ete supprime definitivement (anonymise)" 
            });
        }

        if (utilisateur.date_suppression_demandee !== null) {
            return res.status(409).json({ 
                erreur: "Une demande de suppression est deja en cours pour ce compte" 
            });
        }

        // Enregistrer la demande de suppression
        await pool.query(
            `UPDATE utilisateur 
             SET date_suppression_demandee = CURRENT_TIMESTAMP
             WHERE utilisateur_id = $1`,
            [utilisateurId]
        );

        // Destruction de la session (deconnexion immediate)
        req.session.destroy((erreur) => {
            if (erreur) {
                console.error("Erreur lors de la destruction de la session :", erreur);
            }
            res.clearCookie("connect.sid");
            res.json({ 
                message: "Demande de suppression enregistree. Votre compte sera anonymise dans 30 jours. Vous pouvez annuler cette demande en vous reconnectant via le support avant ce delai." 
            });
        });

    } catch (erreur) {
        console.error("Erreur lors de la demande de suppression RGPD :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}

// ============================================================
// ANNULER LA DEMANDE DE SUPPRESSION (RGPD)
// POST /api/utilisateurs/:id/annuler-suppression
//
// Reserve aux administrateurs (le client ne peut plus se connecter
// puisque son compte est desactive : il doit passer par le support).
// Possible tant que l'anonymisation n'a pas eu lieu (est_anonymise = FALSE).
// ============================================================
export async function annulerSuppressionRGPD(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const resultat = await pool.query(
            `SELECT utilisateur_id, date_suppression_demandee, est_anonymise
             FROM utilisateur 
             WHERE utilisateur_id = $1`,
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }

        const utilisateur = resultat.rows[0];

        if (utilisateur.est_anonymise) {
            return res.status(410).json({ 
                erreur: "Ce compte a deja ete anonymise definitivement, impossible de l'annuler" 
            });
        }

        if (utilisateur.date_suppression_demandee === null) {
            return res.status(400).json({ 
                erreur: "Aucune demande de suppression en cours pour ce compte" 
            });
        }

        // Annuler la demande
        await pool.query(
            `UPDATE utilisateur 
             SET date_suppression_demandee = NULL
             WHERE utilisateur_id = $1`,
            [id]
        );

        res.json({ message: "Demande de suppression annulee avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de l'annulation de la suppression RGPD :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}

