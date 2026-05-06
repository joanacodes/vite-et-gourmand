// ============================================================
// CONFIGURATION DES SESSIONS
// On utilise express-session pour gerer les sessions des utilisateurs.
// Les sessions sont stockees dans MongoDB grace a connect-mongo.
// Cela permet de garder les sessions meme si on redemarre le serveur.
// ============================================================

import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";

dotenv.config();

// Configuration de la session
export const configurationSession = session({
    // Cle secrete pour signer les cookies de session
    // Si quelqu'un change le cookie cote client, le serveur le detectera
    secret: process.env.SESSION_SECRET || "secret_par_defaut_a_changer",

    // Ne pas resauvegarder la session si elle n'a pas change
    resave: false,

    // Ne pas creer de session pour les visiteurs non connectes
    saveUninitialized: false,

    // Stockage des sessions dans MongoDB
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
        ttl: 60 * 60 * 24 * 7 // duree de vie : 7 jours
    }),

    // Configuration du cookie de session
    cookie: {
        httpOnly: true, // le cookie n'est pas accessible en JavaScript (protege contre le XSS)
        secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours en millisecondes
        sameSite: "lax" // protege contre les attaques CSRF
    }
});

// On etend les types de express-session pour ajouter notre proprio "utilisateur"
// dans la session (TypeScript en a besoin pour ne pas raler)
declare module "express-session" {
    interface SessionData {
        utilisateur?: {
            id: number;
            email: string;
            role: string;
        };
    }
}
