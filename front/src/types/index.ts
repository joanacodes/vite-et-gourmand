// ============================================================
// TYPES PARTAGES
// 
// Ces types correspondent aux donnees renvoyees par le back-end.
// Ils evoluent en parallele du back, et garantissent que le front
// et le back parlent le meme langage (typage statique).
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
  est_principale: boolean
  ordre_affichage: number
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
  prix_par_personne: number
  regime: string | null
  conditions: string | null
  quantite_restante: number
  theme_id: number
  theme_libelle?: string
  // Champs ajoutes par le back-end
  image_principale?: MenuImage | null  // pour la liste (vignette)
  images?: MenuImage[]                  // pour le detail (galerie complete)
  plats?: Plat[]                        // pour le detail
  regimes?: Regime[]                    // pour le detail
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
  note: number  // 1 a 5
  description: string
  date_creation: string
  statut?: StatutAvis  // visible cote admin/employe
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
