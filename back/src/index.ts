// ============================================================
// SERVEUR PRINCIPAL - VITE & GOURMAND
// Ce fichier est le point d'entree de l'application back-end.
// Il configure Express, les middlewares, les routes et lance le serveur.
// ============================================================

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testerConnexionPostgres } from "./config/postgres";
import { connecterMongoDB } from "./config/mongodb";
import { configurationSession } from "./config/session";
import routesAuth from "./routes/auth";
import routesMenus from "./routes/menu";
import routesPlats from "./routes/plat";
import routesCommandes from "./routes/commande";
import routesAvis from "./routes/avis";
import routesUtilisateurs from "./routes/utilisateur";
import routesStats from "./routes/stats";
import routesContact from "./routes/contact";

// On charge les variables du fichier .env
dotenv.config();

// Creation de l'application Express
const app = express();

// Definition du port (par defaut 3000 si rien n'est defini dans .env)
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

// CORS : permet au front (autre domaine) de communiquer avec le back
app.use(
    cors({
        origin: process.env.FRONT_URL || "http://localhost:5173",
        credentials: true, // necessaire pour les sessions
    })
);

// Permet a Express de lire le JSON envoye par le client
app.use(express.json());

// Permet a Express de lire les donnees de formulaires URL-encoded
app.use(express.urlencoded({ extended: true }));

// Configuration des sessions (doit etre AVANT les routes)
app.use(configurationSession);

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
app.use("/api/auth", routesAuth);

// Routes des menus : /api/menus/...
app.use("/api/menus", routesMenus);

// Routes des plats : /api/plats/...
app.use("/api/plats", routesPlats);

// Routes des commandes : /api/commandes/...
app.use("/api/commandes", routesCommandes);

// Routes des avis : /api/avis/...
app.use("/api/avis", routesAvis);

// Routes des utilisateurs : /api/utilisateurs/...
app.use("/api/utilisateurs", routesUtilisateurs);

// Routes des statistiques : /api/stats/...
app.use("/api/stats", routesStats);

// Route du formulaire de contact : /api/contact
app.use("/api/contact", routesContact);

// ============================================================
// LANCEMENT DU SERVEUR
// ============================================================

async function demarrerServeur() {
    // On teste la connexion a PostgreSQL
    await testerConnexionPostgres();

    // On se connecte a MongoDB (necessaire avant de lancer les sessions)
    await connecterMongoDB();

    // On lance le serveur Express
    app.listen(PORT, () => {
        console.log(`🚀 Serveur demarre sur http://localhost:${PORT}`);
    });
}

demarrerServeur();
