// ============================================================
// SERVICE DE TRACKING
// Fonctions appelees depuis les controleurs pour logger
// les evenements dans MongoDB
//
// Toutes les fonctions sont "fire and forget" :
// elles ne plantent JAMAIS l'application,
// meme si MongoDB est indisponible
// ============================================================

import Evenement from "../modeles/evenement";


// ============================================================
// LOGGER UNE CONSULTATION DE MENU
// ============================================================
export async function loggerConsultationMenu(menuId: number, utilisateurId: number | null = null) {
    try {
        await Evenement.create({
            type: "consultation_menu",
            menuId,
            utilisateurId
        });
    } catch (erreur) {
        // On n'affiche meme pas l'erreur pour ne pas polluer les logs
        // Le tracking est non-critique
    }
}


// ============================================================
// LOGGER LA CREATION D'UNE COMMANDE
// ============================================================
export async function loggerCreationCommande(
    numeroCommande: string,
    menuId: number,
    utilisateurId: number,
    montant: number,
    nombrePersonnes: number
) {
    try {
        await Evenement.create({
            type: "creation_commande",
            numeroCommande,
            menuId,
            utilisateurId,
            donnees: {
                montant,
                nombrePersonnes
            }
        });
    } catch (erreur) {
        // Tracking non-critique
    }
}


// ============================================================
// LOGGER L'ANNULATION D'UNE COMMANDE
// ============================================================
export async function loggerAnnulationCommande(numeroCommande: string, utilisateurId: number) {
    try {
        await Evenement.create({
            type: "annulation_commande",
            numeroCommande,
            utilisateurId
        });
    } catch (erreur) {
        // Tracking non-critique
    }
}


// ============================================================
// LOGGER LA PUBLICATION D'UN AVIS
// ============================================================
export async function loggerPublicationAvis(avisId: number, utilisateurId: number, note: number) {
    try {
        await Evenement.create({
            type: "publication_avis",
            utilisateurId,
            donnees: {
                avisId,
                note
            }
        });
    } catch (erreur) {
        // Tracking non-critique
    }
}
