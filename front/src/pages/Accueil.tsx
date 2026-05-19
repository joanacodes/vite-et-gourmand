// ============================================================
// PAGE ACCUEIL - Page d'entree du site
//
// Sections (selon enonce p.3) :
// 1. Hero avec animation photos defilantes + 2 CTA
// 2. Nos services (mariage / entreprise / famille)
// 3. Apercu menus (3 derniers depuis le back)
// 4. Carrousel avis clients (dynamique depuis /api/avis?statut=valide)
// 5. Notre histoire (Julie & Jose, 25 ans)
// 6. CTA final vers contact
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

export default function Accueil() {
    const [menus, setMenus] = useState<Menu[]>([])
    const [avis, setAvis] = useState<Avis[]>([])
    const [indexAvis, setIndexAvis] = useState(0)
    const [chargement, setChargement] = useState(true)

    // === CHARGEMENT INITIAL : menus + avis ===
    useEffect(() => {
        async function charger() {
            try {
                // En parallele : recuperer les menus et les avis
                const [donneesMenus, donneesAvis] = await Promise.all([
                    api.get<{ menus: Menu[] }>('/api/menus'),
                    api.get<{ avis: Avis[] }>('/api/avis?statut=valide').catch(() => ({ avis: [] })),
                ])

                // On prend les 3 derniers menus pour l'apercu
                setMenus(donneesMenus.menus.slice(0, 3))
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
            {/* SECTION 2 : NOS SERVICES                                      */}
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
                </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 3 : APERCU MENUS (dynamique depuis le back)            */}
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
                            {menus.map((m) => (
                                <CarteMenu key={m.menu_id} menu={m} />
                            ))}
                        </div>
                    )}
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
            {/* SECTION 6 : CTA FINAL                                          */}
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
