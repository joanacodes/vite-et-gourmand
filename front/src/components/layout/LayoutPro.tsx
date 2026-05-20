// Layout des espaces pro (employe + admin).
// Sidebar bleue a gauche + zone principale a droite.
// Le menu s'adapte au role.

import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    Soup,
    Clock,
    Star,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu as MenuIcon,
    X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import './LayoutPro.css'

interface ItemMenu {
    chemin: string
    label: string
    icone: React.ReactNode
    badge?: number
}

interface Props {
    espace: 'employe' | 'admin'
}

export default function LayoutPro({ espace }: Props) {
    const { utilisateur, deconnecter } = useAuth()
    const navigate = useNavigate()
    const [sidebarOuverte, setSidebarOuverte] = useState(false)

    // Compteurs pour les badges (commandes a traiter, avis a moderer)
    const [nbCommandesEnAttente, setNbCommandesEnAttente] = useState<number | undefined>()
    const [nbAvisEnAttente, setNbAvisEnAttente] = useState<number | undefined>()

    useEffect(() => {
        // On charge les compteurs en silence, c'est juste pour les badges
        async function chargerCompteurs() {
            try {
                const data = await api.get<{ commandes: any[] }>('/api/commandes?statut=en_attente')
                setNbCommandesEnAttente(data.commandes?.length ?? 0)
            } catch {
                // pas grave, le badge ne s'affiche pas
            }
            try {
                const data = await api.get<{ avis: any[] }>('/api/avis?statut=en_attente')
                setNbAvisEnAttente(data.avis?.length ?? 0)
            } catch {
                // idem
            }
        }
        chargerCompteurs()
    }, [])

    const racine = espace === 'admin' ? '/admin' : '/employe'

    // Menus differents selon l'espace
    // Note : pas de "Tableau de bord" pour les employes (reserve a l'admin).
    // L'index /employe redirige vers /employe/commandes (defini dans App.tsx).
    const itemsEmploye: ItemMenu[] = [
        { chemin: `${racine}/commandes`, label: 'Commandes', icone: <ClipboardList size={18} />, badge: nbCommandesEnAttente },
        { chemin: `${racine}/menus`, label: 'Menus', icone: <UtensilsCrossed size={18} /> },
        { chemin: `${racine}/plats`, label: 'Plats', icone: <Soup size={18} /> },
        { chemin: `${racine}/horaires`, label: 'Horaires', icone: <Clock size={18} /> },
        { chemin: `${racine}/avis`, label: 'Avis', icone: <Star size={18} />, badge: nbAvisEnAttente },
    ]

    const itemsAdmin: ItemMenu[] = [
        { chemin: `${racine}`, label: 'Tableau de bord', icone: <LayoutDashboard size={18} /> },
        { chemin: `${racine}/menus`, label: 'Menus', icone: <UtensilsCrossed size={18} /> },
        { chemin: `${racine}/plats`, label: 'Plats', icone: <Soup size={18} /> },
        { chemin: `${racine}/commandes`, label: 'Commandes', icone: <ClipboardList size={18} />, badge: nbCommandesEnAttente },
        { chemin: `${racine}/horaires`, label: 'Horaires', icone: <Clock size={18} /> },
        { chemin: `${racine}/utilisateurs`, label: 'Utilisateurs', icone: <Users size={18} /> },
        { chemin: `${racine}/avis`, label: 'Avis', icone: <Star size={18} />, badge: nbAvisEnAttente },
        { chemin: `${racine}/statistiques`, label: 'Statistiques', icone: <BarChart3 size={18} /> },
        { chemin: `${racine}/parametres`, label: 'Paramètres', icone: <Settings size={18} /> },
    ]

    const items = espace === 'admin' ? itemsAdmin : itemsEmploye

    async function gererDeconnexion() {
        await deconnecter()
        navigate('/')
    }

    function fermerSidebar() {
        setSidebarOuverte(false)
    }

    return (
        <div className="layout-pro">
            {/* Bouton burger mobile */}
            <button
                type="button"
                className="layout-pro-burger"
                onClick={() => setSidebarOuverte(true)}
                aria-label="Ouvrir le menu"
            >
                <MenuIcon size={22} />
            </button>

            {/* Overlay sur mobile quand sidebar ouverte */}
            {sidebarOuverte && (
                <div
                    className="layout-pro-overlay"
                    onClick={fermerSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`layout-pro-sidebar ${sidebarOuverte ? 'layout-pro-sidebar--ouverte' : ''}`}
                aria-label="Navigation principale"
            >
                {/* En-tete sidebar */}
                <div className="layout-pro-sidebar-header">
                    <Link to={racine} className="layout-pro-logo" onClick={fermerSidebar}>
                        Vite &amp; Gourmand
                    </Link>
                    <span className="layout-pro-sous-titre">
                        {espace === 'admin' ? 'Espace Administrateur' : 'Espace Employé'}
                    </span>

                    {/* Bouton fermer sur mobile */}
                    <button
                        type="button"
                        className="layout-pro-fermer"
                        onClick={fermerSidebar}
                        aria-label="Fermer le menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="layout-pro-nav">
                    {items.map((item) => (
                        <NavLink
                            key={item.chemin}
                            to={item.chemin}
                            end={item.chemin === racine}
                            className={({ isActive }) =>
                                `layout-pro-item ${isActive ? 'layout-pro-item--actif' : ''}`
                            }
                            onClick={fermerSidebar}
                        >
                            <span className="layout-pro-item-icone">{item.icone}</span>
                            <span className="layout-pro-item-label">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="layout-pro-badge">{item.badge}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer sidebar : utilisateur connecte */}
                <div className="layout-pro-footer">
                    <div className="layout-pro-user">
                        <div className="layout-pro-avatar" aria-hidden="true">
                            {utilisateur?.prenom?.[0]?.toUpperCase()}
                            {utilisateur?.nom?.[0]?.toUpperCase()}
                        </div>
                        <div className="layout-pro-user-infos">
                            <div className="layout-pro-user-nom">
                                {utilisateur?.prenom} {utilisateur?.nom}
                            </div>
                            <div className="layout-pro-user-role">
                                {espace === 'admin' ? 'Administrateur' : 'Employé(e)'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={gererDeconnexion}
                        className="layout-pro-deconnexion"
                    >
                        <LogOut size={16} className="me-2" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Zone principale */}
            <main className="layout-pro-contenu">
                <Outlet />
            </main>
        </div>
    )
}
