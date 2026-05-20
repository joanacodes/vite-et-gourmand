// ============================================================
// MODELE MONGODB : PARAMETRES
// Stocke les parametres de configuration de l'application :
// - coordonnees de l'entreprise (adresse, telephone, email)
// - politique de reservation (acompte, delai mini, TVA, reduction)
// - tarification de la livraison (forfait, prix au km)
//
// On utilise un schema flexible (cle/valeur) pour pouvoir
// ajouter de nouveaux parametres sans migration de schema.
//
// Une seule entree par cle (unique), modifiable uniquement
// par les administrateurs.
// ============================================================

import mongoose from "mongoose";

const schemaParametre = new mongoose.Schema({
    cle: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    valeur: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    libelle: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    dateModification: {
        type: Date,
        default: Date.now,
    },
});

export const Parametre = mongoose.model("Parametre", schemaParametre);

// Valeurs par defaut (utilisees si la cle n'existe pas en BDD).
// Centralise toutes les valeurs "en dur" du projet.
export const PARAMETRES_DEFAUTS: Record<string, any> = {
    // Coordonnees entreprise
    entreprise_adresse: "12 cours Pasteur, 33000 Bordeaux, France",
    entreprise_telephone: "+33 5 56 12 34 56",
    entreprise_email: "contact@vite-et-gourmand.fr",

    // Politique de reservation
    reservation_delai_minimum_jours: 7,
    reservation_acompte_pourcentage: 30,
    reservation_tva_pourcentage: 20,
    reservation_reduction_grand_groupe_pourcentage: 10,
    reservation_reduction_grand_groupe_seuil: 5,

    // Livraison
    livraison_forfait_base_euros: 5,
    livraison_prix_par_km_euros: 0.59,
    livraison_latitude_traiteur: 44.8378,
    livraison_longitude_traiteur: -0.5792,
};
