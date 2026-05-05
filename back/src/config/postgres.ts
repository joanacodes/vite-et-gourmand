// ============================================================
// CONNEXION A POSTGRESQL
// Ce fichier configure et exporte le pool de connexions PostgreSQL
// On utilise un "pool" qui gere plusieurs connexions en parallele,
// c'est plus performant que de creer une nouvelle connexion a chaque requete.
// ============================================================

import { Pool } from "pg";
import dotenv from "dotenv";

// On charge les variables du fichier .env
dotenv.config();

// Creation du pool de connexions
const pool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || "5432"),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});

// Fonction pour tester la connexion au demarrage du serveur
export async function testerConnexionPostgres() {
    try {
        const client = await pool.connect();
        console.log("✅ Connecte a PostgreSQL avec succes");
        client.release(); // on libere le client apres le test
    } catch (erreur) {
        console.error("❌ Erreur de connexion a PostgreSQL :", erreur);
    }
}

// On exporte le pool pour pouvoir l'utiliser dans les controleurs
export default pool;
