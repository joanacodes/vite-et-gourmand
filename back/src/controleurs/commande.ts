// ============================================================
// CONTROLEUR DES COMMANDES
// Contient toute la logique pour :
// - Creer une commande (utilisateur connecte)
// - Lister les commandes (selon le role)
// - Voir le detail d'une commande
// - Modifier le statut (employe/admin)
// - Annuler une commande
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";
import { envoyerEmailConfirmationCommande } from "../services/email";


// ============================================================
// CALCULER LES FRAIS DE LIVRAISON
// Regle metier :
// - 10 € si la ville de livraison est Bordeaux
// - 15 € si en France hors Bordeaux
// - 25 € si etranger
// ============================================================
function calculerFraisLivraison(ville: string, pays: string): number {
    if (pays.toLowerCase() !== "france") {
        return 25;
    }
    if (ville.toLowerCase() === "bordeaux") {
        return 10;
    }
    return 15;
}


// ============================================================
// VERIFIER SI L'UTILISATEUR EST CLIENT FIDELE
// Regle metier : 5% de reduction si 3+ commandes confirmees
// ============================================================
async function estClientFidele(utilisateurId: number): Promise<boolean> {
    const resultat = await pool.query(
        `SELECT COUNT(*) AS nb 
         FROM commande 
         WHERE utilisateur_id = $1 
         AND statut IN ('confirmee', 'en_preparation', 'livree')`,
        [utilisateurId]
    );
    return parseInt(resultat.rows[0].nb) >= 3;
}


// ============================================================
// GENERER UN NUMERO DE COMMANDE UNIQUE
// Format : CMD-YYYY-XXXX (XXXX = numero sequentiel sur 4 chiffres)
// ============================================================
async function genererNumeroCommande(): Promise<string> {
    const annee = new Date().getFullYear();
    
    // On compte les commandes deja creees cette annee
    const resultat = await pool.query(
        `SELECT COUNT(*) AS nb 
         FROM commande 
         WHERE numero_commande LIKE $1`,
        [`CMD-${annee}-%`]
    );
    
    const nombre = parseInt(resultat.rows[0].nb) + 1;
    const numeroFormate = String(nombre).padStart(4, "0");
    
    return `CMD-${annee}-${numeroFormate}`;
}


// ============================================================
// CREER UNE COMMANDE
// POST /api/commandes
// Reserve aux utilisateurs connectes
// Body : { menuId, nombrePersonnes, datePrestation, heureLivraison, 
//          lieuLivraison, villeLivraison, paysLivraison, pretMateriel }
// ============================================================
export async function creerCommande(req: Request, res: Response) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const utilisateurId = req.session.utilisateur!.id;
        const {
            menuId,
            nombrePersonnes,
            datePrestation,
            heureLivraison,
            lieuLivraison,
            villeLivraison,
            paysLivraison,
            pretMateriel
        } = req.body;

        // Verification des champs obligatoires
        if (!menuId || !nombrePersonnes || !datePrestation || !lieuLivraison || !villeLivraison || !paysLivraison) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: "Tous les champs obligatoires : menuId, nombrePersonnes, datePrestation, lieuLivraison, villeLivraison, paysLivraison"
            });
        }

        // Verification que le menu existe et recuperation des infos
        const resultatMenu = await client.query(
            `SELECT menu_id, titre, prix_par_personne, nombre_personnes_minimum, quantite_restante
             FROM menu 
             WHERE menu_id = $1`,
            [menuId]
        );

        if (resultatMenu.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ erreur: "Menu introuvable" });
        }

        const menu = resultatMenu.rows[0];

        // Verification du nombre minimum de personnes
        if (nombrePersonnes < menu.nombre_personnes_minimum) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                erreur: `Ce menu necessite au minimum ${menu.nombre_personnes_minimum} personnes`
            });
        }

        // Verification de la quantite restante
        if (menu.quantite_restante <= 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                erreur: "Ce menu n'est plus disponible (rupture de stock)"
            });
        }

        // Calcul du prix
        const prixMenu = parseFloat(menu.prix_par_personne) * nombrePersonnes;
        const prixLivraison = calculerFraisLivraison(villeLivraison, paysLivraison);
        const fidele = await estClientFidele(utilisateurId);
        const reduction = fidele ? prixMenu * 0.05 : 0;
        const prixTotal = (prixMenu - reduction) + prixLivraison;

        // Generation du numero de commande
        const numeroCommande = await genererNumeroCommande();

        // Insertion de la commande
        await client.query(
            `INSERT INTO commande 
             (numero_commande, date_commande, date_prestation, heure_livraison, 
              lieu_livraison, ville_livraison, pays_livraison, nombre_personnes, 
              prix_menu, prix_livraison, statut, pret_materiel,
              utilisateur_id, menu_id)
             VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, 'en_attente', $10, $11, $12)`,
            [
                numeroCommande, datePrestation, heureLivraison || null,
                lieuLivraison, villeLivraison, paysLivraison, nombrePersonnes,
                prixMenu, prixLivraison, pretMateriel || false,
                utilisateurId, menuId
            ]
        );

        // Diminution de la quantite restante du menu
        await client.query(
            "UPDATE menu SET quantite_restante = quantite_restante - 1 WHERE menu_id = $1",
            [menuId]
        );

        // Recuperation de l'email de l'utilisateur pour la confirmation
        const resultatUtilisateur = await client.query(
            "SELECT email, prenom FROM utilisateur WHERE utilisateur_id = $1",
            [utilisateurId]
        );

        await client.query("COMMIT");

        // Envoi de l'email de confirmation (asynchrone, on n'attend pas)
        const utilisateur = resultatUtilisateur.rows[0];
        envoyerEmailConfirmationCommande(utilisateur.email, utilisateur.prenom, numeroCommande)
            .catch((erreur) => {
                console.error("Erreur lors de l'envoi de l'email :", erreur);
            });

        // Reponse au client
        res.status(201).json({
            message: "Commande creee avec succes",
            commande: {
                numero: numeroCommande,
                prixMenu: prixMenu.toFixed(2),
                prixLivraison: prixLivraison.toFixed(2),
                reduction: reduction.toFixed(2),
                prixTotal: prixTotal.toFixed(2),
                clientFidele: fidele
            }
        });

    } catch (erreur) {
        await client.query("ROLLBACK");
        console.error("Erreur lors de la creation de la commande :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    } finally {
        client.release();
    }
}


// ============================================================
// LISTER LES COMMANDES
// GET /api/commandes
// - Si utilisateur : ses propres commandes
// - Si employe/admin : toutes les commandes
// Filtres possibles : ?statut=confirmee
// ============================================================
export async function listerCommandes(req: Request, res: Response) {
    try {
        const utilisateur = req.session.utilisateur!;
        const { statut } = req.query;

        let requete = `
            SELECT c.numero_commande, c.date_commande, c.date_prestation, c.heure_livraison,
                   c.lieu_livraison, c.ville_livraison, c.pays_livraison, c.nombre_personnes,
                   c.prix_menu, c.prix_livraison, c.statut, c.pret_materiel,
                   m.titre AS menu_titre,
                   u.nom AS client_nom, u.prenom AS client_prenom, u.email AS client_email
            FROM commande c
            JOIN menu m ON c.menu_id = m.menu_id
            JOIN utilisateur u ON c.utilisateur_id = u.utilisateur_id
        `;

        const conditions: string[] = [];
        const parametres: any[] = [];
        let indexParam = 1;

        // Si utilisateur normal : on ne montre que ses commandes
        if (utilisateur.role === "utilisateur") {
            conditions.push(`c.utilisateur_id = $${indexParam}`);
            parametres.push(utilisateur.id);
            indexParam++;
        }

        // Filtre par statut
        if (statut) {
            conditions.push(`c.statut = $${indexParam}`);
            parametres.push(statut);
            indexParam++;
        }

        if (conditions.length > 0) {
            requete += ` WHERE ` + conditions.join(" AND ");
        }

        requete += ` ORDER BY c.date_commande DESC`;

        const resultat = await pool.query(requete, parametres);

        res.json({
            commandes: resultat.rows,
            nombre: resultat.rows.length
        });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation des commandes :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// VOIR LE DETAIL D'UNE COMMANDE
// GET /api/commandes/:numero
// - Utilisateur : seulement ses propres commandes
// - Employe/admin : toutes
// ============================================================
export async function detailCommande(req: Request, res: Response) {
    try {
        const utilisateur = req.session.utilisateur!;
        const { numero } = req.params;

        const resultat = await pool.query(
            `SELECT c.*, 
                    m.titre AS menu_titre, m.description AS menu_description, m.prix_par_personne,
                    u.nom AS client_nom, u.prenom AS client_prenom, 
                    u.email AS client_email, u.telephone AS client_telephone
             FROM commande c
             JOIN menu m ON c.menu_id = m.menu_id
             JOIN utilisateur u ON c.utilisateur_id = u.utilisateur_id
             WHERE c.numero_commande = $1`,
            [numero]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Commande introuvable" });
        }

        const commande = resultat.rows[0];

        // Securite : un utilisateur normal ne peut voir que ses propres commandes
        if (utilisateur.role === "utilisateur" && commande.utilisateur_id !== utilisateur.id) {
            return res.status(403).json({ erreur: "Acces interdit a cette commande" });
        }

        res.json({ commande });

    } catch (erreur) {
        console.error("Erreur lors de la recuperation de la commande :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// MODIFIER LE STATUT D'UNE COMMANDE
// PUT /api/commandes/:numero/statut
// Reserve aux employes et admins
// Body : { statut: "confirmee" | "en_preparation" | "livree" | "annulee" }
// ============================================================
export async function modifierStatutCommande(req: Request, res: Response) {
    try {
        const { numero } = req.params;
        const { statut } = req.body;

        // Verification du statut
        const statutsValides = ["en_attente", "confirmee", "en_preparation", "livree", "annulee"];
        if (!statut || !statutsValides.includes(statut)) {
            return res.status(400).json({
                erreur: `Le statut doit etre l'un des suivants : ${statutsValides.join(", ")}`
            });
        }

        // Verification que la commande existe
        const commandeExiste = await pool.query(
            "SELECT numero_commande FROM commande WHERE numero_commande = $1",
            [numero]
        );

        if (commandeExiste.rows.length === 0) {
            return res.status(404).json({ erreur: "Commande introuvable" });
        }

        await pool.query(
            "UPDATE commande SET statut = $1 WHERE numero_commande = $2",
            [statut, numero]
        );

        res.json({ message: `Commande mise a jour : statut = ${statut}` });

    } catch (erreur) {
        console.error("Erreur lors de la modification du statut :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}


// ============================================================
// ANNULER UNE COMMANDE (par l'utilisateur ou employe/admin)
// PUT /api/commandes/:numero/annuler
// L'utilisateur ne peut annuler QUE ses propres commandes
// Et SEULEMENT si statut = en_attente
// Body : { motifAnnulation, modeContactAnnulation }
// ============================================================
export async function annulerCommande(req: Request, res: Response) {
    try {
        const utilisateur = req.session.utilisateur!;
        const { numero } = req.params;
        const { motifAnnulation, modeContactAnnulation } = req.body;

        const resultat = await pool.query(
            "SELECT utilisateur_id, statut, menu_id FROM commande WHERE numero_commande = $1",
            [numero]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({ erreur: "Commande introuvable" });
        }

        const commande = resultat.rows[0];

        // Verification que c'est bien sa commande (sauf pour employe/admin)
        if (utilisateur.role === "utilisateur" && commande.utilisateur_id !== utilisateur.id) {
            return res.status(403).json({ erreur: "Vous ne pouvez annuler que vos propres commandes" });
        }

        // Verification que la commande peut etre annulee
        if (commande.statut !== "en_attente") {
            return res.status(409).json({
                erreur: "Cette commande ne peut plus etre annulee (deja confirmee ou avancee)"
            });
        }

        // Annulation
        await pool.query(
            `UPDATE commande 
             SET statut = 'annulee', 
                 motif_annulation = $1, 
                 mode_contact_annulation = $2 
             WHERE numero_commande = $3`,
            [motifAnnulation || null, modeContactAnnulation || null, numero]
        );

        // Restauration du stock du menu
        await pool.query(
            "UPDATE menu SET quantite_restante = quantite_restante + 1 WHERE menu_id = $1",
            [commande.menu_id]
        );

        res.json({ message: "Commande annulee avec succes" });

    } catch (erreur) {
        console.error("Erreur lors de l'annulation de la commande :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
