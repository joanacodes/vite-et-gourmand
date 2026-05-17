// ============================================================
// PAGE CONNEXION
//
// Maquette : split-screen avec temoignages clients tournants
// a gauche, formulaire de connexion a droite.
//
// Apres connexion, redirige selon le role :
// - utilisateur -> /
// - employe -> /espace-employe (a coder plus tard)
// - administrateur -> /espace-admin (a coder plus tard)
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import PageAuth from '../../components/layout/PageAuth'
import './Connexion.css'

// Temoignages clients pour le slider de gauche
const temoignages = [
    {
        texte: 'Une expérience culinaire exceptionnelle, des saveurs authentiques qui nous ont transportés.',
        auteur: 'Marie & Thomas Dubois',
        evenement: 'Mariage • Juin 2024',
    },
    {
        texte: 'Service impeccable, présentation soignée, des plats à tomber. Toute mon équipe a adoré.',
        auteur: 'Sophie Lambert',
        evenement: 'Séminaire entreprise • Mars 2024',
    },
    {
        texte: 'Julie et José nous ont fait vivre un Noël inoubliable. Une cuisine pleine d\'âme.',
        auteur: 'Famille Bernard',
        evenement: 'Réveillon • Décembre 2023',
    },
]

export default function Connexion() {
    const navigate = useNavigate()
    const { connecter, utilisateur } = useAuth()

    // Etat du formulaire
    const [email, setEmail] = useState('')
    const [motDePasse, setMotDePasse] = useState('')
    const [afficherMdp, setAfficherMdp] = useState(false)
    const [seSouvenir, setSeSouvenir] = useState(false)

    // Etat de chargement et erreur
    const [chargement, setChargement] = useState(false)
    const [erreur, setErreur] = useState('')

    // Index du temoignage affiche (rotation auto)
    const [indexTemoignage, setIndexTemoignage] = useState(0)

    // Rotation automatique des temoignages toutes les 5 secondes
    useEffect(() => {
        const intervalle = setInterval(() => {
            setIndexTemoignage((i) => (i + 1) % temoignages.length)
        }, 5000)
        return () => clearInterval(intervalle)
    }, [])

    // Si deja connecte, redirige vers l'accueil
    useEffect(() => {
        if (utilisateur) {
            redirigerSelonRole(utilisateur.role)
        }
    }, [utilisateur])

    function redirigerSelonRole(role: string) {
        if (role === 'administrateur') {
            navigate('/espace-admin')
        } else if (role === 'employe') {
            navigate('/espace-employe')
        } else {
            navigate('/')
        }
    }

    async function soumettre(e: React.FormEvent) {
        e.preventDefault()
        setErreur('')
        setChargement(true)

        try {
            await connecter(email, motDePasse)
            // La redirection se fera via le useEffect quand utilisateur sera mis a jour
        } catch (err: any) {
            setErreur(err.message || 'Échec de la connexion. Vérifiez vos identifiants.')
            setChargement(false)
        }
    }

    const temoignage = temoignages[indexTemoignage]

    return (
        <PageAuth
            cotegauche={
                <div className="connexion-temoignage">
                    {/* Logo Vite & Gourmand en haut */}
                    <div className="connexion-logo-gauche">Vite & Gourmand</div>

                    {/* Citation */}
                    <div className="connexion-citation">
                        <div className="connexion-guillemets-haut" aria-hidden="true">"</div>
                        <p className="connexion-texte-citation">{temoignage.texte}</p>
                        <div className="connexion-guillemets-bas" aria-hidden="true">"</div>
                    </div>

                    {/* Auteur */}
                    <div className="connexion-auteur">
                        <div className="connexion-nom">{temoignage.auteur}</div>
                        <div className="connexion-evenement">{temoignage.evenement}</div>
                    </div>

                    {/* Pagination */}
                    <div className="connexion-pagination">
                        {temoignages.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndexTemoignage(i)}
                                className={`connexion-puce ${i === indexTemoignage ? 'active' : ''}`}
                                aria-label={`Témoignage ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            }
            cotedroit={
                <div className="page-auth-carte">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <div className="connexion-suptitre">ESPACE CLIENT</div>
                        <h1 className="titre-serif connexion-titre">Bienvenue</h1>
                        <p className="text-muted">Connectez-vous pour accéder à votre compte</p>
                    </div>

                    <hr className="connexion-separateur" />
                    <div className="connexion-section-label">Vos identifiants</div>

                    {/* Erreur globale */}
                    {erreur && (
                        <div className="alert alert-danger" role="alert">
                            {erreur}
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={soumettre} noValidate>
                        {/* Email */}
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label fw-medium">
                                Adresse e-mail <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-control"
                                    placeholder="votre@email.fr"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div className="mb-3">
                            <label htmlFor="mot-de-passe" className="form-label fw-medium">
                                Mot de passe <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect width="18" height="11" x="3" y="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    type={afficherMdp ? 'text' : 'password'}
                                    id="mot-de-passe"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary border-start-0"
                                    onClick={() => setAfficherMdp(!afficherMdp)}
                                    aria-label={afficherMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                >
                                    {afficherMdp ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                            <line x1="2" x2="22" y1="2" y2="22" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Se souvenir + mot de passe oublie */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="se-souvenir"
                                    checked={seSouvenir}
                                    onChange={(e) => setSeSouvenir(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="se-souvenir">
                                    Se souvenir de moi
                                </label>
                            </div>
                            <Link to="/mot-de-passe-oublie" className="connexion-lien-mdp">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        {/* Bouton submit */}
                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 connexion-bouton-submit"
                            disabled={chargement}
                        >
                            {chargement ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Connexion...
                                </>
                            ) : (
                                <>
                                    Se connecter
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-2" aria-hidden="true">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Lien vers inscription */}
                    <div className="text-center mt-4">
                        <span className="text-muted">Pas encore de compte ?</span>
                        <br />
                        <Link to="/inscription" className="connexion-lien-inscription">
                            Créer un compte
                        </Link>
                    </div>

                    {/* Encart securite */}
                    <div className="connexion-securite mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect width="18" height="11" x="3" y="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <div>
                            <strong>Vos données sont protégées et chiffrées.</strong>
                            <span className="d-block text-muted small">Nous respectons votre vie privée.</span>
                        </div>
                    </div>
                </div>
            }
        />
    )
}
