import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    Menu as MenuIcon,
    X,
    LayoutDashboard,
    UtensilsCrossed,
    Soup,
    ClipboardList,
    Users,
    Star,
    BarChart3,
    Settings,
    Clock,
    User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import './Navbar.css'

export default function Navbar() {
    const { utilisateur, deconnecter } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOuvert, setMenuOuvert] = useState(false)

    // On ferme le menu a chaque changement de route
    useEffect(() => {
        setMenuOuvert(false)
    }, [location.pathname])

    // On verrouille le scroll du body quand le menu est ouvert
    useEffect(() => {
        if (menuOuvert) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [menuOuvert])

    async function gererDeconnexion() {
        await deconnecter()
        setMenuOuvert(false)
        navigate('/')
    }

    // Lien vers l'espace pro selon le role
    const lienEspacePro =
        utilisateur?.role === 'administrateur'
            ? '/admin'
            : utilisateur?.role === 'employe'
              ? '/employe'
              : null

    // Liens "espace pro" pour le hamburger mobile
    const racine = lienEspacePro || '/'
    const liensProAdmin = [
        { chemin: racine, label: 'Tableau de bord', icone: <LayoutDashboard size={18} /> },
        { chemin: `${racine}/menus`, label: 'Menus', icone: <UtensilsCrossed size={18} /> },
        { chemin: `${racine}/plats`, label: 'Plats', icone: <Soup size={18} /> },
        { chemin: `${racine}/commandes`, label: 'Commandes', icone: <ClipboardList size={18} /> },
        { chemin: `${racine}/horaires`, label: 'Horaires', icone: <Clock size={18} /> },
        { chemin: `${racine}/utilisateurs`, label: 'Utilisateurs', icone: <Users size={18} /> },
        { chemin: `${racine}/avis`, label: 'Avis', icone: <Star size={18} /> },
        { chemin: `${racine}/statistiques`, label: 'Statistiques', icone: <BarChart3 size={18} /> },
        { chemin: `${racine}/parametres`, label: 'Paramètres', icone: <Settings size={18} /> },
    ]
    const liensProEmploye = [
        { chemin: `${racine}/commandes`, label: 'Commandes', icone: <ClipboardList size={18} /> },
        { chemin: `${racine}/menus`, label: 'Menus', icone: <UtensilsCrossed size={18} /> },
        { chemin: `${racine}/plats`, label: 'Plats', icone: <Soup size={18} /> },
        { chemin: `${racine}/horaires`, label: 'Horaires', icone: <Clock size={18} /> },
        { chemin: `${racine}/avis`, label: 'Avis', icone: <Star size={18} /> },
    ]
    const liensPro =
        utilisateur?.role === 'administrateur'
            ? liensProAdmin
            : utilisateur?.role === 'employe'
              ? liensProEmploye
              : []

    return (
        <nav className="navbar-principale">
            <div className="container-fluid d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
                <Link to="/" className="navbar-logo">
                    Vite &amp; Gourmand
                </Link>

                {/* Liens desktop (caches sur mobile/tablette) */}
                <div className="navbar-liens-desktop">
                    <NavLink to="/" end className="navbar-lien">Accueil</NavLink>
                    <NavLink to="/menus" className="navbar-lien">Nos menus</NavLink>
                    <NavLink to="/contact" className="navbar-lien">Contact</NavLink>
                </div>

                {/* Zone droite desktop */}
                <div className="navbar-droite-desktop">
                    {utilisateur ? (
                        <>
                            <Link
                                to="/mon-compte"
                                className="navbar-bonjour"
                                title="Mon compte"
                            >
                                Bonjour {utilisateur.prenom}
                            </Link>
                            {lienEspacePro && (
                                <Link to={lienEspacePro} className="navbar-bouton-espacepro">
                                    Mon espace
                                </Link>
                            )}
                            <button onClick={gererDeconnexion} className="navbar-bouton-compte">
                                Déconnexion
                            </button>
                        </>
                    ) : (
                        <Link to="/connexion" className="navbar-bouton-compte">
                            <User size={18} className="me-2" aria-hidden="true" />
                            Mon compte
                        </Link>
                    )}
                </div>

                {/* Bouton hamburger (visible uniquement sur mobile/tablette) */}
                <button
                    type="button"
                    className="navbar-hamburger"
                    onClick={() => setMenuOuvert(true)}
                    aria-label="Ouvrir le menu"
                    aria-expanded={menuOuvert}
                >
                    <MenuIcon size={26} />
                </button>
            </div>

            {/* Overlay du menu hamburger plein ecran */}
            {menuOuvert && (
                <div
                    className="navbar-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu de navigation"
                >
                    <div className="navbar-overlay-header">
                        <span className="navbar-logo">Vite &amp; Gourmand</span>
                        <button
                            type="button"
                            className="navbar-fermer"
                            onClick={() => setMenuOuvert(false)}
                            aria-label="Fermer le menu"
                        >
                            <X size={26} />
                        </button>
                    </div>

                    <div className="navbar-overlay-contenu">
                        {/* Liens publics toujours visibles */}
                        <div className="navbar-overlay-section">
                            <NavLink to="/" end className="navbar-overlay-lien">
                                Accueil
                            </NavLink>
                            <NavLink to="/menus" className="navbar-overlay-lien">
                                Nos menus
                            </NavLink>
                            <NavLink to="/contact" className="navbar-overlay-lien">
                                Contact
                            </NavLink>
                        </div>

                        {/* Si connecte */}
                        {utilisateur && (
                            <>
                                <div className="navbar-overlay-separateur" />

                                <div className="navbar-overlay-user">
                                    <div className="navbar-overlay-avatar" aria-hidden="true">
                                        {utilisateur.prenom?.[0]?.toUpperCase()}
                                        {utilisateur.nom?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <strong>
                                            {utilisateur.prenom} {utilisateur.nom}
                                        </strong>
                                        <div className="navbar-overlay-role">
                                            {utilisateur.role === 'administrateur'
                                                ? 'Administrateur'
                                                : utilisateur.role === 'employe'
                                                  ? 'Employé'
                                                  : 'Client'}
                                        </div>
                                    </div>
                                </div>

                                {/* Liens espace client */}
                                {utilisateur.role === 'utilisateur' && (
                                    <div className="navbar-overlay-section">
                                        <div className="navbar-overlay-titre">Mon compte</div>
                                        <NavLink to="/mon-compte" end className="navbar-overlay-lien-pro">
                                            <LayoutDashboard size={18} aria-hidden="true" />
                                            Vue d'ensemble
                                        </NavLink>
                                        <NavLink to="/mon-compte/commandes" className="navbar-overlay-lien-pro">
                                            <ClipboardList size={18} aria-hidden="true" />
                                            Mes commandes
                                        </NavLink>
                                        <NavLink to="/mon-compte/avis" className="navbar-overlay-lien-pro">
                                            <Star size={18} aria-hidden="true" />
                                            Mes avis
                                        </NavLink>
                                        <NavLink to="/mon-compte/profil" className="navbar-overlay-lien-pro">
                                            <User size={18} aria-hidden="true" />
                                            Mon profil
                                        </NavLink>
                                    </div>
                                )}

                                {/* Liens espace pro (admin / employe) */}
                                {liensPro.length > 0 && (
                                    <div className="navbar-overlay-section">
                                        <div className="navbar-overlay-titre">
                                            Espace {utilisateur.role === 'administrateur' ? 'admin' : 'employé'}
                                        </div>
                                        {liensPro.map((l) => (
                                            <NavLink
                                                key={l.chemin}
                                                to={l.chemin}
                                                end={l.chemin === racine}
                                                className="navbar-overlay-lien-pro"
                                            >
                                                {l.icone}
                                                {l.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}

                                <div className="navbar-overlay-separateur" />

                                <button
                                    type="button"
                                    onClick={gererDeconnexion}
                                    className="navbar-overlay-deconnexion"
                                >
                                    Déconnexion
                                </button>
                            </>
                        )}

                        {/* Si non connecte */}
                        {!utilisateur && (
                            <>
                                <div className="navbar-overlay-separateur" />
                                <Link
                                    to="/connexion"
                                    className="btn btn-outline-light w-100"
                                    onClick={() => setMenuOuvert(false)}
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    to="/inscription"
                                    className="btn btn-light w-100 mt-2"
                                    onClick={() => setMenuOuvert(false)}
                                >
                                    Créer un compte
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
