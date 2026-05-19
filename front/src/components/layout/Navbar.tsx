import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Navbar.css'

export default function Navbar() {
    const { utilisateur, deconnecter } = useAuth()
    const navigate = useNavigate()

    async function gererDeconnexion() {
        await deconnecter()
        navigate('/')
    }

    // Lien vers l'espace pro selon le role
    const lienEspacePro =
        utilisateur?.role === 'administrateur'
            ? '/admin'
            : utilisateur?.role === 'employe'
              ? '/employe'
              : null

    return (
        <nav className="navbar-principale">
            <div className="container-fluid d-flex align-items-center justify-content-between px-4 py-3">
                <Link to="/" className="navbar-logo">
                    Vite &amp; Gourmand
                </Link>

                <div className="d-none d-md-flex gap-4">
                    <NavLink to="/" end className="navbar-lien">Accueil</NavLink>
                    <NavLink to="/menus" className="navbar-lien">Nos menus</NavLink>
                    <NavLink to="/contact" className="navbar-lien">Contact</NavLink>
                </div>

                {utilisateur ? (
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-white d-none d-sm-inline">
                            Bonjour {utilisateur.prenom}
                        </span>
                        {lienEspacePro && (
                            <Link to={lienEspacePro} className="navbar-bouton-espacepro">
                                Mon espace
                            </Link>
                        )}
                        <button onClick={gererDeconnexion} className="navbar-bouton-compte">
                            Déconnexion
                        </button>
                    </div>
                ) : (
                    <Link to="/connexion" className="navbar-bouton-compte">
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
                            className="me-2"
                            aria-hidden="true"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Mon compte
                    </Link>
                )}
            </div>
        </nav>
    )
}
