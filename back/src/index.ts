// ============================================================
// SERVEUR PRINCIPAL - VITE & GOURMAND
// Ce fichier est le point d'entree de l'application back-end.
// Il configure Express, les middlewares (dont securite),
// les routes et lance le serveur.
// ============================================================

import dns from "dns";
// Force Node a utiliser des serveurs DNS publics fiables (Google + Cloudflare)
// plutot que le DNS configure dans Windows. Evite l'erreur ECONNREFUSED
// quand Windows pointe sur un DNS local (127.0.0.1) qui n'ecoute plus,
// ce qui arrive apres desinstallation d'un VPN, Docker, WSL, etc.
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { testerConnexionPostgres } from "./config/postgres";
import { connecterMongoDB } from "./config/mongodb";
import { configurationSession } from "./config/session";
import {
  generateCsrfToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
} from "./config/csrf";
import {
  limiteurConnexion,
  limiteurMotDePasseOublie,
  limiteurContact,
  limiteurGlobal,
} from "./config/securite";
import routesAuth from "./routes/auth";
import routesMenus from "./routes/menu";
import routesMenuImages from "./routes/menuImage";
import routesPlats from "./routes/plat";
import routesCommandes from "./routes/commande";
import routesCommandeNotesInternes from "./routes/commandeNoteInterne";
import routesAvis from "./routes/avis";
import routesUtilisateurs from "./routes/utilisateur";
import routesStats from "./routes/stats";
import routesContact from "./routes/contact";
import routesHoraires from "./routes/horaire";
import routesReference from "./routes/reference";
import routesParametres from "./routes/parametre";
import routesUpload from "./routes/upload";
import { DOSSIER_UPLOADS } from "./controleurs/upload";
import { demarrerCronAnonymisation } from "./services/cronAnonymisation";

// On charge les variables du fichier .env
dotenv.config();

// Creation de l'application Express
const app = express();

// Definition du port (par defaut 3000 si rien n'est defini dans .env)
const PORT = process.env.PORT || 3000;

// ============================================================
// SECURITE - MIDDLEWARES PRIORITAIRES
// ============================================================

// Helmet : ajoute des headers HTTP de securite
// Protege contre XSS, clickjacking, MIME sniffing, etc.
app.use(helmet());

// Desactive l'header "X-Powered-By" qui revele Express
app.disable("x-powered-by");

// Limiteur global anti-DOS
app.use(limiteurGlobal);

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

// CORS : permet au front (autre domaine) de communiquer avec le back
app.use(
  cors({
    origin: process.env.FRONT_URL || "http://localhost:5173",
    credentials: true,
    // On expose le header x-csrf-token pour le double-submit cookie pattern
    allowedHeaders: ["Content-Type", "x-csrf-token"],
  }),
);

// Parse les cookies (necessaire pour la protection CSRF)
app.use(cookieParser());

// Limite la taille du body a 10kb (anti DOS)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ============================================================
// FICHIERS STATIQUES (UPLOADS)
// ============================================================
// Sert les images uploadees a l'URL /uploads/...
// IMPORTANT : place AVANT les middlewares de session/CSRF pour
// que les images se chargent rapidement et sans contrainte d'auth
// (les URLs sont longues et imprevisibles : URLs en pratique secretes).
//
// Headers de cache : 1 jour (les fichiers ont un nom unique, donc
// si l'image change, l'URL change aussi : safe a cacher longtemps).
app.use(
  "/uploads",
  express.static(DOSSIER_UPLOADS, {
    maxAge: "1d",
    // Force le Content-Type adapte (pas d'inference text/html)
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

// Configuration des sessions (doit etre AVANT les routes)
app.use(configurationSession);

// ============================================================
// CSRF - PROTECTION DOUBLE-SUBMIT COOKIE
// ============================================================
// Le front recupere son token via GET /api/csrf-token (NON protege).
// Tous les POST/PUT/PATCH/DELETE doivent envoyer le token dans
// le header x-csrf-token sinon la requete est refusee (403).
// ============================================================

// Endpoint pour que le front recupere un token CSRF.
// Doit etre place AVANT doubleCsrfProtection pour ne pas etre intercepte.
app.get("/api/csrf-token", (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// Protection CSRF active sur toutes les routes a effet de bord
// (POST/PUT/PATCH/DELETE). Les GET passent sans verification.
app.use(doubleCsrfProtection);

// ============================================================
// ROUTES
// ============================================================

// Route de test
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Bienvenue sur l'API Vite & Gourmand !",
    version: "1.0.0",
    statut: "operationnel",
  });
});

// Routes d'authentification : /api/auth/...
// Application de limiteurs specifiques sur les routes sensibles
app.use("/api/auth/connexion", limiteurConnexion);
app.use("/api/auth/mot-de-passe-oublie", limiteurMotDePasseOublie);
app.use("/api/auth", routesAuth);

// Routes des menus : /api/menus/...
app.use("/api/menus", routesMenus);

// Routes des images de menu : /api/menus/:menuId/images
// Sous-ressource des menus, lecture publique + ecriture admin/employe
app.use("/api/menus/:menuId/images", routesMenuImages);

// Routes des plats : /api/plats/...
app.use("/api/plats", routesPlats);

// Routes des commandes : /api/commandes/...
app.use("/api/commandes", routesCommandes);

// Routes des notes internes de commande : /api/commandes/:numero/notes-internes
// Sous-ressource des commandes, reservee a l'equipe interne
app.use("/api/commandes/:numero/notes-internes", routesCommandeNotesInternes);

// Routes des avis : /api/avis/...
app.use("/api/avis", routesAvis);

// Routes des utilisateurs : /api/utilisateurs/...
app.use("/api/utilisateurs", routesUtilisateurs);

// Routes des statistiques : /api/stats/...
app.use("/api/stats", routesStats);

// Donnees de reference (themes, regimes, allergenes)
app.use("/api", routesReference);

// Parametres de l'application
app.use("/api/parametres", routesParametres);

// Upload d'images (admin/employe seulement)
app.use("/api/upload", routesUpload);

// Route du formulaire de contact : /api/contact (avec limiteur)
app.use("/api/contact", limiteurContact, routesContact);

// Routes des horaires : /api/horaires
// Lecture publique (page Contact/Accueil), modification admin
app.use("/api/horaires", routesHoraires);

// ============================================================
// GESTION DES ERREURS CSRF
// ============================================================
// Si la validation CSRF echoue, on renvoie du JSON propre plutot
// que la page HTML par defaut d'Express, pour que le front puisse
// gerer (ex: refaire un GET /api/csrf-token et reessayer).
// ============================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err === invalidCsrfTokenError || err?.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      erreur: "Token CSRF invalide ou manquant. Rafraichissez la page.",
      code: "CSRF_INVALIDE",
    });
  }
  // Autres erreurs : on passe a la chaine standard d'Express
  next(err);
});

// ============================================================
// LANCEMENT DU SERVEUR
// ============================================================

async function demarrerServeur() {
  // On teste la connexion a PostgreSQL
  await testerConnexionPostgres();

  // On se connecte a MongoDB (necessaire avant de lancer les sessions)
  await connecterMongoDB();

  // On demarre le cron quotidien d'anonymisation RGPD (3h du matin)
  demarrerCronAnonymisation();

  // On lance le serveur Express
  app.listen(PORT, () => {
    console.log(`🚀 Serveur demarre sur http://localhost:${PORT}`);
  });
}

demarrerServeur();
