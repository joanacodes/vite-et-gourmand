// Layout pour l'espace "mon compte" (client).
// Reutilise la Navbar+Footer du site public mais ajoute une
// sidebar simple a gauche pour naviguer entre les sections.

import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, User, Star } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'
import './LayoutClient.css'

export default function LayoutClient() {
    const { utilisateur } = useAuth()

    return (
        <>
            <Navbar />
            <main className="layout-client">
                <div className="container py-4">
                    <div className="layout-client-grille">
                        {/* Sidebar */}
                        <aside className="layout-client-sidebar" aria-label="Navigation Mon compte">
                            <div className="layout-client-user">
                                <div className="layout-client-avatar" aria-hidden="true">
                                    {utilisateur?.prenom?.[0]?.toUpperCase()}
                                    {utilisateur?.nom?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <strong>
                                        {utilisateur?.prenom} {utilisateur?.nom}
                                    </strong>
                                    <div className="layout-client-email">
                                        {utilisateur?.email}
                                    </div>
                                </div>
                            </div>

                            <nav className="layout-client-nav">
                                <NavLink
                                    to="/mon-compte"
                                    end
                                    className={({ isActive }) =>
                                        `layout-client-item ${isActive ? 'layout-client-item--actif' : ''}`
                                    }
                                >
                                    <LayoutDashboard size={16} />
                                    Vue d'ensemble
                                </NavLink>
                                <NavLink
                                    to="/mon-compte/commandes"
                                    className={({ isActive }) =>
                                        `layout-client-item ${isActive ? 'layout-client-item--actif' : ''}`
                                    }
                                >
                                    <ClipboardList size={16} />
                                    Mes commandes
                                </NavLink>
                                <NavLink
                                    to="/mon-compte/avis"
                                    className={({ isActive }) =>
                                        `layout-client-item ${isActive ? 'layout-client-item--actif' : ''}`
                                    }
                                >
                                    <Star size={16} />
                                    Mes avis
                                </NavLink>
                                <NavLink
                                    to="/mon-compte/profil"
                                    className={({ isActive }) =>
                                        `layout-client-item ${isActive ? 'layout-client-item--actif' : ''}`
                                    }
                                >
                                    <User size={16} />
                                    Mon profil
                                </NavLink>
                            </nav>
                        </aside>

                        {/* Zone principale */}
                        <div className="layout-client-contenu">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
