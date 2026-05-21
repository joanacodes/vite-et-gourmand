// ============================================================
// CONNEXION A POSTGRESQL
// Ce fichier configure et exporte le pool de connexions PostgreSQL
// On utilise un "pool" qui gere plusieurs connexions en parallele,
// c'est plus performant que de creer une nouvelle connexion a chaque requete.
//
// Deux modes de configuration :
// - DEV (local) : variables PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD
// - PROD (Render) : une seule variable DATABASE_URL (fournie par Render),
//   avec SSL active automatiquement.
// ============================================================

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

// On charge les variables du fichier .env
dotenv.config();

// Configuration adaptee selon l'environnement
const configPool: PoolConfig = process.env.DATABASE_URL
  ? {
      // Mode production : Render fournit une seule URL de connexion
      connectionString: process.env.DATABASE_URL,
      // SSL obligatoire sur Render (certificat auto-signe accepte)
      ssl: { rejectUnauthorized: false },
    }
  : {
      // Mode developpement : variables separees lues depuis .env local
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || "5432"),
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    };

// Creation du pool de connexions
const pool = new Pool(configPool);

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
