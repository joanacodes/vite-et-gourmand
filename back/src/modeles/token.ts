// ============================================================
// MODELE MONGODB : TOKEN DE REINITIALISATION
// Cette collection stocke les tokens generes pour la reinitialisation
// du mot de passe.
//
// AVANTAGE MongoDB : index TTL (Time To Live) qui supprime
// automatiquement les tokens apres 1 heure.
// ============================================================

import mongoose from "mongoose";

const schemaToken = new mongoose.Schema({
    // Le token aleatoire (envoye par email)
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // L'utilisateur concerne (id PostgreSQL)
    utilisateurId: {
        type: Number,
        required: true
    },
    
    // Date de creation
    dateCreation: {
        type: Date,
        default: Date.now,
        // Index TTL : MongoDB supprime automatiquement le document apres 3600 secondes (1h)
        expires: 3600
    }
}, {
    collection: "tokens_reinitialisation"
});

const TokenReinitialisation = mongoose.model("TokenReinitialisation", schemaToken);

export default TokenReinitialisation;
