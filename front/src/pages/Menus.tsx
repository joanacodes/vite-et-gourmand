// ============================================================
// PAGE MENUS - Liste publique des menus avec filtres dynamiques
//
// Filtrage cote front, instantane, sans rechargement (enonce p.5)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Menu } from '../types'
import CarteMenu from '../components/menus/CarteMenu'
import FiltresMenus from '../components/menus/FiltresMenus'
import type { FiltresState } from '../components/menus/FiltresMenus'
import './Menus.css'

const filtresInitiaux: FiltresState = {
    recherche: '',
    theme: null,
    prixMax: null,
    personnesMin: null,
    tri: 'recents',
}

export default function Menus() {
    const [menus, setMenus] = useState<Menu[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState('')
    const [filtres, setFiltres] = useState<FiltresState>(filtresInitiaux)

    // === CHARGEMENT INITIAL ===
    useEffect(() => {
        async function charger() {
            try {
                const data = await api.get<{ menus: Menu[]; nombre: number }>('/api/menus')
                setMenus(data.menus)
            } catch (err: any) {
                setErreur(err.message || 'Erreur lors du chargement des menus.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    // === FILTRAGE + TRI DYNAMIQUE ===
    const menusAffiches = useMemo(() => {
        let resultats = [...menus]

        // Filtre recherche texte (titre + description)
        if (filtres.recherche.trim()) {
            const recherche = filtres.recherche.toLowerCase().trim()
            resultats = resultats.filter(
                (m) =>
                    m.titre.toLowerCase().includes(recherche) ||
                    m.description.toLowerCase().includes(recherche)
            )
        }

        // Filtre theme (sur le libelle exact)
        if (filtres.theme !== null) {
            resultats = resultats.filter((m) => m.theme === filtres.theme)
        }

        // Filtre prix maximum (le back renvoie en string, on convertit)
        if (filtres.prixMax !== null) {
            resultats = resultats.filter((m) => Number(m.prix_par_personne) <= filtres.prixMax!)
        }

        // Filtre nombre de personnes minimum
        if (filtres.personnesMin !== null) {
            resultats = resultats.filter((m) => m.nombre_personnes_minimum >= filtres.personnesMin!)
        }

        // Tri
        switch (filtres.tri) {
            case 'prix-asc':
                resultats.sort((a, b) => Number(a.prix_par_personne) - Number(b.prix_par_personne))
                break
            case 'prix-desc':
                resultats.sort((a, b) => Number(b.prix_par_personne) - Number(a.prix_par_personne))
                break
            case 'nom-asc':
                resultats.sort((a, b) => a.titre.localeCompare(b.titre))
                break
            case 'recents':
            default:
                break
        }

        return resultats
    }, [menus, filtres])

    function reinitialiser() {
        setFiltres(filtresInitiaux)
    }

    if (chargement) {
        return (
            <main className="menus-page">
                <div className="container py-5 text-center">
                    <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                        <span className="visually-hidden">Chargement des menus...</span>
                    </div>
                </div>
            </main>
        )
    }

    if (erreur) {
        return (
            <main className="menus-page">
                <div className="container py-5">
                    <div className="alert alert-danger" role="alert">{erreur}</div>
                </div>
            </main>
        )
    }

    return (
        <main className="menus-page">
            <div className="container py-5">
                {/* === BREADCRUMB === */}
                <nav aria-label="Fil d'Ariane" className="menus-breadcrumb">
                    <Link to="/">Accueil</Link>
                    <span className="menus-breadcrumb-sep" aria-hidden="true">{'>'}</span>
                    <span aria-current="page">Nos menus</span>
                </nav>

                {/* === HEADER === */}
                <header className="menus-header">
                    <h1 className="menus-titre">Decouvrez nos menus</h1>
                    <p className="menus-soustitre">
                        Une selection de menus raffines pour tous vos evenements, elabores avec passion par Julie et Jose
                    </p>

                    <div className="menus-trust-badges">
                        <span className="menus-trust">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                            25 ans d'expertise
                        </span>
                        <span className="menus-trust">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
                            </svg>
                            Produits locaux
                        </span>
                    </div>
                </header>

                {/* === FILTRES === */}
                <FiltresMenus
                    filtres={filtres}
                    onChange={setFiltres}
                    onReinitialiser={reinitialiser}
                />

                {/* === COMPTEUR === */}
                <div className="menus-compteur">
                    <span className="menus-compteur-nombre titre-serif">
                        {menusAffiches.length} menu{menusAffiches.length > 1 ? 's' : ''}
                    </span>
                    <span className="menus-compteur-texte"> disponible{menusAffiches.length > 1 ? 's' : ''}</span>
                </div>

                {/* === GRILLE === */}
                {menusAffiches.length > 0 ? (
                    <div className="menus-grille">
                        {menusAffiches.map((menu) => (
                            <CarteMenu key={menu.menu_id} menu={menu} />
                        ))}
                    </div>
                ) : (
                    <div className="menus-aucun-resultat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <h2>Aucun menu ne correspond a vos criteres</h2>
                        <p>Essayez d'elargir vos filtres ou de les reinitialiser.</p>
                        <button onClick={reinitialiser} className="btn btn-primary">
                            Reinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* === CTA === */}
            <section className="menus-cta">
                <div className="container text-center py-5">
                    <h2 className="menus-cta-titre">Un menu sur-mesure pour votre evenement ?</h2>
                    <p className="menus-cta-texte">
                        Julie et Jose creent avec vous un menu personnalise qui ravira vos convives
                        et sublimera votre evenement
                    </p>
                    <Link to="/contact" className="btn btn-light btn-lg mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="me-2">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        Nous contacter
                    </Link>
                </div>
            </section>
        </main>
    )
}
