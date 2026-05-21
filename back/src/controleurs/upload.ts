// ============================================================
// CONTROLEUR D'UPLOAD D'IMAGES
// ============================================================
// Gere l'upload de fichiers images (plats, menus).
// Stockage : filesystem local dans back/uploads/<categorie>/
// Sert ensuite les fichiers via la route statique /uploads.
//
// Securite :
// - Multer avec limites de taille (5 Mo) et filtre MIME
// - Categorie validee (whitelist)
// - Nom de fichier randomise (evite collisions et path traversal)
// - Extension verifiee cote serveur (defense en profondeur)
// ============================================================

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Categories autorisees (whitelist anti path traversal)
const CATEGORIES_AUTORISEES = new Set(["plats", "menus"]);

// Extensions et MIME autorisees
const EXTENSIONS_AUTORISEES = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MIMES_AUTORISES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

// Taille max par fichier : 5 Mo
const TAILLE_MAX_OCTETS = 5 * 1024 * 1024;

// Dossier racine d'upload (cree au demarrage si absent)
const DOSSIER_UPLOADS = path.join(process.cwd(), "uploads");

// Cree les sous-dossiers si necessaire au demarrage
for (const cat of CATEGORIES_AUTORISEES) {
    const dossier = path.join(DOSSIER_UPLOADS, cat);
    fs.mkdirSync(dossier, { recursive: true });
}

// ============================================================
// STORAGE MULTER
// ============================================================
// Stockage disque avec nom de fichier randomise pour eviter les
// collisions et empecher tout path traversal via le nom d'origine.
const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const categorie = String(req.params.categorie || "");
        if (!CATEGORIES_AUTORISEES.has(categorie)) {
            return cb(new Error("Categorie invalide"), "");
        }
        cb(null, path.join(DOSSIER_UPLOADS, categorie));
    },
    filename: (_req, file, cb) => {
        // Nom : <timestamp>-<aleatoire>.<ext>
        // On garde l'extension d'origine apres validation
        const ext = path.extname(file.originalname).toLowerCase();
        if (!EXTENSIONS_AUTORISEES.has(ext)) {
            return cb(new Error("Extension non autorisee"), "");
        }
        const aleatoire = crypto.randomBytes(8).toString("hex");
        const nom = `${Date.now()}-${aleatoire}${ext}`;
        cb(null, nom);
    },
});

// Filtre MIME
function filtreMime(
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) {
    if (!MIMES_AUTORISES.has(file.mimetype)) {
        return cb(
            new Error(
                "Type de fichier non autorise. Acceptes : JPEG, PNG, WebP",
            ),
        );
    }
    cb(null, true);
}

export const uploadImage = multer({
    storage,
    limits: { fileSize: TAILLE_MAX_OCTETS, files: 1 },
    fileFilter: filtreMime,
});

// ============================================================
// HANDLER : POST /api/upload/:categorie
// ============================================================
// Retourne l'URL relative de l'image uploadee.
// Le front stockera cette URL dans la colonne photo/url de la BDD.
export async function gererUpload(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({
            erreur: "Aucun fichier recu. Verifiez le champ 'image' et le type Content-Type multipart/form-data.",
        });
    }

    const categorie = String(req.params.categorie || "");
    const url = `/uploads/${categorie}/${req.file.filename}`;

    res.status(201).json({
        url,
        nomFichier: req.file.filename,
        taille: req.file.size,
        mime: req.file.mimetype,
    });
}

// ============================================================
// HANDLER : DELETE /api/upload/:categorie/:fichier
// ============================================================
// Permet de supprimer une image uploadee (utilise quand l'utilisateur
// supprime ou remplace une image dans le formulaire).
//
// Securite : on verifie que le nom de fichier ne contient pas de
// caracteres de path traversal (./, ../, /, \) avant tout acces disque.
export async function supprimerImage(req: Request, res: Response) {
    const categorie = String(req.params.categorie || "");
    const fichier = String(req.params.fichier || "");

    if (!CATEGORIES_AUTORISEES.has(categorie)) {
        return res.status(400).json({ erreur: "Categorie invalide" });
    }

    // Validation stricte du nom de fichier
    if (
        !fichier ||
        fichier.includes("..") ||
        fichier.includes("/") ||
        fichier.includes("\\") ||
        fichier.length > 255
    ) {
        return res.status(400).json({ erreur: "Nom de fichier invalide" });
    }

    const cheminFichier = path.join(DOSSIER_UPLOADS, categorie, fichier);

    // Verification finale : le chemin resolu doit bien etre dans DOSSIER_UPLOADS
    // (defense en profondeur contre path traversal sophistique)
    const cheminResolu = path.resolve(cheminFichier);
    const dossierAttendu = path.resolve(path.join(DOSSIER_UPLOADS, categorie));
    if (!cheminResolu.startsWith(dossierAttendu)) {
        return res.status(400).json({ erreur: "Chemin invalide" });
    }

    try {
        await fs.promises.unlink(cheminResolu);
        res.status(204).end();
    } catch (err: any) {
        if (err.code === "ENOENT") {
            return res.status(404).json({ erreur: "Fichier introuvable" });
        }
        console.error("Erreur suppression image :", err);
        res.status(500).json({ erreur: "Erreur lors de la suppression" });
    }
}

// ============================================================
// MIDDLEWARE D'ERREUR MULTER
// ============================================================
// Convertit les erreurs multer (taille, MIME) en JSON propre.
export function gererErreurMulter(
    err: any,
    _req: Request,
    res: Response,
    next: (err?: any) => void,
) {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                erreur: `Fichier trop volumineux. Limite : ${TAILLE_MAX_OCTETS / 1024 / 1024} Mo`,
            });
        }
        return res.status(400).json({ erreur: err.message });
    }
    if (err) {
        return res.status(400).json({ erreur: err.message });
    }
    next();
}

export { DOSSIER_UPLOADS };
