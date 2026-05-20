// ============================================================
// CONTROLEUR DES DONNEES DE REFERENCE
// Tables : theme, regime, allergene
// Routes en lecture seule, accessibles a tous (public).
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";

export async function listerThemes(_req: Request, res: Response) {
  try {
    const resultat = await pool.query(
      "SELECT theme_id, libelle FROM theme ORDER BY libelle"
    );
    res.json({ themes: resultat.rows });
  } catch (erreur) {
    console.error("Erreur listage themes :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

export async function listerRegimes(_req: Request, res: Response) {
  try {
    const resultat = await pool.query(
      "SELECT regime_id, libelle FROM regime ORDER BY libelle"
    );
    res.json({ regimes: resultat.rows });
  } catch (erreur) {
    console.error("Erreur listage regimes :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

export async function listerAllergenes(_req: Request, res: Response) {
  try {
    const resultat = await pool.query(
      "SELECT allergene_id, libelle FROM allergene ORDER BY libelle"
    );
    res.json({ allergenes: resultat.rows });
  } catch (erreur) {
    console.error("Erreur listage allergenes :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}
