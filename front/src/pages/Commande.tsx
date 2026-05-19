// ============================================================
// PAGE COMMANDE - /commande/:id
//
// Permet a un utilisateur connecte de commander un menu.
// Logique metier (conforme a l'enonce p.7 et au back) :
//
// - prixBase = prix_par_personne * nombrePersonnes
// - reduction = 10% si nombrePersonnes >= minimum + 5
// - livraison = 5€ + 0,59€/km  (Bordeaux = 0 km -> 5€)
// - totalTTC = prixBase - reduction + livraison
//
// Endpoint back : POST /api/commandes
// Body :
//   { menuId, nombrePersonnes, datePrestation, heureLivraison,
//     lieuLivraison, distanceKm, pretMateriel, notesClient }
//
// Garde-fous :
// - Si visiteur non connecte -> redirect /connexion avec retour
// - Si menu en rupture (quantite_restante = 0) -> message bloquant
// - Si nombrePersonnes < minimum -> erreur (cote front ET back)
// - Date de prestation : minimum demain (pas le jour meme)
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import type { Menu } from '../types'
import { useAuth } from '../contexts/AuthContext'
import './Commande.css'

interface ReponseCreationCommande {
    message: string
    commande: {
        numero: string
        prixBase: string
        reduction: string
        reductionAppliquee: boolean
        prixMenu: string
        prixLivraison: string
        prixTotal: string
        distanceKm: number
    }
}

export default function Commande() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { utilisateur } = useAuth()

    // ===== ETATS CHARGEMENT MENU =====
    const [menu, setMenu] = useState<Menu | null>(null)
    const [chargementMenu, setChargementMenu] = useState(true)
    const [erreurChargement, setErreurChargement] = useState('')

    // ===== ETATS FORMULAIRE =====
    const [datePrestation, setDatePrestation] = useState('')
    const [heureLivraison, setHeureLivraison] = useState('')
    const [adresseLivraison, setAdresseLivraison] = useState('')
    const [ville, setVille] = useState('Bordeaux')
    const [pays, setPays] = useState('France')
    const [distanceKm, setDistanceKm] = useState<number>(0)
    const [nombrePersonnes, setNombrePersonnes] = useState<number>(0)
    const [pretMateriel, setPretMateriel] = useState(false)
    const [notesClient, setNotesClient] = useState('')

    // ===== ETATS GEOCODING (calcul auto de la distance) =====
    // Le back peut calculer la distance, mais on le fait aussi cote front
    // pour afficher le prix en temps reel pendant la saisie de l'adresse.
    // API : Nominatim (OpenStreetMap) - gratuit, pas de cle, max 1 req/sec
    const [geocodingEnCours, setGeocodingEnCours] = useState(false)
    const [geocodingErreur, setGeocodingErreur] = useState<string | null>(null)
    const [adresseValidee, setAdresseValidee] = useState(false)
    const timerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ===== ETATS SOUMISSION =====
    const [envoiEnCours, setEnvoiEnCours] = useState(false)
    const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)
    const [succes, setSucces] = useState<ReponseCreationCommande['commande'] | null>(null)

    // ===== GARDE-FOU : REDIRECTION SI NON CONNECTE =====
    useEffect(() => {
        if (!utilisateur) {
            navigate('/connexion', {
                state: { retourApres: `/commande/${id}` },
                replace: true,
            })
        }
    }, [utilisateur, id, navigate])

    // ===== CHARGEMENT DU MENU =====
    useEffect(() => {
        async function charger() {
            try {
                setChargementMenu(true)
                setErreurChargement('')
                const data = await api.get<{ menu: Menu }>(`/api/menus/${id}`)
                setMenu(data.menu)
                // Initialiser nombrePersonnes au minimum du menu
                setNombrePersonnes(data.menu.nombre_personnes_minimum)
            } catch (err: any) {
                if (err.statut === 404) {
                    setErreurChargement("Ce menu n'existe pas ou a été supprimé.")
                } else {
                    setErreurChargement(err?.message || 'Erreur lors du chargement du menu.')
                }
            } finally {
                setChargementMenu(false)
            }
        }
        if (id) charger()
    }, [id])

    // ===== DATE MINIMUM = J+7 =====
    // Selon l'enonce : "Commande a passer au minimum 7 jours avant la prestation"
    // Si aujourd'hui = 19/05, premiere date reservable = 26/05
    const dateMinimum = useMemo(() => {
        const dateMin = new Date()
        dateMin.setDate(dateMin.getDate() + 7)
        // Format YYYY-MM-DD en respectant le fuseau local (sinon toISOString
        // peut decaler d'un jour pour les utilisateurs a l'est de UTC)
        const annee = dateMin.getFullYear()
        const mois = String(dateMin.getMonth() + 1).padStart(2, '0')
        const jour = String(dateMin.getDate()).padStart(2, '0')
        return `${annee}-${mois}-${jour}`
    }, [])

    // ============================================================
    // GEOCODING AUTO via Nominatim (OpenStreetMap)
    //
    // Coordonnees du traiteur (15 Rue des Remparts, Bordeaux)
    // Hardcodees pour eviter un appel API au chargement.
    // Identiques a celles du back (back/src/services/geolocation.ts)
    // ============================================================
    const TRAITEUR_LAT = 44.8378
    const TRAITEUR_LON = -0.5792

    // Formule de Haversine : distance a vol d'oiseau entre 2 points GPS
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (deg: number) => (deg * Math.PI) / 180
        const dLat = toRad(lat2 - lat1)
        const dLon = toRad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return Math.round(6371 * c * 100) / 100
    }

    // Geocode l'adresse via Nominatim et met a jour distanceKm
    async function geocoderEtCalculerDistance(adresseComplete: string) {
        setGeocodingEnCours(true)
        setGeocodingErreur(null)
        setAdresseValidee(false)

        try {
            const params = new URLSearchParams({
                q: adresseComplete,
                format: 'json',
                limit: '1',
                countrycodes: 'fr,be,ch,lu',
            })
            const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

            // Nominatim demande un User-Agent mais le navigateur le definit
            // automatiquement et bloque sa surcharge. On utilise donc juste
            // les en-tetes par defaut, ce qui reste conforme a leur usage.
            const reponse = await fetch(url, {
                headers: { 'Accept-Language': 'fr' },
            })

            if (!reponse.ok) {
                throw new Error(`Erreur ${reponse.status}`)
            }

            const donnees = await reponse.json()
            if (!Array.isArray(donnees) || donnees.length === 0) {
                setGeocodingErreur(
                    "Adresse introuvable. Vérifiez votre saisie ou continuez (le serveur recalculera)."
                )
                setDistanceKm(0)
                return
            }

            const lat = parseFloat(donnees[0].lat)
            const lon = parseFloat(donnees[0].lon)
            const distance = haversine(TRAITEUR_LAT, TRAITEUR_LON, lat, lon)
            setDistanceKm(distance)
            setAdresseValidee(true)
        } catch (err: any) {
            setGeocodingErreur(
                "Impossible de calculer la distance pour le moment. Le serveur la recalculera lors de la validation."
            )
            setDistanceKm(0)
        } finally {
            setGeocodingEnCours(false)
        }
    }

    // Effet : debouncing 1.2s sur la saisie d'adresse
    // (Nominatim limite a 1 req/seconde, on prend de la marge)
    useEffect(() => {
        // Si un champ obligatoire est vide, on ne tente pas le geocoding
        if (!adresseLivraison.trim() || !ville.trim()) {
            setDistanceKm(0)
            setAdresseValidee(false)
            setGeocodingErreur(null)
            return
        }

        // Annule le timer precedent
        if (timerDebounceRef.current) {
            clearTimeout(timerDebounceRef.current)
        }

        // Programme un nouveau geocoding apres 1.2s sans frappe
        timerDebounceRef.current = setTimeout(() => {
            const adresseComplete = `${adresseLivraison}, ${ville}, ${pays}`
            geocoderEtCalculerDistance(adresseComplete)
        }, 1200)

        // Nettoyage si le composant est demonte
        return () => {
            if (timerDebounceRef.current) {
                clearTimeout(timerDebounceRef.current)
            }
        }
    }, [adresseLivraison, ville, pays])

    // ===== CALCULS DE PRIX (en temps reel) =====
    const calculs = useMemo(() => {
        if (!menu) {
            return {
                prixUnitaire: 0,
                prixBase: 0,
                reductionAppliquee: false,
                reduction: 0,
                sousTotalMenu: 0,
                prixLivraison: 0,
                total: 0,
            }
        }

        const prixUnitaire = Number(menu.prix_par_personne)
        const prixBase = prixUnitaire * nombrePersonnes
        const reductionAppliquee =
            nombrePersonnes >= menu.nombre_personnes_minimum + 5
        const reduction = reductionAppliquee ? prixBase * 0.1 : 0
        const sousTotalMenu = prixBase - reduction
        const km = Math.max(0, Number(distanceKm) || 0)
        const prixLivraison = 5 + km * 0.59
        const total = sousTotalMenu + prixLivraison

        return {
            prixUnitaire,
            prixBase,
            reductionAppliquee,
            reduction,
            sousTotalMenu,
            prixLivraison,
            total,
        }
    }, [menu, nombrePersonnes, distanceKm])

    // ===== HELPERS STEPPER PERSONNES =====
    function diminuerPersonnes() {
        if (!menu) return
        setNombrePersonnes((n) => Math.max(menu.nombre_personnes_minimum, n - 1))
    }
    function augmenterPersonnes() {
        setNombrePersonnes((n) => n + 1)
    }
    function changerPersonnesInput(valeur: string) {
        const n = parseInt(valeur, 10)
        if (!isNaN(n)) {
            setNombrePersonnes(n)
        }
    }

    // ===== VALIDATION =====
    function valider(): string | null {
        if (!menu) return 'Menu non chargé.'
        if (menu.quantite_restante <= 0) {
            return "Ce menu n'est plus disponible (rupture de stock)."
        }
        if (!datePrestation) return 'Veuillez choisir une date de prestation.'
        if (datePrestation < dateMinimum) {
            return 'La date de prestation doit être au minimum 7 jours après aujourd\'hui.'
        }
        if (!heureLivraison) return 'Veuillez indiquer une heure de livraison.'
        if (!adresseLivraison.trim()) return "Veuillez renseigner l'adresse de livraison."
        if (!ville.trim()) return 'Veuillez renseigner la ville.'
        if (distanceKm < 0) return 'La distance ne peut pas être négative.'
        if (nombrePersonnes < menu.nombre_personnes_minimum) {
            return `Ce menu nécessite au minimum ${menu.nombre_personnes_minimum} personnes.`
        }
        if (notesClient.length > 500) {
            return 'Les notes ne peuvent pas dépasser 500 caractères.'
        }
        return null
    }

    // ===== SOUMISSION =====
    async function soumettre(e: FormEvent) {
        e.preventDefault()
        setErreurEnvoi(null)

        const erreurValidation = valider()
        if (erreurValidation) {
            setErreurEnvoi(erreurValidation)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setEnvoiEnCours(true)

        try {
            // Adresse complete = adresse + ville + pays
            const lieuLivraison = `${adresseLivraison}, ${ville}, ${pays}`

            const reponse = await api.post<ReponseCreationCommande>('/api/commandes', {
                menuId: menu!.menu_id,
                nombrePersonnes,
                datePrestation,
                heureLivraison,
                lieuLivraison,
                // distance_km est INTEGER en BDD - on arrondit avant envoi
                distanceKm: Math.round(distanceKm),
                pretMateriel,
                notesClient: notesClient.trim() || undefined,
            })

            setSucces(reponse.commande)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err: any) {
            setErreurEnvoi(err?.message || 'Une erreur est survenue lors de la commande.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setEnvoiEnCours(false)
        }
    }

    // ============================================================
    // RENDU
    // ============================================================

    // --- Etat : chargement
    if (chargementMenu) {
        return (
            <main className="page-commande">
                <div className="container py-5 text-center">
                    <div
                        className="spinner-border"
                        style={{ color: 'var(--color-bordeaux)' }}
                        role="status"
                    >
                        <span className="visually-hidden">Chargement du menu...</span>
                    </div>
                </div>
            </main>
        )
    }

    // --- Etat : erreur de chargement
    if (erreurChargement || !menu) {
        return (
            <main className="page-commande">
                <div className="container py-5">
                    <div className="alert alert-danger" role="alert">
                        {erreurChargement || 'Menu introuvable.'}
                    </div>
                    <Link to="/menus" className="btn btn-outline-primary">
                        Retour à la liste des menus
                    </Link>
                </div>
            </main>
        )
    }

    // --- Etat : rupture de stock
    if (menu.quantite_restante <= 0) {
        return (
            <main className="page-commande">
                <div className="container py-5">
                    <h1 className="titre-serif commande-titre-page">Commander votre menu</h1>
                    <div className="alert alert-warning" role="alert">
                        <strong>Menu indisponible.</strong> Ce menu n'est plus en stock pour le moment.
                    </div>
                    <Link to="/menus" className="btn btn-outline-primary">
                        Voir les autres menus
                    </Link>
                </div>
            </main>
        )
    }

    // --- Etat : succes
    if (succes) {
        return (
            <main className="page-commande">
                <div className="container py-5">
                    <div className="commande-succes" role="status" aria-live="polite">
                        <div className="commande-succes-icone" aria-hidden="true">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="56"
                                height="56"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="m9 11 3 3L22 4" />
                            </svg>
                        </div>
                        <h1 className="titre-serif">Commande enregistrée !</h1>
                        <p className="commande-succes-numero">
                            Numéro : <strong>{succes.numero}</strong>
                        </p>
                        <p className="text-muted">
                            Nous vous avons envoyé un email de confirmation à{' '}
                            <strong>{utilisateur?.email}</strong>. Vous pouvez suivre votre
                            commande depuis votre espace personnel.
                        </p>

                        <div className="commande-succes-recap">
                            <div className="commande-succes-ligne">
                                <span>Sous-total menu</span>
                                <strong>{Number(succes.prixMenu).toFixed(2)} €</strong>
                            </div>
                            <div className="commande-succes-ligne">
                                <span>Livraison</span>
                                <strong>{Number(succes.prixLivraison).toFixed(2)} €</strong>
                            </div>
                            <div className="commande-succes-ligne commande-succes-total">
                                <span>Total TTC</span>
                                <strong>{Number(succes.prixTotal).toFixed(2)} €</strong>
                            </div>
                        </div>

                        <div className="commande-succes-actions">
                            <Link to="/" className="btn btn-outline-primary">
                                Retour à l'accueil
                            </Link>
                            <Link to="/menus" className="btn btn-primary">
                                Voir d'autres menus
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    // --- Etat : formulaire (cas nominal)
    const imageMenu = menu.image_principale?.url

    return (
        <main className="page-commande">
            <div className="container">
                <h1 className="titre-serif commande-titre-page">Commander votre menu</h1>

                <form onSubmit={soumettre} noValidate>
                    <div className="row g-4">
                        {/* ============================================
                            COLONNE GAUCHE : FORMULAIRE
                            ============================================ */}
                        <div className="col-lg-8">
                            {/* Erreur globale */}
                            {erreurEnvoi && (
                                <div className="alert alert-danger" role="alert">
                                    {erreurEnvoi}
                                </div>
                            )}

                            {/* ===== CARTE : RECAP MENU ===== */}
                            <section className="commande-carte" aria-labelledby="titre-recap-menu">
                                <h2 id="titre-recap-menu" className="titre-serif commande-carte-titre">
                                    Récapitulatif du menu
                                </h2>
                                <div className="commande-recap-menu">
                                    {imageMenu && (
                                        <img
                                            src={imageMenu}
                                            alt={menu.image_principale?.legende || menu.titre}
                                            className="commande-recap-image"
                                        />
                                    )}
                                    <div className="commande-recap-infos">
                                        <h3 className="titre-serif commande-recap-titre">
                                            {menu.titre}
                                        </h3>
                                        <div className="commande-recap-meta">
                                            <span className="commande-badge-min">
                                                Min. {menu.nombre_personnes_minimum} personnes
                                            </span>
                                            <span className="commande-recap-prix">
                                                {Math.round(Number(menu.prix_par_personne))}€ par personne
                                            </span>
                                        </div>
                                        <Link
                                            to={`/menu/${menu.menu_id}`}
                                            className="commande-recap-lien"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                            </svg>
                                            Modifier le menu
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            {/* ===== CARTE : VOS INFORMATIONS ===== */}
                            <section className="commande-carte" aria-labelledby="titre-vos-infos">
                                <div className="commande-carte-entete">
                                    <h2
                                        id="titre-vos-infos"
                                        className="titre-serif commande-carte-titre"
                                    >
                                        Vos informations
                                    </h2>
                                    <Link to="/profil" className="commande-recap-lien">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                        </svg>
                                        Modifier mes informations
                                    </Link>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="nom" className="form-label fw-medium">
                                            Nom <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="nom"
                                            type="text"
                                            className="form-control"
                                            value={utilisateur?.nom || ''}
                                            readOnly
                                            aria-readonly="true"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="prenom" className="form-label fw-medium">
                                            Prénom <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="prenom"
                                            type="text"
                                            className="form-control"
                                            value={utilisateur?.prenom || ''}
                                            readOnly
                                            aria-readonly="true"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="form-label fw-medium">
                                            Email <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-control"
                                            value={utilisateur?.email || ''}
                                            readOnly
                                            aria-readonly="true"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="telephone" className="form-label fw-medium">
                                            Téléphone <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="telephone"
                                            type="tel"
                                            className="form-control"
                                            value={utilisateur?.telephone || ''}
                                            readOnly
                                            aria-readonly="true"
                                            placeholder="Non renseigné — modifiez votre profil"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ===== ENCADRE CONDITIONS IMPORTANTES =====
                                Exigence enonce p.6 : "mis bien en evidence" */}
                            <section
                                className="commande-conditions"
                                role="note"
                                aria-labelledby="titre-conditions"
                            >
                                <div className="commande-conditions-icone" aria-hidden="true">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                    </svg>
                                </div>
                                <div className="commande-conditions-corps">
                                    <h3 id="titre-conditions" className="commande-conditions-titre">
                                        Conditions importantes
                                    </h3>
                                    {menu.conditions ? (
                                        <p className="commande-conditions-texte">{menu.conditions}</p>
                                    ) : (
                                        <ul className="commande-conditions-liste">
                                            <li>
                                                Commande à passer au minimum 7 jours avant la prestation
                                            </li>
                                            <li>
                                                Prêt de matériel disponible (assiettes, couverts, verres)
                                            </li>
                                            <li>
                                                Matériel à restituer dans les 10 jours suivant la prestation
                                            </li>
                                            <li>
                                                Frais de 600€ en cas de non-restitution du matériel emprunté
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            </section>

                            {/* ===== CARTE : INFORMATIONS DE PRESTATION ===== */}
                            <section
                                className="commande-carte"
                                aria-labelledby="titre-prestation"
                            >
                                <h2
                                    id="titre-prestation"
                                    className="titre-serif commande-carte-titre"
                                >
                                    Informations de prestation
                                </h2>
                                <p className="commande-section-sur-titre">QUAND ET OÙ ?</p>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label
                                            htmlFor="date-prestation"
                                            className="form-label fw-medium"
                                        >
                                            Date de prestation{' '}
                                            <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="date-prestation"
                                            type="date"
                                            className={`form-control ${
                                                datePrestation && datePrestation < dateMinimum
                                                    ? 'is-invalid'
                                                    : ''
                                            }`}
                                            value={datePrestation}
                                            min={dateMinimum}
                                            onChange={(e) => {
                                                // Le navigateur peut accepter une date < min si l'utilisateur
                                                // tape au clavier. On accepte la saisie pour ne pas la perdre,
                                                // mais on l'affichera comme invalide (is-invalid + message).
                                                setDatePrestation(e.target.value)
                                            }}
                                            required
                                            aria-required="true"
                                            aria-invalid={
                                                !!datePrestation && datePrestation < dateMinimum
                                            }
                                            aria-describedby="aide-date"
                                        />
                                        {datePrestation && datePrestation < dateMinimum ? (
                                            <div className="invalid-feedback d-block" role="alert">
                                                La date doit être au minimum le{' '}
                                                {new Date(dateMinimum).toLocaleDateString('fr-FR')}.
                                            </div>
                                        ) : (
                                            <div id="aide-date" className="form-text">
                                                Au plus tôt :{' '}
                                                {new Date(dateMinimum).toLocaleDateString('fr-FR')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label
                                            htmlFor="heure-livraison"
                                            className="form-label fw-medium"
                                        >
                                            Heure de livraison{' '}
                                            <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="heure-livraison"
                                            type="time"
                                            className="form-control"
                                            value={heureLivraison}
                                            onChange={(e) => setHeureLivraison(e.target.value)}
                                            required
                                            aria-required="true"
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label
                                            htmlFor="adresse-livraison"
                                            className="form-label fw-medium"
                                        >
                                            Adresse de livraison{' '}
                                            <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="adresse-livraison"
                                            type="text"
                                            className="form-control"
                                            placeholder="15 Rue des Remparts"
                                            value={adresseLivraison}
                                            onChange={(e) => setAdresseLivraison(e.target.value)}
                                            required
                                            aria-required="true"
                                            autoComplete="street-address"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="ville" className="form-label fw-medium">
                                            Ville{' '}
                                            <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="ville"
                                            type="text"
                                            className="form-control"
                                            value={ville}
                                            onChange={(e) => setVille(e.target.value)}
                                            required
                                            aria-required="true"
                                            autoComplete="address-level2"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="pays" className="form-label fw-medium">
                                            Pays{' '}
                                            <span className="text-danger" aria-hidden="true">*</span>
                                        </label>
                                        <select
                                            id="pays"
                                            className="form-select"
                                            value={pays}
                                            onChange={(e) => setPays(e.target.value)}
                                            required
                                            aria-required="true"
                                        >
                                            <option value="France">France</option>
                                            <option value="Belgique">Belgique</option>
                                            <option value="Suisse">Suisse</option>
                                            <option value="Luxembourg">Luxembourg</option>
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label
                                            htmlFor="distance-km"
                                            className="form-label fw-medium"
                                        >
                                            Distance depuis Bordeaux
                                        </label>
                                        <div className="commande-distance-bloc">
                                            {geocodingEnCours ? (
                                                <div
                                                    className="commande-distance-affichage commande-distance-affichage--loading"
                                                    role="status"
                                                    aria-live="polite"
                                                >
                                                    <span
                                                        className="spinner-border spinner-border-sm"
                                                        aria-hidden="true"
                                                    ></span>
                                                    <span>Calcul de la distance en cours...</span>
                                                </div>
                                            ) : adresseValidee ? (
                                                <div
                                                    className="commande-distance-affichage commande-distance-affichage--ok"
                                                    role="status"
                                                    aria-live="polite"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                                        <circle cx="12" cy="10" r="3" />
                                                    </svg>
                                                    <span>
                                                        <strong>{distanceKm} km</strong> depuis le
                                                        traiteur
                                                        {distanceKm === 0 && ' (Bordeaux centre)'}
                                                    </span>
                                                </div>
                                            ) : geocodingErreur ? (
                                                <div
                                                    className="commande-distance-affichage commande-distance-affichage--warn"
                                                    role="alert"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                    <span>{geocodingErreur}</span>
                                                </div>
                                            ) : (
                                                <div className="commande-distance-affichage commande-distance-affichage--vide">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="16" x2="12" y2="12" />
                                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                                    </svg>
                                                    <span>
                                                        Renseignez l'adresse et la ville pour
                                                        calculer la distance
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-text">
                                            Calcul automatique via OpenStreetMap. Le serveur
                                            re-vérifie la distance lors de la validation.
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ===== CARTE : NOMBRE DE PERSONNES ===== */}
                            <section
                                className="commande-carte"
                                aria-labelledby="titre-personnes"
                            >
                                <h2
                                    id="titre-personnes"
                                    className="titre-serif commande-carte-titre"
                                >
                                    Nombre de personnes
                                </h2>
                                <p className="commande-section-sur-titre">
                                    COMBIEN SEREZ-VOUS ?
                                </p>

                                <div className="commande-stepper">
                                    <button
                                        type="button"
                                        className="commande-stepper-btn"
                                        onClick={diminuerPersonnes}
                                        aria-label="Diminuer le nombre de personnes"
                                        disabled={
                                            nombrePersonnes <= menu.nombre_personnes_minimum
                                        }
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M5 12h14" />
                                        </svg>
                                    </button>
                                    <input
                                        type="number"
                                        className="commande-stepper-input"
                                        value={nombrePersonnes}
                                        min={menu.nombre_personnes_minimum}
                                        onChange={(e) => changerPersonnesInput(e.target.value)}
                                        aria-label="Nombre de personnes"
                                    />
                                    <button
                                        type="button"
                                        className="commande-stepper-btn"
                                        onClick={augmenterPersonnes}
                                        aria-label="Augmenter le nombre de personnes"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M12 5v14" />
                                            <path d="M5 12h14" />
                                        </svg>
                                    </button>
                                    <span className="commande-stepper-label">personnes</span>
                                </div>

                                {/* Hint reduction */}
                                <div
                                    className={`commande-hint-reduction ${
                                        calculs.reductionAppliquee
                                            ? 'commande-hint-reduction--active'
                                            : ''
                                    }`}
                                    role="status"
                                    aria-live="polite"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                                        <path d="M9 18h6" />
                                        <path d="M10 22h4" />
                                    </svg>
                                    <span>
                                        -10% de réduction à partir de{' '}
                                        {menu.nombre_personnes_minimum + 5} personnes
                                    </span>
                                </div>
                            </section>

                            {/* ===== CARTE : PRET DE MATERIEL ===== */}
                            <section
                                className="commande-carte"
                                aria-labelledby="titre-materiel"
                            >
                                <h2
                                    id="titre-materiel"
                                    className="titre-serif commande-carte-titre"
                                >
                                    Prêt de matériel
                                </h2>
                                <div className="form-check commande-checkbox">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="pret-materiel"
                                        checked={pretMateriel}
                                        onChange={(e) => setPretMateriel(e.target.checked)}
                                    />
                                    <label
                                        htmlFor="pret-materiel"
                                        className="form-check-label"
                                    >
                                        Je souhaite emprunter de la vaisselle/couverts
                                    </label>
                                </div>
                                <p className="commande-checkbox-aide">
                                    Frais de 600€ en cas de non-restitution sous 10 jours
                                </p>
                            </section>

                            {/* ===== CARTE : NOTES (champ optionnel ajoute) ===== */}
                            <section
                                className="commande-carte"
                                aria-labelledby="titre-notes"
                            >
                                <h2
                                    id="titre-notes"
                                    className="titre-serif commande-carte-titre"
                                >
                                    Notes au traiteur
                                    <span className="commande-titre-optionnel">
                                        {' '}
                                        (optionnel)
                                    </span>
                                </h2>
                                <textarea
                                    id="notes"
                                    className="form-control"
                                    rows={3}
                                    maxLength={500}
                                    value={notesClient}
                                    onChange={(e) => setNotesClient(e.target.value)}
                                    placeholder="Allergies, restrictions alimentaires, demandes particulières..."
                                    aria-describedby="aide-notes"
                                />
                                <div id="aide-notes" className="form-text">
                                    {notesClient.length} / 500 caractères
                                </div>
                            </section>
                        </div>

                        {/* ============================================
                            COLONNE DROITE : RECAP COMMANDE (sticky)
                            ============================================ */}
                        <div className="col-lg-4">
                            <aside
                                className="commande-recap-sticky"
                                aria-label="Récapitulatif de la commande"
                            >
                                <h2 className="titre-serif commande-recap-titre-aside">
                                    Votre commande
                                </h2>

                                <div className="commande-recap-lignes">
                                    <div className="commande-recap-ligne">
                                        <span>Menu (×{nombrePersonnes} personnes)</span>
                                        <strong>{calculs.prixBase.toFixed(2)} €</strong>
                                    </div>

                                    {calculs.reductionAppliquee && (
                                        <div className="commande-recap-ligne commande-recap-ligne--reduction">
                                            <span>Réduction 10%</span>
                                            <strong>- {calculs.reduction.toFixed(2)} €</strong>
                                        </div>
                                    )}

                                    <div className="commande-recap-ligne">
                                        <span>Sous-total menu</span>
                                        <strong>{calculs.sousTotalMenu.toFixed(2)} €</strong>
                                    </div>

                                    <div className="commande-recap-ligne">
                                        <span>Livraison ({distanceKm} km)</span>
                                        <strong>{calculs.prixLivraison.toFixed(2)} €</strong>
                                    </div>
                                    <div className="commande-recap-detail-livraison">
                                        ({distanceKm} km × 0,59€ + 5€)
                                    </div>
                                </div>

                                <hr className="commande-recap-separateur" />

                                <div className="commande-recap-total">
                                    <span>TOTAL TTC</span>
                                    <strong className="commande-recap-total-prix titre-serif">
                                        {calculs.total.toFixed(2)} €
                                    </strong>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 commande-btn-valider"
                                    disabled={envoiEnCours || geocodingEnCours}
                                >
                                    {envoiEnCours ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Envoi...
                                        </>
                                    ) : (
                                        'Valider la commande'
                                    )}
                                </button>

                                <p className="commande-recap-mention">
                                    Vous recevrez un email de confirmation
                                </p>
                            </aside>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}
