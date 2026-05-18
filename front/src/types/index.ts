// ============================================================
// TYPES PARTAGES
// Format reel renvoye par le back-end (verifie via /api/menus)
// ============================================================

// ----- UTILISATEUR -----
export type RoleUtilisateur = 'utilisateur' | 'employe' | 'administrateur'

export interface PreferencesNotifs {
    notifCommandes: boolean
    notifNewsletter: boolean
    notifOffres: boolean
    notifConseils: boolean
}

export interface Utilisateur {
    id: number
    email: string
    nom: string
    prenom: string
    telephone: string | null
    ville: string | null
    pays: string | null
    adressePostale: string | null
    actif: boolean
    dateCreation: string
    role: RoleUtilisateur
    preferences: PreferencesNotifs
}

// ----- MENU -----
export interface MenuImage {
    image_id: number
    url: string
    legende: string | null
    est_principale?: boolean
    ordre_affichage?: number
}

export interface Plat {
    plat_id: number
    titre: string
    type: 'entree' | 'plat' | 'dessert'
    photo: string | null
}

export interface Regime {
    regime_id: number
    libelle: string
}

export interface Menu {
    menu_id: number
    titre: string
    description: string
    nombre_personnes_minimum: number
    prix_par_personne: string  // ⚠️ Le back renvoie en string (numeric SQL)
    conditions: string | null
    quantite_restante: number
    theme: string  // ⚠️ Le back renvoie le LIBELLE, pas l'ID
    image_principale?: MenuImage | null
    // Champs presents uniquement sur le detail
    images?: MenuImage[]
    plats?: Plat[]
    regimes?: Regime[]
}

// ----- COMMANDE -----
export type StatutCommande =
    | 'en_attente'
    | 'accepte'
    | 'en_preparation'
    | 'en_cours_livraison'
    | 'livre'
    | 'attente_retour_materiel'
    | 'terminee'
    | 'annulee'

export interface Commande {
    numero_commande: string
    date_commande: string
    date_prestation: string
    heure_livraison: string | null
    lieu_livraison: string
    distance_km: number
    nombre_personnes: number
    prix_menu: number
    prix_livraison: number
    statut: StatutCommande
    pret_materiel: boolean
    notes_client: string | null
    menu_titre?: string
    utilisateur_id?: number
    client_nom?: string
    client_prenom?: string
    client_email?: string
}

// ----- AVIS -----
export type StatutAvis = 'valide' | 'refuse' | 'en_attente'

export interface Avis {
    avis_id: number
    note: number
    description: string
    date_creation: string
    statut?: StatutAvis
    auteur_prenom: string
    auteur_nom?: string
    menu_id?: number
    menu_titre?: string
    numero_commande?: string
}

// ----- HORAIRES -----
export interface Horaire {
    horaire_id: number
    jour: string
    heure_ouverture_matin: string | null
    heure_fermeture_matin: string | null
    heure_ouverture_apresmidi: string | null
    heure_fermeture_apresmidi: string | null
    ferme: boolean
}
