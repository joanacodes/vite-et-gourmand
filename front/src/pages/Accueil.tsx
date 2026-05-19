// ============================================================
// PAGE ACCUEIL - Page d'entree du site
//
// Sections (selon enonce p.3 + maquette UX Pilot) :
// 1. Hero avec animation photos defilantes + 2 CTA
// 2. Sous-services : Diners Prives + Cocktails (NOUVEAU)
// 3. Apercu menus (3 premiers depuis le back) - inchange
// 4. Nos services (mariage / entreprise / famille)
// 5. Carrousel avis clients
// 6. Notre histoire (Julie & Jose, 25 ans)
// 7. Nos menus detailles (3 menus avec leurs plats) (NOUVEAU)
// 8. FAQ - Questions frequentes (NOUVEAU)
// 9. Mini bloc Contact (NOUVEAU)
// 10. Bloc "Julie & Jose" presentation (NOUVEAU)
// 11. CTA final
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Menu, Avis } from '../types'
import CarteMenu from '../components/menus/CarteMenu'
import './Accueil.css'

// Photos pour le hero (defilantes) - cuisine et plats raffines
const photosHero = [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
]

// Photos pour la section "menus detailles" (dynamiques - 3 vues larges)
const photosMenusDetailles = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
]

// Photos Julie & Jose (chef pâtissière + chef cuisinier - Unsplash libre de droits)
const photoJulie = 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&q=80'
const photoJose = 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80'

// Questions FAQ (en dur - ce sont des infos generiques de l'entreprise)
const questionsFaq = [
    {
        question: "Quel est le délai de commande pour un événement ?",
        reponse: "Nous recommandons de nous contacter au moins 2 semaines avant votre événement pour les petites réceptions (10-20 personnes). Pour les grands événements (plus de 25 personnes), prévoyez idéalement 4 à 6 semaines. Cependant, n'hésitez pas à nous contacter même pour des délais plus courts : nous ferons notre maximum pour répondre à votre demande."
    },
    {
        question: "Livrez-vous en dehors de Bordeaux ?",
        reponse: "Oui, nous livrons dans toute la métropole bordelaise et ses environs dans un rayon de 30 km autour de Bordeaux. Une facturation de livraison est appliquée (5€ forfaitaires + 0,59€/km parcouru hors Bordeaux). Pour les événements plus éloignés, contactez-nous pour étudier la faisabilité."
    },
    {
        question: "Peut-on personnaliser les menus proposés ?",
        reponse: "Absolument ! Nos menus sont des suggestions qui nous permettent de présenter notre savoir-faire. Nous nous adaptons à vos préférences, allergies, régimes spéciaux et votre budget. Julie et José vous accueillent volontiers pour un échange afin de créer ensemble le menu idéal de votre événement."
    },
    {
        question: "Proposez-vous des dégustations avant l'événement ?",
        reponse: "Oui, pour les événements importants (mariages, grands événements d'entreprise), nous proposons des séances de dégustation sur rendez-vous dans notre atelier bordelais. Cela vous permet de découvrir nos créations, d'affiner votre choix et de vous projeter sereinement dans votre événement."
    },
    {
        question: "Quels sont les modes de paiement acceptés ?",
        reponse: "Nous acceptons les paiements par virement bancaire, chèque et espèces. Un acompte de 30% est demandé à la validation de la commande pour confirmer votre réservation. Le solde est dû le jour de la prestation. Pour les entreprises, nous proposons également le paiement à 30 jours sur facture."
    },
    {
        question: "Fournissez-vous le matériel (vaisselle, nappes, etc.) ?",
        reponse: "Nous proposons en location vaisselle, verrerie, nappes, couverts et matériel de buffet de qualité. La location est précisée dans le devis. Attention : tout matériel non restitué dans les 10 jours ouvrés après l'événement fait l'objet d'une facturation de 600€ (mentionné dans nos CGV)."
    },
]

export default function Accueil() {
    const [menus, setMenus] = useState<Menu[]>([])
    const [avis, setAvis] = useState<Avis[]>([])
    const [indexAvis, setIndexAvis] = useState(0)
    const [chargement, setChargement] = useState(true)
    const [faqOuverte, setFaqOuverte] = useState<number | null>(0) // Premiere question ouverte par defaut

    // === CHARGEMENT INITIAL : menus + avis ===
    useEffect(() => {
        async function charger() {
            try {
                // En parallele : recuperer les menus et les avis
                const [donneesMenus, donneesAvis] = await Promise.all([
                    api.get<{ menus: Menu[] }>('/api/menus'),
                    api.get<{ avis: Avis[] }>('/api/avis?statut=valide').catch(() => ({ avis: [] })),
                ])

                // On garde tous les menus (on en utilisera 3 pour l'apercu et 3 pour la section detaillee)
                setMenus(donneesMenus.menus)
                setAvis(donneesAvis.avis)
            } catch (err) {
                console.error('Erreur chargement accueil:', err)
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    // === ROTATION AUTOMATIQUE DES AVIS toutes les 5 sec ===
    useEffect(() => {
        if (avis.length <= 1) return
        const intervalle = setInterval(() => {
            setIndexAvis((idx) => (idx + 1) % avis.length)
        }, 5000)
        return () => clearInterval(intervalle)
    }, [avis.length])

    function avisPrecedent() {
        setIndexAvis((idx) => (idx - 1 + avis.length) % avis.length)
    }

    function avisSuivant() {
        setIndexAvis((idx) => (idx + 1) % avis.length)
    }

    // === HELPER : afficher les etoiles ===
    function afficherEtoiles(note: number) {
        return Array.from({ length: 5 }, (_, i) => (
            <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={i < note ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ))
    }

    // === HELPER : grouper les plats par type (entree/plat/dessert) ===
    function platsParType(menu: Menu) {
        const plats = menu.plats || []
        return {
            entrees: plats.filter(p => p.type === 'entree'),
            plats: plats.filter(p => p.type === 'plat'),
            desserts: plats.filter(p => p.type === 'dessert'),
        }
    }

    // === HELPER : toggle FAQ ===
    function toggleFaq(index: number) {
        setFaqOuverte(faqOuverte === index ? null : index)
    }

    // 3 menus pour l'apercu (en haut)
    const menusApercu = menus.slice(0, 3)
    // 3 menus pour la section detaillee (en bas, avec plats)
    const menusDetailles = menus.slice(0, 3)

    // === RENDU ===

    return (
        <main className="accueil">
            {/* ============================================================ */}
            {/* SECTION 1 : HERO avec animation photos defilantes              */}
            {/* ============================================================ */}
            <section className="accueil-hero">
                {/* Photos defilantes en arriere-plan */}
                <div className="accueil-hero-photos">
                    <div className="accueil-hero-photos-piste">
                        {/* On duplique les photos pour un defilement infini */}
                        {[...photosHero, ...photosHero].map((url, idx) => (
                            <img key={idx} src={url} alt="" aria-hidden="true" />
                        ))}
                    </div>
                </div>

                {/* Overlay degrade pour lisibilite */}
                <div className="accueil-hero-overlay" aria-hidden="true"></div>

                {/* Contenu */}
                <div className="container accueil-hero-contenu">
                    <span className="accueil-hero-supratitre">Depuis 1999 à Bordeaux</span>
                    <h1 className="accueil-hero-titre">
                        Une cuisine d'exception, livrée chez vous
                    </h1>
                    <p className="accueil-hero-soustitre">
                        Julie et José vous proposent un savoir-faire artisanal pour vos
                        événements les plus précieux.
                    </p>
                    <div className="accueil-hero-ctas">
                        <Link to="/menus" className="btn btn-light accueil-bouton-primaire">
                            Découvrir nos menus
                        </Link>
                        <Link to="/contact" className="btn btn-outline-light accueil-bouton-secondaire">
                            Nous contacter
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 2 : APERCU MENUS (dynamique depuis le back)            */}
            {/* ============================================================ */}
            <section className="accueil-menus">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-end flex-wrap mb-4">
                        <div>
                            <span className="accueil-section-supratitre">Nos Menus</span>
                            <h2 className="accueil-section-titre">Découvrez nos menus</h2>
                        </div>
                        <Link to="/menus" className="accueil-menus-lien-tous">
                            Voir tous nos menus →
                        </Link>
                    </div>

                    {chargement ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="accueil-menus-grille">
                            {menusApercu.map((m) => (
                                <CarteMenu key={m.menu_id} menu={m} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 3 : NOS SERVICES                                       */}
            {/* ============================================================ */}
            <section className="accueil-services">
                <div className="container">
                    <div className="text-center mb-5">
                        <span className="accueil-section-supratitre">Nos Services</span>
                        <h2 className="accueil-section-titre">Pour toutes vos occasions</h2>
                        <p className="accueil-section-soustitre">
                            De l'intimité d'un dîner en famille à l'éclat d'un mariage,
                            notre service traiteur s'adapte à chaque moment précieux de votre vie.
                        </p>
                    </div>

                    <div className="accueil-services-grille">
                        {/* Card 1 : Mariages */}
                        <div className="accueil-service-card">
                            <div className="accueil-service-icone" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
                                </svg>
                            </div>
                            <h3 className="accueil-service-titre">Mariages & Célébrations</h3>
                            <p className="accueil-service-texte">
                                Créez des souvenirs inoubliables avec nos menus raffinés.
                                Du vin d'honneur au repas de gala, nous orchestrons chaque
                                détail pour que votre journée soit parfaite.
                            </p>
                        </div>

                        {/* Card 2 : Entreprise */}
                        <div className="accueil-service-card">
                            <div className="accueil-service-icone" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="14" x="2" y="7" rx="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </div>
                            <h3 className="accueil-service-titre">Événements d'Entreprise</h3>
                            <p className="accueil-service-texte">
                                Séminaires, cocktails, déjeuners d'affaires : impressionnez
                                vos clients et collaborateurs avec une prestation
                                professionnelle et des saveurs d'exception.
                            </p>
                        </div>

                        {/* Card 3 : Famille */}
                        <div className="accueil-service-card">
                            <div className="accueil-service-icone" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3 className="accueil-service-titre">Réceptions Familiales</h3>
                            <p className="accueil-service-texte">
                                Anniversaires, baptêmes, retrouvailles : profitez pleinement
                                de vos proches pendant que nous prenons soin de régaler
                                vos invités avec générosité.
                            </p>
                        </div>
                    </div>

                    {/* ===== SOUS-SECTION : Diners Prives + Cocktails ===== */}
                    <div className="accueil-sous-services">
                        <div className="accueil-sous-service-card">
                            <div className="accueil-sous-service-icone" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 11h18v9H3z" />
                                    <path d="M12 11V2" />
                                    <path d="M8 2h8" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="accueil-sous-service-titre">Dîners Privés & Brunchs</h4>
                                <p className="accueil-sous-service-texte">
                                    Recevez en toute intimité ! Nos menus dîners et brunchs gourmets,
                                    livrés à domicile et présentés avec élégance, transforment vos
                                    soirées en moments d'exception.
                                </p>
                            </div>
                        </div>

                        <div className="accueil-sous-service-card">
                            <div className="accueil-sous-service-icone" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 22h8" />
                                    <path d="M12 11v11" />
                                    <path d="m19 3-7 8-7-8Z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="accueil-sous-service-titre">Cocktails & Apéritifs</h4>
                                <p className="accueil-sous-service-texte">
                                    Inaugurations, vernissages, soirées networking : nos bouchées
                                    raffinées et nos cocktails créatifs font de chaque mise en
                                    bouche un moment de partage savoureux.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bouton CTA en bas de section */}
                    <div className="text-center mt-5">
                        <Link to="/menus" className="btn btn-primary btn-lg">
                            Découvrir nos menus
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 4 : AVIS CLIENTS (carrousel dynamique)                 */}
            {/* ============================================================ */}
            {avis.length > 0 && (
                <section className="accueil-avis">
                    <div className="container">
                        <div className="text-center mb-5">
                            <span className="accueil-section-supratitre">Témoignages</span>
                            <h2 className="accueil-section-titre">Ils nous ont fait confiance</h2>
                        </div>

                        <div className="accueil-avis-carrousel">
                            {/* Fleche precedente */}
                            {avis.length > 1 && (
                                <button
                                    type="button"
                                    className="accueil-avis-fleche accueil-avis-fleche-gauche"
                                    onClick={avisPrecedent}
                                    aria-label="Avis précédent"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </button>
                            )}

                            {/* Carte d'avis */}
                            <div className="accueil-avis-carte">
                                <div className="accueil-avis-etoiles">
                                    {afficherEtoiles(avis[indexAvis].note)}
                                </div>
                                <p className="accueil-avis-texte">
                                    "{avis[indexAvis].description}"
                                </p>
                                <div className="accueil-avis-auteur">
                                    <p className="accueil-avis-nom">
                                        {avis[indexAvis].auteur_prenom}
                                        {avis[indexAvis].auteur_nom && ` ${avis[indexAvis].auteur_nom.charAt(0)}.`}
                                    </p>
                                    {avis[indexAvis].menu_titre && (
                                        <p className="accueil-avis-meta">
                                            {avis[indexAvis].menu_titre}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Fleche suivante */}
                            {avis.length > 1 && (
                                <button
                                    type="button"
                                    className="accueil-avis-fleche accueil-avis-fleche-droite"
                                    onClick={avisSuivant}
                                    aria-label="Avis suivant"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Puces indicateurs */}
                        {avis.length > 1 && (
                            <div className="accueil-avis-puces">
                                {avis.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`accueil-avis-puce ${idx === indexAvis ? 'active' : ''}`}
                                        onClick={() => setIndexAvis(idx)}
                                        aria-label={`Aller à l'avis ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ============================================================ */}
            {/* SECTION 5 : NOTRE HISTOIRE (avec hero anime)                   */}
            {/* ============================================================ */}
            <section className="accueil-histoire">
                <div className="accueil-histoire-photos">
                    <div className="accueil-hero-photos-piste">
                        {[...photosHero, ...photosHero].map((url, idx) => (
                            <img key={idx} src={url} alt="" aria-hidden="true" />
                        ))}
                    </div>
                </div>

                <div className="accueil-hero-overlay" aria-hidden="true"></div>

                <div className="container accueil-histoire-contenu">
                    <span className="accueil-hero-supratitre">Notre histoire</span>
                    <h2 className="accueil-hero-titre accueil-histoire-titre">
                        25 ans d'excellence gastronomique
                    </h2>
                    <p className="accueil-hero-soustitre">
                        Depuis 1999, Julie et José perpétuent un savoir-faire artisanal au
                        cœur de Bordeaux. Leur passion pour les produits du terroir et leur
                        créativité culinaire ont fait de Vite & Gourmand une référence
                        incontournable du traiteur haut de gamme.
                    </p>
                    <p className="accueil-hero-soustitre">
                        Chaque événement est une nouvelle aventure, une occasion de créer
                        des souvenirs inoubliables autour de la table. Notre engagement :
                        des produits frais, locaux et de saison, travaillés avec respect
                        et générosité.
                    </p>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 6 : NOS MENUS DETAILLES (3 menus avec composition)    */}
            {/* ============================================================ */}
            {menusDetailles.length > 0 && (
                <section className="accueil-menus-detailles">
                    <div className="container">
                        <div className="text-center mb-5">
                            <h2 className="accueil-section-titre">Nos menus détaillés</h2>
                            <p className="accueil-section-soustitre">
                                Découvrez la composition complète de chacun de nos menus,
                                élaborés avec soin par Julie et José.
                            </p>
                        </div>

                        <div className="accueil-menus-detailles-grille">
                            {menusDetailles.map((menu, idx) => {
                                const { entrees, plats, desserts } = platsParType(menu)
                                const photoMenu = menu.image_principale?.url || photosMenusDetailles[idx]

                                return (
                                    <article key={menu.menu_id} className="accueil-menu-detaille">
                                        <div className="accueil-menu-detaille-image">
                                            <img
                                                src={photoMenu}
                                                alt={`Photo du menu ${menu.titre}`}
                                                loading="lazy"
                                            />
                                            <div className="accueil-menu-detaille-prix">
                                                {Number(menu.prix_par_personne).toFixed(0)}€<span>/pers.</span>
                                            </div>
                                        </div>

                                        <div className="accueil-menu-detaille-contenu">
                                            <div className="accueil-menu-detaille-entete">
                                                <h3 className="accueil-menu-detaille-titre">
                                                    {menu.titre}
                                                </h3>
                                                <span className="accueil-menu-detaille-badge">
                                                    Min. {menu.nombre_personnes_minimum} pers.
                                                </span>
                                            </div>

                                            <p className="accueil-menu-detaille-description">
                                                {menu.description}
                                            </p>

                                            {/* Liste des plats par categorie */}
                                            <div className="accueil-menu-detaille-composition">
                                                {entrees.length > 0 && (
                                                    <div className="accueil-menu-detaille-categorie">
                                                        <h4 className="accueil-menu-detaille-cat-titre">Entrée</h4>
                                                        <ul>
                                                            {entrees.map(p => (
                                                                <li key={p.plat_id}>{p.titre}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {plats.length > 0 && (
                                                    <div className="accueil-menu-detaille-categorie">
                                                        <h4 className="accueil-menu-detaille-cat-titre">Plat</h4>
                                                        <ul>
                                                            {plats.map(p => (
                                                                <li key={p.plat_id}>{p.titre}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {desserts.length > 0 && (
                                                    <div className="accueil-menu-detaille-categorie">
                                                        <h4 className="accueil-menu-detaille-cat-titre">Dessert</h4>
                                                        <ul>
                                                            {desserts.map(p => (
                                                                <li key={p.plat_id}>{p.titre}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <Link
                                                to={`/menu/${menu.menu_id}`}
                                                className="btn btn-outline-primary w-100 mt-3"
                                            >
                                                Voir le détail
                                            </Link>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>

                        <div className="text-center mt-5">
                            <Link to="/menus" className="btn btn-primary btn-lg">
                                Voir tous les menus
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================================ */}
            {/* SECTION 7 : FAQ - Questions frequentes                         */}
            {/* ============================================================ */}
            <section className="accueil-faq">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="accueil-faq-titre">Questions fréquentes</h2>
                        <p className="accueil-faq-soustitre">
                            Retrouvez les réponses aux questions les plus courantes sur nos services de traiteur.
                        </p>
                    </div>

                    <div className="accueil-faq-liste">
                        {questionsFaq.map((item, idx) => {
                            const estOuverte = faqOuverte === idx
                            return (
                                <div
                                    key={idx}
                                    className={`accueil-faq-item ${estOuverte ? 'ouverte' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="accueil-faq-question"
                                        onClick={() => toggleFaq(idx)}
                                        aria-expanded={estOuverte}
                                        aria-controls={`faq-reponse-${idx}`}
                                    >
                                        <span>{item.question}</span>
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
                                            className={`accueil-faq-chevron ${estOuverte ? 'ouvert' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>
                                    <div
                                        id={`faq-reponse-${idx}`}
                                        className="accueil-faq-reponse"
                                        role="region"
                                        hidden={!estOuverte}
                                    >
                                        <p>{item.reponse}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 8 : MINI BLOC CONTACT                                  */}
            {/* ============================================================ */}
            <section className="accueil-contact-mini">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="accueil-section-titre">Contactez-nous</h2>
                        <p className="accueil-section-soustitre">
                            Une question ? Un projet d'événement ? Julie et José sont à votre
                            écoute pour créer ensemble le menu parfait.
                        </p>
                    </div>

                    <div className="accueil-contact-mini-grille">
                        {/* Coordonnees */}
                        <div className="accueil-contact-mini-carte">
                            <h3 className="accueil-contact-mini-titre">Nos coordonnées</h3>
                            <ul className="accueil-contact-mini-liste">
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <div>
                                        <strong>Téléphone</strong>
                                        <span>05 56 00 00 00</span>
                                        <small>Lun-Sam, 9h-19h - Dim 10h-18h</small>
                                    </div>
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    <div>
                                        <strong>Email</strong>
                                        <span>contact@vite-et-gourmand.fr</span>
                                    </div>
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <div>
                                        <strong>Adresse</strong>
                                        <span>12 Rue des Gourmets</span>
                                        <small>33000 Bordeaux, France</small>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Besoin d'aide */}
                        <div className="accueil-contact-mini-carte accueil-contact-mini-aide">
                            <h3 className="accueil-contact-mini-titre">Besoin d'aide ?</h3>
                            <p>
                                Notre équipe est disponible pour répondre à toutes vos questions
                                et vous accompagner dans l'organisation de votre événement parfait.
                            </p>
                            <ul className="accueil-contact-mini-bullets">
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Devis gratuit & personnalisé
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Conseils sur le choix des menus
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Dégustations possibles sur rendez-vous
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Livraison dans tout Bordeaux
                                </li>
                            </ul>
                            <Link to="/contact" className="btn btn-primary w-100 mt-3">
                                Nous contacter
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 9 : JULIE & JOSE - Presentation des chefs              */}
            {/* ============================================================ */}
            <section className="accueil-chefs">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="accueil-section-titre">Julie & José, 25 ans de passion</h2>
                    </div>

                    <div className="accueil-chefs-grille">
                        {/* Julie - Chef Patissiere */}
                        <article className="accueil-chef-card">
                            <div className="accueil-chef-photo">
                                <img
                                    src={photoJulie}
                                    alt="Portrait de Julie, chef pâtissière de Vite & Gourmand"
                                    loading="lazy"
                                />
                            </div>
                            <div className="accueil-chef-info">
                                <h3 className="accueil-chef-nom">Julie</h3>
                                <p className="accueil-chef-role">Chef Pâtissière</p>
                                <p className="accueil-chef-bio">
                                    Créatrice de douceurs depuis l'enfance, Julie sublime chaque
                                    fin de repas avec une touche d'élégance.
                                </p>
                            </div>
                        </article>

                        {/* Jose - Chef Cuisinier */}
                        <article className="accueil-chef-card">
                            <div className="accueil-chef-photo">
                                <img
                                    src={photoJose}
                                    alt="Portrait de José, chef cuisinier de Vite & Gourmand"
                                    loading="lazy"
                                />
                            </div>
                            <div className="accueil-chef-info">
                                <h3 className="accueil-chef-nom">José</h3>
                                <p className="accueil-chef-role">Chef Cuisinier</p>
                                <p className="accueil-chef-bio">
                                    Passionné par les produits du terroir, José cuisine des
                                    plats généreux qui célèbrent le meilleur de la cuisine française.
                                </p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 10 : CTA FINAL                                         */}
            {/* ============================================================ */}
            <section className="accueil-cta-final">
                <div className="container text-center py-5">
                    <h2 className="accueil-cta-titre">Prêt à régaler vos invités ?</h2>
                    <p className="accueil-cta-texte">
                        Contactez-nous pour discuter de votre événement et créer
                        ensemble un menu sur-mesure.
                    </p>
                    <Link to="/contact" className="btn btn-light btn-lg accueil-bouton-primaire">
                        Nous contacter
                    </Link>
                </div>
            </section>
        </main>
    )
}
