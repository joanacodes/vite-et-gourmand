// ============================================================
// SERVEUR PRINCIPAL - VITE & GOURMAND
// Ce fichier est le point d'entree de l'application back-end.
// Il configure Express, les middlewares, et lance le serveur.
// ============================================================

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testerConnexionPostgres } from "./config/postgres";
import { connecterMongoDB } from "./config/mongodb";

// On charge les variables du fichier .env
dotenv.config();

// Creation de l'application Express
const app = express();

// Definition du port (par defaut 3000 si rien n'est defini dans .env)
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES
// Ce sont des fonctions qui s'executent pour chaque requete entrante
// ============================================================

// CORS : permet au front (autre domaine) de communiquer avec le back
app.use(cors({
    origin: process.env.FRONT_URL || "http://localhost:5173",
    credentials: true // necessaire pour les sessions
}));

// Permet a Express de lire le JSON envoye par le client
app.use(express.json());

// Permet a Express de lire les donnees de formulaires URL-encoded
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTES
// Pour l'instant on a juste une route de test
// ============================================================

// Route de test : http://localhost:3000/
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Bienvenue sur l'API Vite & Gourmand !",
        version: "1.0.0",
        statut: "operationnel"
    });
});

// Route de test pour verifier que le serveur fonctionne
app.get("/api/test", (req: Request, res: Response) => {
    res.json({
        message: "Le serveur fonctionne correctement",
        date: new Date().toISOString()
    });
});

// ============================================================
// LANCEMENT DU SERVEUR
// On teste les connexions BDD puis on lance Express
// ============================================================

async function demarrerServeur() {
    // On teste la connexion a PostgreSQL
    await testerConnexionPostgres();

    // On se connecte a MongoDB
    await connecterMongoDB();

    // On lance le serveur Express
    app.listen(PORT, () => {
        console.log(`🚀 Serveur demarre sur http://localhost:${PORT}`);
    });
}

// On lance le serveur
demarrerServeur();
