// ============================================================
// CONTROLEUR DES COMMANDES - VERSION CONFORME ECF STUDI
//
// REGLES METIER (selon enonce) :
// - Livraison : 5€ + 0,59€/km (Bordeaux = 0 km, donc 5€)
// - Reduction : 10% si nombre_personnes >= minimum + 5
// - Statuts : en_attente -> accepte -> en_preparation ->
//             en_cours_livraison -> livre ->
//             [attente_retour_materiel] -> terminee
// - Historique : chaque changement de statut est trace dans
//                la table commande_statut_historique
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";
import {
  envoyerEmailConfirmationCommande,
  envoyerEmailStatutCommande,
  envoyerEmailAnnulationCommande,
} from "../services/email";
import {
  loggerCreationCommande,
  loggerAnnulationCommande,
} from "../services/tracking";

// ============================================================
// CALCULER LES FRAIS DE LIVRAISON (selon enonce)
// Regle : 5€ de base + 0,59€/km
// Si livraison a Bordeaux (distance_km = 0) -> 5€
// ============================================================
function calculerFraisLivraison(distanceKm: number): number {
  if (distanceKm < 0) {
    return 0;
  }
  return 5 + distanceKm * 0.59;
}

// ============================================================
// CALCULER LA REDUCTION (selon enonce)
// Regle : 10% de reduction si nombre_personnes >= minimum + 5
// ============================================================
function calculerReduction(
  nombrePersonnes: number,
  nombrePersonnesMinimum: number,
): boolean {
  return nombrePersonnes >= nombrePersonnesMinimum + 5;
}

// ============================================================
// LOGGER UN CHANGEMENT DE STATUT DANS L'HISTORIQUE
// (utilise par creerCommande, modifierStatutCommande, annulerCommande)
//
// "client" peut etre :
// - une connexion pool (via pool.query)
// - un client de transaction (via pool.connect())
// ============================================================
async function loggerHistoriqueStatut(
  client: any,
  numeroCommande: string,
  statut: string,
  modifiePar: number | null,
  commentaire: string | null,
): Promise<void> {
  await client.query(
    `INSERT INTO commande_statut_historique
         (numero_commande, statut, modifie_par, commentaire)
         VALUES ($1, $2, $3, $4)`,
    [numeroCommande, statut, modifiePar, commentaire],
  );
}

// ============================================================
// GENERER UN NUMERO DE COMMANDE UNIQUE
// Format : CMD-YYYY-XXXX
// ============================================================
async function genererNumeroCommande(): Promise<string> {
  const annee = new Date().getFullYear();

  const resultat = await pool.query(
    `SELECT COUNT(*) AS nb
         FROM commande
         WHERE numero_commande LIKE $1`,
    [`CMD-${annee}-%`],
  );
  const nombre = parseInt(resultat.rows[0].nb) + 1;
  const numeroFormate = String(nombre).padStart(4, "0");
  return `CMD-${annee}-${numeroFormate}`;
}

// ============================================================
// CREER UNE COMMANDE
// POST /api/commandes
// Body : { menuId, nombrePersonnes, datePrestation, heureLivraison,
//          lieuLivraison, distanceKm, pretMateriel }
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
      distanceKm,
      pretMateriel,
      notesClient,
    } = req.body;

    // Verification des champs obligatoires
    if (
      !menuId ||
      !nombrePersonnes ||
      !datePrestation ||
      !lieuLivraison
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erreur:
          "Tous les champs obligatoires : menuId, nombrePersonnes, datePrestation, lieuLivraison",
      });
    }

    // Validation de la longueur des notes client (max 500 caracteres)
    if (notesClient && notesClient.length > 500) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erreur: "Les notes client ne peuvent pas depasser 500 caracteres",
      });
    }

    // Verification que le menu existe et recuperation des infos
    const resultatMenu = await client.query(
      `SELECT menu_id, titre, prix_par_personne, nombre_personnes_minimum, quantite_restante
             FROM menu
             WHERE menu_id = $1`,
      [menuId],
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
        erreur: `Ce menu necessite au minimum ${menu.nombre_personnes_minimum} personnes`,
      });
    }

    // Verification de la quantite restante
    if (menu.quantite_restante <= 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        erreur: "Ce menu n'est plus disponible (rupture de stock)",
      });
    }

    // ----- CALCUL DU PRIX selon les regles de l'enonce -----

    const prixBase = parseFloat(menu.prix_par_personne) * nombrePersonnes;

    const reductionApplicable = calculerReduction(
      nombrePersonnes,
      menu.nombre_personnes_minimum,
    );
    const reduction = reductionApplicable ? prixBase * 0.1 : 0;
    const prixMenu = prixBase - reduction;

    const distance = parseInt(distanceKm) || 0;
    const prixLivraison = calculerFraisLivraison(distance);

    const prixTotal = prixMenu + prixLivraison;

    // Generation du numero de commande
    const numeroCommande = await genererNumeroCommande();

    // Insertion de la commande (statut = "en_attente" au depart)
    await client.query(
      `INSERT INTO commande
             (numero_commande, date_commande, date_prestation, heure_livraison,
              lieu_livraison, distance_km, nombre_personnes,
              prix_menu, prix_livraison, statut, pret_materiel, notes_client,
              utilisateur_id, menu_id)
             VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, 'en_attente', $9, $10, $11, $12)`,
      [
        numeroCommande,
        datePrestation,
        heureLivraison || null,
        lieuLivraison,
        distance,
        nombrePersonnes,
        prixMenu,
        prixLivraison,
        pretMateriel || false,
        notesClient || null,
        utilisateurId,
        menuId,
      ],
    );

    // ===== LOG HISTORIQUE : statut initial "en_attente" =====
    await loggerHistoriqueStatut(
      client,
      numeroCommande,
      "en_attente",
      utilisateurId,
      "Commande creee par l'utilisateur",
    );

    // Diminution de la quantite restante du menu
    await client.query(
      "UPDATE menu SET quantite_restante = quantite_restante - 1 WHERE menu_id = $1",
      [menuId],
    );

    // Recuperation de l'email de l'utilisateur pour la confirmation
    const resultatUtilisateur = await client.query(
      "SELECT email, prenom FROM utilisateur WHERE utilisateur_id = $1",
      [utilisateurId],
    );

    await client.query("COMMIT");

    // Envoi de l'email de confirmation
    const utilisateur = resultatUtilisateur.rows[0];
    envoyerEmailConfirmationCommande(
      utilisateur.email,
      utilisateur.prenom,
      numeroCommande,
    ).catch((erreur) => {
      console.error("Erreur lors de l'envoi de l'email :", erreur);
    });

    // Tracking MongoDB
    loggerCreationCommande(
      numeroCommande,
      parseInt(menuId),
      utilisateurId,
      prixTotal,
      parseInt(nombrePersonnes),
    );

    res.status(201).json({
      message: "Commande creee avec succes",
      commande: {
        numero: numeroCommande,
        prixBase: prixBase.toFixed(2),
        reduction: reduction.toFixed(2),
        reductionAppliquee: reductionApplicable,
        prixMenu: prixMenu.toFixed(2),
        prixLivraison: prixLivraison.toFixed(2),
        prixTotal: prixTotal.toFixed(2),
        distanceKm: distance,
      },
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
// ============================================================
export async function listerCommandes(req: Request, res: Response) {
  try {
    const utilisateur = req.session.utilisateur!;
    const { statut, clientId } = req.query;

    let requete = `
            SELECT c.numero_commande, c.date_commande, c.date_prestation, c.heure_livraison,
                   c.lieu_livraison, c.distance_km,
                   c.nombre_personnes, c.prix_menu, c.prix_livraison, c.statut, c.pret_materiel,
                   c.notes_client,
                   m.titre AS menu_titre,
                   u.utilisateur_id, u.nom AS client_nom, u.prenom AS client_prenom, u.email AS client_email
            FROM commande c
            JOIN menu m ON c.menu_id = m.menu_id
            JOIN utilisateur u ON c.utilisateur_id = u.utilisateur_id
        `;

    const conditions: string[] = [];
    const parametres: any[] = [];
    let indexParam = 1;

    if (utilisateur.role === "utilisateur") {
      conditions.push(`c.utilisateur_id = $${indexParam}`);
      parametres.push(utilisateur.id);
      indexParam++;
    } else if (clientId) {
      conditions.push(`c.utilisateur_id = $${indexParam}`);
      parametres.push(parseInt(clientId as string));
      indexParam++;
    }

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
      nombre: resultat.rows.length,
    });
  } catch (erreur) {
    console.error("Erreur lors de la recuperation des commandes :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// VOIR LE DETAIL D'UNE COMMANDE
// GET /api/commandes/:numero
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
      [numero],
    );

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    const commande = resultat.rows[0];

    if (
      utilisateur.role === "utilisateur" &&
      commande.utilisateur_id !== utilisateur.id
    ) {
      return res
        .status(403)
        .json({ erreur: "Acces interdit a cette commande" });
    }

    res.json({ commande });
  } catch (erreur) {
    console.error("Erreur lors de la recuperation de la commande :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// VOIR L'HISTORIQUE DES STATUTS D'UNE COMMANDE
// GET /api/commandes/:numero/historique
//
// Conformement a l'enonce :
// "Le suivi de la commande enumere tous les etats de sa commande
//  suivi de la date et l'heure de modification."
// ============================================================
export async function obtenirHistoriqueCommande(req: Request, res: Response) {
  try {
    const utilisateur = req.session.utilisateur!;
    const { numero } = req.params;

    // Verifier d'abord que la commande existe et que l'utilisateur a le droit de la voir
    const resultatCommande = await pool.query(
      `SELECT utilisateur_id FROM commande WHERE numero_commande = $1`,
      [numero],
    );

    if (resultatCommande.rows.length === 0) {
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    const commande = resultatCommande.rows[0];

    // Securite : utilisateur normal ne peut voir que ses propres commandes
    if (
      utilisateur.role === "utilisateur" &&
      commande.utilisateur_id !== utilisateur.id
    ) {
      return res
        .status(403)
        .json({ erreur: "Acces interdit a cette commande" });
    }

    // Recuperation de l'historique avec infos sur qui a modifie
    const resultatHistorique = await pool.query(
      `SELECT h.historique_id, h.statut, h.date_modification, h.commentaire,
                    u.nom AS modifie_par_nom, u.prenom AS modifie_par_prenom, u.email AS modifie_par_email
             FROM commande_statut_historique h
             LEFT JOIN utilisateur u ON h.modifie_par = u.utilisateur_id
             WHERE h.numero_commande = $1
             ORDER BY h.date_modification ASC`,
      [numero],
    );

    res.json({
      numeroCommande: numero,
      historique: resultatHistorique.rows,
      nombre: resultatHistorique.rows.length,
    });
  } catch (erreur) {
    console.error("Erreur lors de la recuperation de l'historique :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// MODIFIER LE STATUT D'UNE COMMANDE
// PUT /api/commandes/:numero/statut
// Reserve aux employes et admins
// ============================================================
export async function modifierStatutCommande(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const utilisateur = req.session.utilisateur!;
    const { numero } = req.params;
    const { statut, commentaire } = req.body;

    // Verification du statut (selon enonce)
    const statutsValides = [
      "en_attente",
      "accepte",
      "en_preparation",
      "en_cours_livraison",
      "livre",
      "attente_retour_materiel",
      "terminee",
      "annulee",
    ];

    if (!statut || !statutsValides.includes(statut)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erreur: `Le statut doit etre l'un des suivants : ${statutsValides.join(", ")}`,
      });
    }

    // Verification que la commande existe
    const commandeExiste = await client.query(
      `SELECT c.numero_commande, c.pret_materiel, u.email, u.prenom
             FROM commande c
             JOIN utilisateur u ON c.utilisateur_id = u.utilisateur_id
             WHERE c.numero_commande = $1`,
      [numero],
    );

    if (commandeExiste.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    const infoCommande = commandeExiste.rows[0];

    // Mise a jour du statut
    await client.query(
      "UPDATE commande SET statut = $1 WHERE numero_commande = $2",
      [statut, numero],
    );

    // ===== LOG HISTORIQUE =====
    await loggerHistoriqueStatut(
      client,
      numero as string,
      statut,
      utilisateur.id,
      commentaire || `Statut modifie par ${utilisateur.role}`,
    );

    await client.query("COMMIT");

    // Envoi de l'email de notification (asynchrone)
    envoyerEmailStatutCommande(
      infoCommande.email,
      infoCommande.prenom,
      numero as string,
      statut,
    ).catch((erreur) => {
      console.error("Erreur lors de l'envoi de l'email statut :", erreur);
    });

    res.json({ message: `Commande mise a jour : statut = ${statut}` });
  } catch (erreur) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la modification du statut :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  } finally {
    client.release();
  }
}

// ============================================================
// ANNULER UNE COMMANDE
// PUT /api/commandes/:numero/annuler
// ============================================================
export async function annulerCommande(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const utilisateur = req.session.utilisateur!;
    const { numero } = req.params;
    const { motifAnnulation, modeContactAnnulation } = req.body;

    const resultat = await client.query(
      `SELECT c.utilisateur_id, c.statut, c.menu_id, u.email, u.prenom
             FROM commande c
             JOIN utilisateur u ON c.utilisateur_id = u.utilisateur_id
             WHERE c.numero_commande = $1`,
      [numero],
    );

    if (resultat.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    const commande = resultat.rows[0];

    if (
      utilisateur.role === "utilisateur" &&
      commande.utilisateur_id !== utilisateur.id
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ erreur: "Vous ne pouvez annuler que vos propres commandes" });
    }

    if (
      utilisateur.role === "utilisateur" &&
      commande.statut !== "en_attente"
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        erreur:
          "Cette commande ne peut plus etre annulee (deja acceptee). Contactez l'equipe.",
      });
    }

    if (utilisateur.role !== "utilisateur") {
      if (!motifAnnulation || !modeContactAnnulation) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          erreur:
            "Le motif d'annulation et le mode de contact sont obligatoires (selon procedure)",
        });
      }
    }

    // Annulation
    await client.query(
      `UPDATE commande
             SET statut = 'annulee',
                 motif_annulation = $1,
                 mode_contact_annulation = $2
             WHERE numero_commande = $3`,
      [motifAnnulation || null, modeContactAnnulation || null, numero],
    );

    // ===== LOG HISTORIQUE =====
    await loggerHistoriqueStatut(
      client,
      numero as string,
      "annulee",
      utilisateur.id,
      motifAnnulation || `Annulee par ${utilisateur.role}`,
    );

    // Restauration du stock du menu
    await client.query(
      "UPDATE menu SET quantite_restante = quantite_restante + 1 WHERE menu_id = $1",
      [commande.menu_id],
    );

    await client.query("COMMIT");

    // Envoi de l'email d'annulation
    envoyerEmailAnnulationCommande(
      commande.email,
      commande.prenom,
      numero as string,
      motifAnnulation || "Aucun motif precise",
    ).catch((erreur) => {
      console.error("Erreur lors de l'envoi de l'email d'annulation :", erreur);
    });

    // Tracking MongoDB
    loggerAnnulationCommande(numero as string, commande.utilisateur_id);

    res.json({ message: "Commande annulee avec succes" });
  } catch (erreur) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de l'annulation de la commande :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  } finally {
    client.release();
  }
}
