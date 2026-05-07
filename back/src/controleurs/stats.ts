// ============================================================
// CONTROLEUR DES STATISTIQUES
// Architecture hybride :
// - PostgreSQL pour les chiffres metier (commandes, CA)
// - MongoDB pour les analytics (menus populaires, activite)
//
// NOTE : Le prix total est calcule = prix_menu + prix_livraison
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";
import Evenement from "../modeles/evenement";

// ============================================================
// DASHBOARD : VUE D'ENSEMBLE
// GET /api/stats/dashboard
// Retourne les chiffres cles pour l'admin
// ============================================================
export async function dashboard(req: Request, res: Response) {
  try {
    // ---- PostgreSQL : chiffres metier ----

    // Nombre total de commandes (toutes statuts)
    const totalCommandes = await pool.query(
      "SELECT COUNT(*) AS total FROM commande",
    );

    // CA total (commandes confirmees, en preparation, livrees)
    // CALCUL : prix_menu + prix_livraison
    const caTotal = await pool.query(
      `SELECT COALESCE(SUM(prix_menu + prix_livraison), 0) AS ca 
             FROM commande 
             WHERE statut IN ('confirmee', 'en_preparation', 'livree')`,
    );

    // Nombre d'utilisateurs actifs
    const totalUtilisateurs = await pool.query(
      "SELECT COUNT(*) AS total FROM utilisateur WHERE actif = true",
    );

    // Nombre d'avis publies
    const totalAvis = await pool.query(
      "SELECT COUNT(*) AS total FROM avis WHERE statut = 'publie'",
    );

    // Note moyenne globale
    const noteMoyenne = await pool.query(
      "SELECT ROUND(AVG(note)::numeric, 2) AS moyenne FROM avis WHERE statut = 'publie'",
    );

    // ---- MongoDB : analytics ----

    // Nombre total de consultations de menus
    const totalConsultations = await Evenement.countDocuments({
      type: "consultation_menu",
    });

    res.json({
      commandes: {
        total: parseInt(totalCommandes.rows[0].total),
      },
      chiffreAffaires: {
        total: parseFloat(caTotal.rows[0].ca),
      },
      utilisateurs: {
        actifs: parseInt(totalUtilisateurs.rows[0].total),
      },
      avis: {
        publies: parseInt(totalAvis.rows[0].total),
        noteMoyenne: noteMoyenne.rows[0].moyenne
          ? parseFloat(noteMoyenne.rows[0].moyenne)
          : 0,
      },
      traffic: {
        consultationsMenus: totalConsultations,
      },
    });
  } catch (erreur) {
    console.error("Erreur dashboard :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// MENUS POPULAIRES (analytics MongoDB)
// GET /api/stats/menus-populaires
// Top 5 des menus les plus consultes
// ============================================================
export async function menusPopulaires(req: Request, res: Response) {
  try {
    // Agregation MongoDB : groupBy menuId + count + sort + limit
    const consultations = await Evenement.aggregate([
      { $match: { type: "consultation_menu", menuId: { $ne: null } } },
      { $group: { _id: "$menuId", nombreVues: { $sum: 1 } } },
      { $sort: { nombreVues: -1 } },
      { $limit: 5 },
    ]);

    // Recuperation des titres des menus depuis PostgreSQL
    const menuIds = consultations.map((c) => c._id);

    if (menuIds.length === 0) {
      return res.json({ menus: [] });
    }

    const resultatMenus = await pool.query(
      `SELECT menu_id, titre, prix_par_personne AS prix FROM menu WHERE menu_id = ANY($1)`,
      [menuIds],
    );

    // Fusion des donnees
    const menusAvecVues = consultations.map((c) => {
      const menu = resultatMenus.rows.find((m) => m.menu_id === c._id);
      return {
        menuId: c._id,
        titre: menu ? menu.titre : "Menu introuvable",
        prix: menu ? parseFloat(menu.prix) : 0,
        nombreVues: c.nombreVues,
      };
    });

    res.json({ menus: menusAvecVues });
  } catch (erreur) {
    console.error("Erreur menus populaires :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// CHIFFRE D'AFFAIRES PAR MOIS (PostgreSQL)
// GET /api/stats/chiffre-affaires
// CA des 12 derniers mois
// ============================================================
export async function chiffreAffairesParMois(req: Request, res: Response) {
  try {
    const resultat = await pool.query(
      `SELECT 
                TO_CHAR(date_commande, 'YYYY-MM') AS mois,
                COUNT(*) AS nombre_commandes,
                COALESCE(SUM(prix_menu + prix_livraison), 0) AS ca
             FROM commande
             WHERE statut IN ('confirmee', 'en_preparation', 'livree')
                AND date_commande >= NOW() - INTERVAL '12 months'
             GROUP BY mois
             ORDER BY mois DESC`,
    );

    res.json({
      statistiques: resultat.rows.map((ligne) => ({
        mois: ligne.mois,
        nombreCommandes: parseInt(ligne.nombre_commandes),
        chiffreAffaires: parseFloat(ligne.ca),
      })),
    });
  } catch (erreur) {
    console.error("Erreur CA par mois :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// CLIENTS FIDELES (PostgreSQL)
// GET /api/stats/clients-fideles
// Top 10 des clients par nombre de commandes confirmees
// ============================================================
export async function clientsFideles(req: Request, res: Response) {
  try {
    const resultat = await pool.query(
      `SELECT 
                u.utilisateur_id, u.nom, u.prenom, u.email,
                COUNT(c.numero_commande) AS nombre_commandes,
                COALESCE(SUM(c.prix_menu + c.prix_livraison), 0) AS total_depense
             FROM utilisateur u
             JOIN commande c ON u.utilisateur_id = c.utilisateur_id
             WHERE c.statut IN ('confirmee', 'en_preparation', 'livree')
             GROUP BY u.utilisateur_id, u.nom, u.prenom, u.email
             ORDER BY nombre_commandes DESC, total_depense DESC
             LIMIT 10`,
    );

    res.json({
      clients: resultat.rows.map((client) => ({
        id: client.utilisateur_id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        nombreCommandes: parseInt(client.nombre_commandes),
        totalDepense: parseFloat(client.total_depense),
      })),
    });
  } catch (erreur) {
    console.error("Erreur clients fideles :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// ACTIVITE RECENTE (MongoDB)
// GET /api/stats/activite-recente
// 50 derniers evenements (visites, commandes, annulations, avis)
// ============================================================
export async function activiteRecente(req: Request, res: Response) {
  try {
    const evenements = await Evenement.find()
      .sort({ date: -1 })
      .limit(50)
      .lean();

    res.json({
      evenements: evenements.map((ev) => ({
        type: ev.type,
        date: ev.date,
        utilisateurId: ev.utilisateurId,
        menuId: ev.menuId,
        numeroCommande: ev.numeroCommande,
        donnees: ev.donnees,
      })),
      nombre: evenements.length,
    });
  } catch (erreur) {
    console.error("Erreur activite recente :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}
