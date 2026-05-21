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
import path from "path";
import fs from "fs";
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

// IMPORTANT : Render (et la plupart des PaaS) placent un reverse proxy
// HTTPS devant l'app. Sans `trust proxy`, Express ne sait pas que la
// requete arrive en HTTPS, et le cookie `secure: true` n'est pas envoye
// au navigateur ⇒ pas de session, pas de CSRF. On active la confiance
// uniquement en production pour eviter les effets de bord en local.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ============================================================
// SECURITE - MIDDLEWARES PRIORITAIRES
// ============================================================

// Helmet : ajoute des headers HTTP de securite
// Protege contre XSS, clickjacking, MIME sniffing, etc.
// Helmet : ajoute des headers HTTP de securite
// Protege contre XSS, clickjacking, MIME sniffing, etc.
// CSP personnalise pour autoriser Google Fonts et les images uploadees.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // 'unsafe-inline' pour les styles Bootstrap inline et le styling
        // dynamique. Si tu veux durcir : passer a un nonce.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        // Les images peuvent venir du serveur lui-meme (/uploads) ou en data: (icones SVG)
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        // Connexions API : meme origine en prod, sinon front/back separes
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // Render fournit le HTTPS, on garde HSTS active en prod
    crossOriginEmbedderPolicy: false,
  }),
);

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
// SERVIR LE FRONT EN PRODUCTION
// ============================================================
// En prod (Render), le back-end sert aussi le build statique du front
// situe dans front/dist (genere par `npm run build` dans le dossier front).
// Comme ca, front et back sont sur le meme domaine : pas de CORS,
// pas de variable VITE_API_URL a configurer, les fetchs en /api/...
// tombent naturellement sur Express.
//
// En dev local, on saute ce bloc : Vite tourne sur 5173 et redirige
// /api vers 3000 via son proxy (cf vite.config.ts).
// ============================================================

if (process.env.NODE_ENV === "production") {
  // Chemin absolu vers front/dist depuis back/dist/index.js (apres compilation)
  const cheminBuildFront = path.join(__dirname, "..", "..", "front", "dist");

  if (fs.existsSync(cheminBuildFront)) {
    // Sert les fichiers statiques (HTML, JS, CSS, images...)
    app.use(express.static(cheminBuildFront));

    // SPA fallback : toute URL qui n'est pas /api/* ni /uploads/*
    // doit retourner index.html (sinon F5 sur /menus donne du 404).
    // Express 5 : on utilise un middleware sans pattern pour eviter
    // le bug de path-to-regexp avec les wildcards.
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== "GET") return next();
      if (req.path.startsWith("/api")) return next();
      if (req.path.startsWith("/uploads")) return next();
      res.sendFile(path.join(cheminBuildFront, "index.html"));
    });
  } else {
    console.warn(
      "⚠️  NODE_ENV=production mais front/dist introuvable. Front non servi.",
    );
  }
}

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
