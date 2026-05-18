// ============================================================
// PAGE DETAIL MENU - /menu/:id
//
// Affiche toutes les infos d'un menu (enonce p.5-6) :
// - Galerie d'images avec selection
// - Sticky panel avec titre, theme, note, description, conditions,
//   prix, stock et bouton "Commander"
// - Composition du menu (plats par type avec allergenes)
// - Avis valides (si presents)
// - Menus similaires (meme theme)
// - CTA banner en bas
//
// Comportement bouton "Commander" :
// - Si connecte -> /commande/:id
// - Sinon -> /connexion (avec retour vers la commande apres login)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import type { Menu } from '../types'
import { useAuth } from '../contexts/AuthContext'
import CarteMenu from '../components/menus/CarteMenu'
import './DetailMenu.css'

export default function DetailMenu() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { utilisateur } = useAuth()

    const [menu, setMenu] = useState<Menu | null>(null)
    const [menusSimilaires, setMenusSimilaires] = useState<Menu[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState('')
    const [imageActiveIdx, setImageActiveIdx] = useState(0)

    // === CHARGEMENT INITIAL ===
    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                setErreur('')

                // 1. Recuperer le menu detaille
                const data = await api.get<{ menu: Menu }>(`/api/menus/${id}`)
                setMenu(data.menu)
                setImageActiveIdx(0)

                // 2. Recuperer la liste des menus pour suggerer des similaires
                const listeData = await api.get<{ menus: Menu[] }>('/api/menus')
                // On filtre : meme theme, mais pas le menu actuel, et max 3 resultats
                const similaires = listeData.menus
                    .filter(
                        (m) =>
                            m.menu_id !== data.menu.menu_id &&
                            m.theme === data.menu.theme
                    )
                    .slice(0, 3)

                // Si moins de 3 du meme theme, on complete avec d'autres menus
                if (similaires.length < 3) {
                    const autres = listeData.menus
                        .filter(
                            (m) =>
                                m.menu_id !== data.menu.menu_id &&
                                m.theme !== data.menu.theme
                        )
                        .slice(0, 3 - similaires.length)
                    similaires.push(...autres)
                }

                setMenusSimilaires(similaires)
            } catch (err: any) {
                if (err.statut === 404) {
                    setErreur('Ce menu n\'existe pas ou a été supprimé.')
                } else {
                    setErreur(err.message || 'Erreur lors du chargement du menu.')
                }
            } finally {
                setChargement(false)
            }
        }
        if (id) charger()
    }, [id])

    // Trie les images par ordre_affichage et place la principale en premier
    const imagesTriees = useMemo(() => {
        if (!menu?.images) return []
        return [...menu.images].sort((a, b) => {
            // L'image principale d'abord
            if (a.est_principale && !b.est_principale) return -1
            if (!a.est_principale && b.est_principale) return 1
            // Puis par ordre_affichage
            return (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)
        })
    }, [menu])

    // Plats groupes par type
    const platsParType = useMemo(() => {
        if (!menu?.plats) return { entree: [], plat: [], dessert: [] }
        return {
            entree: menu.plats.filter((p) => p.type === 'entree'),
            plat: menu.plats.filter((p) => p.type === 'plat'),
            dessert: menu.plats.filter((p) => p.type === 'dessert'),
        }
    }, [menu])

    // Gestion du clic sur "Commander"
    function gererCommander() {
        if (utilisateur) {
            // Connecte -> directement vers la page de commande
            navigate(`/commande/${id}`)
        } else {
            // Pas connecte -> on redirige vers la connexion en memorisant
            // l'URL de destination pour revenir apres login
            navigate('/connexion', {
                state: { retourApres: `/commande/${id}` },
            })
        }
    }

    // === RENDU ===

    if (chargement) {
        return (
            <main className="detail-menu-page">
                <div className="container py-5 text-center">
                    <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                        <span className="visually-hidden">Chargement du menu...</span>
                    </div>
                </div>
            </main>
        )
    }

    if (erreur || !menu) {
        return (
            <main className="detail-menu-page">
                <div className="container py-5 text-center">
                    <h1 className="titre-serif">Oups...</h1>
                    <p className="text-muted">{erreur || 'Menu introuvable.'}</p>
                    <Link to="/menus" className="btn btn-primary mt-3">
                        Retour aux menus
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="detail-menu-page">
            <div className="container py-5">
                {/* === BREADCRUMB === */}
                <nav aria-label="Fil d'Ariane" className="detail-menu-breadcrumb">
                    <Link to="/">Accueil</Link>
                    <span aria-hidden="true">{'>'}</span>
                    <Link to="/menus">Nos menus</Link>
                    <span aria-hidden="true">{'>'}</span>
                    <span aria-current="page">{menu.titre}</span>
                </nav>

                {/* === HERO : Galerie + Sticky panel === */}
                <div className="detail-menu-hero">
                    {/* Galerie */}
                    <div className="detail-menu-galerie">
                        <div className="detail-menu-image-principale">
                            {imagesTriees.length > 0 ? (
                                <img
                                    src={imagesTriees[imageActiveIdx].url}
                                    alt={imagesTriees[imageActiveIdx].legende || menu.titre}
                                />
                            ) : (
                                <div className="detail-menu-image-placeholder">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M3 11h18l-2 9H5l-2-9Z" />
                                        <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Miniatures */}
                        {imagesTriees.length > 1 && (
                            <div className="detail-menu-miniatures">
                                {imagesTriees.map((img, idx) => (
                                    <button
                                        key={img.image_id}
                                        type="button"
                                        className={`detail-menu-miniature ${idx === imageActiveIdx ? 'active' : ''}`}
                                        onClick={() => setImageActiveIdx(idx)}
                                        aria-label={`Voir l'image ${idx + 1} : ${img.legende || ''}`}
                                    >
                                        <img src={img.url} alt={img.legende || ''} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sticky order panel */}
                    <aside className="detail-menu-sticky">
                        <div className="detail-menu-carte-commande">
                            <h1 className="detail-menu-titre">{menu.titre}</h1>

                            {/* Badges theme + regime */}
                            <div className="detail-menu-badges">
                                {menu.theme && (
                                    <span className="detail-menu-badge-theme">
                                        {menu.theme}
                                    </span>
                                )}
                                {menu.regimes && menu.regimes.map((r) => (
                                    <span key={r.regime_id} className="detail-menu-badge-regime">
                                        {r.libelle}
                                    </span>
                                ))}
                            </div>

                            {/* Description */}
                            <p className="detail-menu-description">{menu.description}</p>

                            {/* Conditions importantes (encadre orange) */}
                            {menu.conditions && (
                                <div className="detail-menu-conditions" role="note">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                    <div>
                                        <strong>Conditions importantes</strong>
                                        <p>{menu.conditions}</p>
                                    </div>
                                </div>
                            )}

                            {/* Prix + stock */}
                            <div className="detail-menu-prix-bloc">
                                <span className="detail-menu-prix-label">À partir de</span>
                                <div className="detail-menu-prix-ligne">
                                    <span className="detail-menu-prix-valeur">
                                        {Math.round(Number(menu.prix_par_personne))} €
                                    </span>
                                    <span className="detail-menu-prix-unite">/ personne</span>
                                </div>
                                <div className="detail-menu-info-ligne">
                                    <span className="detail-menu-tag">
                                        Min. {menu.nombre_personnes_minimum} personnes
                                    </span>
                                </div>
                                {menu.quantite_restante > 0 ? (
                                    <div className="detail-menu-stock">
                                        <span className="detail-menu-stock-pastille"></span>
                                        En stock — {menu.quantite_restante} disponible{menu.quantite_restante > 1 ? 's' : ''}
                                    </div>
                                ) : (
                                    <div className="detail-menu-stock detail-menu-stock-rupture">
                                        <span className="detail-menu-stock-pastille"></span>
                                        Rupture de stock
                                    </div>
                                )}
                            </div>

                            {/* Bouton commander */}
                            <button
                                type="button"
                                onClick={gererCommander}
                                className="btn btn-primary w-100 detail-menu-bouton-commander"
                                disabled={menu.quantite_restante === 0}
                            >
                                Commander ce menu
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ms-2">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </button>

                            {!utilisateur && (
                                <p className="detail-menu-mention-connexion">
                                    Connexion requise pour commander
                                </p>
                            )}
                        </div>
                    </aside>
                </div>

                {/* === COMPOSITION DU MENU === */}
                <section className="detail-menu-composition">
                    <div className="text-center mb-5">
                        <h2 className="titre-serif detail-menu-section-titre">
                            Découvrez les plats de ce menu
                        </h2>
                        <p className="text-muted">
                            {menu.plats?.length || 0} plats préparés avec passion par Julie et José
                        </p>
                    </div>

                    <div className="detail-menu-plats">
                        {/* Entrees */}
                        {platsParType.entree.map((plat) => (
                            <div key={plat.plat_id} className="detail-menu-plat">
                                <div className="detail-menu-plat-image">
                                    {plat.photo ? (
                                        <img src={plat.photo} alt={plat.titre} />
                                    ) : (
                                        <div className="detail-menu-plat-placeholder">
                                            <span className="detail-menu-plat-type-icone">🥗</span>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-menu-plat-contenu">
                                    <span className="detail-menu-plat-type">Entrée</span>
                                    <h3 className="detail-menu-plat-titre">{plat.titre}</h3>
                                    {plat.allergenes && plat.allergenes.length > 0 && (
                                        <div className="detail-menu-allergenes">
                                            <span className="detail-menu-allergenes-label">Allergènes :</span>
                                            {plat.allergenes.map((a) => (
                                                <span key={a.allergene_id} className="detail-menu-allergene">
                                                    {a.libelle}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Plats principaux */}
                        {platsParType.plat.map((plat) => (
                            <div key={plat.plat_id} className="detail-menu-plat">
                                <div className="detail-menu-plat-image">
                                    {plat.photo ? (
                                        <img src={plat.photo} alt={plat.titre} />
                                    ) : (
                                        <div className="detail-menu-plat-placeholder">
                                            <span className="detail-menu-plat-type-icone">🍽️</span>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-menu-plat-contenu">
                                    <span className="detail-menu-plat-type">Plat principal</span>
                                    <h3 className="detail-menu-plat-titre">{plat.titre}</h3>
                                    {plat.allergenes && plat.allergenes.length > 0 && (
                                        <div className="detail-menu-allergenes">
                                            <span className="detail-menu-allergenes-label">Allergènes :</span>
                                            {plat.allergenes.map((a) => (
                                                <span key={a.allergene_id} className="detail-menu-allergene">
                                                    {a.libelle}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Desserts */}
                        {platsParType.dessert.map((plat) => (
                            <div key={plat.plat_id} className="detail-menu-plat">
                                <div className="detail-menu-plat-image">
                                    {plat.photo ? (
                                        <img src={plat.photo} alt={plat.titre} />
                                    ) : (
                                        <div className="detail-menu-plat-placeholder">
                                            <span className="detail-menu-plat-type-icone">🍰</span>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-menu-plat-contenu">
                                    <span className="detail-menu-plat-type">Dessert</span>
                                    <h3 className="detail-menu-plat-titre">{plat.titre}</h3>
                                    {plat.allergenes && plat.allergenes.length > 0 && (
                                        <div className="detail-menu-allergenes">
                                            <span className="detail-menu-allergenes-label">Allergènes :</span>
                                            {plat.allergenes.map((a) => (
                                                <span key={a.allergene_id} className="detail-menu-allergene">
                                                    {a.libelle}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === MENUS SIMILAIRES === */}
                {menusSimilaires.length > 0 && (
                    <section className="detail-menu-similaires">
                        <h2 className="titre-serif detail-menu-section-titre">
                            Menus similaires
                        </h2>
                        <div className="detail-menu-similaires-grille">
                            {menusSimilaires.map((m) => (
                                <CarteMenu key={m.menu_id} menu={m} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* === CTA BANNER === */}
            <section className="detail-menu-cta">
                <div className="container text-center py-5">
                    <h2 className="detail-menu-cta-titre">
                        Prêt à réserver votre {menu.titre.replace('Menu ', '')} ?
                    </h2>
                    <p className="detail-menu-cta-texte">
                        Offrez à vos invités une expérience gastronomique inoubliable
                    </p>
                    <button
                        type="button"
                        onClick={gererCommander}
                        className="btn btn-light btn-lg mt-3"
                        disabled={menu.quantite_restante === 0}
                    >
                        Commander ce menu
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ms-2">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </section>
        </main>
    )
}
