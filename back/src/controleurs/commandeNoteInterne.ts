// ============================================================
// CONTROLEUR DES NOTES INTERNES DE COMMANDE
//
// Notes echangees par l'equipe interne (employes/admin) a propos
// d'une commande. INVISIBLES au client.
//
// Routes :
// - GET    /api/commandes/:numero/notes-internes         -> lister
// - POST   /api/commandes/:numero/notes-internes         -> ajouter
// - PUT    /api/commandes/:numero/notes-internes/:noteId -> modifier (auteur)
// - DELETE /api/commandes/:numero/notes-internes/:noteId -> supprimer (auteur ou admin)
// ============================================================

import { Request, Response } from "express";
import pool from "../config/postgres";

// ============================================================
// LISTER LES NOTES INTERNES D'UNE COMMANDE
// GET /api/commandes/:numero/notes-internes
// Acces : employe, admin
// ============================================================
export async function listerNotesInternes(req: Request, res: Response) {
  try {
    const { numero } = req.params;

    // Verifier que la commande existe
    const commandeExiste = await pool.query(
      "SELECT numero_commande FROM commande WHERE numero_commande = $1",
      [numero],
    );

    if (commandeExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    // Recuperer les notes avec les infos de l'auteur (jointure utilisateur + role)
    const resultat = await pool.query(
      `SELECT n.note_id, n.numero_commande, n.contenu, n.date_creation,
                    n.auteur_id, u.prenom AS auteur_prenom, u.nom AS auteur_nom, r.libelle AS auteur_role
             FROM commande_note_interne n
             JOIN utilisateur u ON n.auteur_id = u.utilisateur_id
             JOIN role r ON u.role_id = r.role_id
             WHERE n.numero_commande = $1
             ORDER BY n.date_creation DESC`,
      [numero],
    );

    res.json({ notes: resultat.rows });
  } catch (erreur) {
    console.error("Erreur lors de la recuperation des notes internes :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// AJOUTER UNE NOTE INTERNE
// POST /api/commandes/:numero/notes-internes
// Body : { contenu }
// Acces : employe, admin
// L'auteur est automatiquement l'utilisateur connecte
// ============================================================
export async function ajouterNoteInterne(req: Request, res: Response) {
  try {
    const utilisateur = req.session.utilisateur!;
    const { numero } = req.params;
    const { contenu } = req.body;

    // 1. Validation du contenu
    if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
      return res.status(400).json({
        erreur: "Le contenu de la note est obligatoire",
      });
    }

    if (contenu.length > 2000) {
      return res.status(400).json({
        erreur: "La note ne peut pas depasser 2000 caracteres",
      });
    }

    // 2. Verifier que la commande existe
    const commandeExiste = await pool.query(
      "SELECT numero_commande FROM commande WHERE numero_commande = $1",
      [numero],
    );

    if (commandeExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Commande introuvable" });
    }

    // 3. Insertion de la note
    const resultat = await pool.query(
      `INSERT INTO commande_note_interne (numero_commande, auteur_id, contenu)
             VALUES ($1, $2, $3)
             RETURNING note_id, numero_commande, contenu, date_creation, auteur_id`,
      [numero, utilisateur.id, contenu.trim()],
    );

    // 4. On recupere aussi les infos de l'auteur pour la reponse
    const noteCreee = resultat.rows[0];
    const auteur = await pool.query(
      "SELECT prenom, nom, role FROM utilisateur WHERE utilisateur_id = $1",
      [utilisateur.id],
    );

    res.status(201).json({
      message: "Note interne ajoutee avec succes",
      note: {
        ...noteCreee,
        auteur_prenom: auteur.rows[0].prenom,
        auteur_nom: auteur.rows[0].nom,
        auteur_role: auteur.rows[0].role,
      },
    });
  } catch (erreur) {
    console.error("Erreur lors de l'ajout de la note interne :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// MODIFIER UNE NOTE INTERNE
// PUT /api/commandes/:numero/notes-internes/:noteId
// Body : { contenu }
// Acces : auteur de la note uniquement
// ============================================================
export async function modifierNoteInterne(req: Request, res: Response) {
  try {
    const utilisateur = req.session.utilisateur!;
    const { noteId } = req.params;
    const { contenu } = req.body;

    // 1. Validation du contenu
    if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
      return res.status(400).json({
        erreur: "Le contenu de la note est obligatoire",
      });
    }

    if (contenu.length > 2000) {
      return res.status(400).json({
        erreur: "La note ne peut pas depasser 2000 caracteres",
      });
    }

    // 2. Verifier que la note existe et recuperer son auteur
    const noteExiste = await pool.query(
      "SELECT note_id, auteur_id FROM commande_note_interne WHERE note_id = $1",
      [noteId],
    );

    if (noteExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Note introuvable" });
    }

    const note = noteExiste.rows[0];

    // 3. Seul l'auteur peut modifier sa note (regle metier)
    if (note.auteur_id !== utilisateur.id) {
      return res.status(403).json({
        erreur: "Vous ne pouvez modifier que vos propres notes",
      });
    }

    // 4. Mise a jour
    const resultat = await pool.query(
      `UPDATE commande_note_interne
             SET contenu = $1
             WHERE note_id = $2
             RETURNING note_id, numero_commande, contenu, date_creation, auteur_id`,
      [contenu.trim(), noteId],
    );

    res.json({
      message: "Note modifiee avec succes",
      note: resultat.rows[0],
    });
  } catch (erreur) {
    console.error("Erreur lors de la modification de la note interne :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}

// ============================================================
// SUPPRIMER UNE NOTE INTERNE
// DELETE /api/commandes/:numero/notes-internes/:noteId
// Acces : auteur de la note OU administrateur
// ============================================================
export async function supprimerNoteInterne(req: Request, res: Response) {
  try {
    const utilisateur = req.session.utilisateur!;
    const { noteId } = req.params;

    // 1. Verifier que la note existe et recuperer son auteur
    const noteExiste = await pool.query(
      "SELECT note_id, auteur_id FROM commande_note_interne WHERE note_id = $1",
      [noteId],
    );

    if (noteExiste.rows.length === 0) {
      return res.status(404).json({ erreur: "Note introuvable" });
    }

    const note = noteExiste.rows[0];

    // 2. Seuls l'auteur OU un admin peuvent supprimer
    const estAuteur = note.auteur_id === utilisateur.id;
    const estAdmin = utilisateur.role === "administrateur";

    if (!estAuteur && !estAdmin) {
      return res.status(403).json({
        erreur: "Vous ne pouvez supprimer que vos propres notes (ou etre administrateur)",
      });
    }

    // 3. Suppression
    await pool.query(
      "DELETE FROM commande_note_interne WHERE note_id = $1",
      [noteId],
    );

    res.json({ message: "Note supprimee avec succes" });
  } catch (erreur) {
    console.error("Erreur lors de la suppression de la note interne :", erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
}
