// ============================================================
// CONNEXION A MONGODB
// Ce fichier configure la connexion a MongoDB Atlas via Mongoose.
// Mongoose est un ODM (Object Document Mapper) qui simplifie
// la manipulation des donnees NoSQL.
// ============================================================

import mongoose from "mongoose";
import dotenv from "dotenv";

// On charge les variables du fichier .env
dotenv.config();

// Fonction pour se connecter a MongoDB
export async function connecterMongoDB() {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("La variable MONGO_URI n'est pas definie dans le fichier .env");
        }

        // On etablit la connexion
        await mongoose.connect(uri);

        console.log("✅ Connecte a MongoDB avec succes");
    } catch (erreur) {
        console.error("❌ Erreur de connexion a MongoDB :", erreur);
    }
}
