// ============================================================
// CONFIGURATION DE LA SECURITE
// Centralise tous les middlewares de securite de l'application
// ============================================================

import rateLimit from "express-rate-limit";


// ============================================================
// LIMITEUR DE TAUX POUR LA CONNEXION
// Empeche les attaques par force brute sur le mot de passe
// Limite : 5 tentatives par tranche de 15 minutes par IP
// ============================================================
export const limiteurConnexion = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 tentatives
    message: {
        erreur: "Trop de tentatives de connexion. Veuillez reessayer dans 15 minutes."
    },
    standardHeaders: true, // Renvoie les infos dans les headers RateLimit-*
    legacyHeaders: false,
});


// ============================================================
// LIMITEUR DE TAUX POUR LE MOT DE PASSE OUBLIE
// Empeche le spam d'envoi d'emails de reinitialisation
// Limite : 3 demandes par heure par IP
// ============================================================
export const limiteurMotDePasseOublie = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // Maximum 3 demandes
    message: {
        erreur: "Trop de demandes de reinitialisation. Veuillez reessayer dans 1 heure."
    },
    standardHeaders: true,
    legacyHeaders: false,
});


// ============================================================
// LIMITEUR DE TAUX POUR LE FORMULAIRE DE CONTACT
// Empeche le spam via le formulaire
// Limite : 5 messages par heure par IP
// ============================================================
export const limiteurContact = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5,
    message: {
        erreur: "Trop de messages envoyes. Veuillez reessayer plus tard."
    },
    standardHeaders: true,
    legacyHeaders: false,
});


// ============================================================
// LIMITEUR DE TAUX GLOBAL
// Protection generale contre les attaques DOS
// Limite : 100 requetes par minute par IP
// ============================================================
export const limiteurGlobal = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        erreur: "Trop de requetes. Veuillez ralentir."
    },
    standardHeaders: true,
    legacyHeaders: false,
});
