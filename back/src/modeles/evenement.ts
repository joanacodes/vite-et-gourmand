// ============================================================
// MODELE MONGODB : EVENEMENT
// Cette collection stocke tous les evenements/logs du site :
// - consultation_menu (quand un menu est consulte)
// - creation_commande (quand une commande est creee)
// - annulation_commande (quand une commande est annulee)
// - publication_avis (quand un avis est publie)
//
// Avantage : MongoDB est ideal pour ce type de donnees
// (haute volumetrie, schema flexible, ecritures rapides)
// ============================================================

import mongoose from "mongoose";

const schemaEvenement = new mongoose.Schema({
    // Type d'evenement (consultation_menu, creation_commande, etc.)
    type: {
        type: String,
        required: true,
        index: true // Index pour les requetes rapides par type
    },
    
    // ID de l'utilisateur (peut etre null pour les visiteurs anonymes)
    utilisateurId: {
        type: Number,
        default: null
    },
    
    // ID du menu concerne (pour consultation_menu et creation_commande)
    menuId: {
        type: Number,
        default: null
    },
    
    // Numero de commande (pour creation_commande et annulation_commande)
    numeroCommande: {
        type: String,
        default: null
    },
    
    // Donnees additionnelles flexibles (montant, note, etc.)
    donnees: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Date de l'evenement (auto)
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    collection: "evenements" // Nom de la collection MongoDB
});

const Evenement = mongoose.model("Evenement", schemaEvenement);

export default Evenement;
