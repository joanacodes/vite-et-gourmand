// ============================================================
// PAGE MOT DE PASSE OUBLIE
//
// L'utilisateur saisit son email, le back envoie un mail avec
// un lien de reinitialisation contenant un token (1h de validite).
// ============================================================

import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import PageAuth from '../../components/layout/PageAuth'
import './MotDePasseOublie.css'

export default function MotDePasseOublie() {
    const [email, setEmail] = useState('')
    const [chargement, setChargement] = useState(false)
    const [succes, setSucces] = useState(false)

    async function soumettre(e: FormEvent) {
        e.preventDefault()
        setChargement(true)

        try {
            await api.post('/api/auth/mot-de-passe-oublie', { email })
            setSucces(true)
        } catch {
            // Pour la securite, on affiche le meme message succes meme en cas d'echec
            // (eviter d'indiquer si l'email existe ou non en BDD)
            setSucces(true)
        } finally {
            setChargement(false)
        }
    }

    return (
        <PageAuth
            cotegauche={
                <div className="mdp-oublie-gauche">
                    <div className="mdp-oublie-logo">Vite & Gourmand</div>

                    <div className="mdp-oublie-icone-cercle" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                    </div>

                    <h2 className="titre-serif mdp-oublie-titre">
                        Récupération de votre<br />
                        mot de passe
                    </h2>
                    <p className="mdp-oublie-soustitre">
                        Suivez ces étapes simples pour réinitialiser votre accès
                    </p>

                    <ol className="mdp-oublie-etapes">
                        <li>
                            <div className="mdp-oublie-numero">1</div>
                            <div>
                                <div className="mdp-oublie-etape-titre">Saisissez votre email</div>
                                <div className="mdp-oublie-etape-desc">
                                    Indiquez l'adresse email associée à votre compte
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="mdp-oublie-numero">2</div>
                            <div>
                                <div className="mdp-oublie-etape-titre">Recevez le lien sécurisé</div>
                                <div className="mdp-oublie-etape-desc">
                                    Un email vous sera envoyé avec un lien de réinitialisation
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="mdp-oublie-numero">3</div>
                            <div>
                                <div className="mdp-oublie-etape-titre">Créez un nouveau mot de passe</div>
                                <div className="mdp-oublie-etape-desc">
                                    Choisissez un nouveau mot de passe sécurisé pour votre compte
                                </div>
                            </div>
                        </li>
                    </ol>

                    <div className="mdp-oublie-progression">
                        <span className="mdp-oublie-point active"></span>
                        <span className="mdp-oublie-point"></span>
                        <span className="mdp-oublie-point"></span>
                    </div>
                </div>
            }
            cotedroit={
                <div className="page-auth-carte">
                    {succes ? (
                        // === ETAT SUCCES ===
                        <div className="text-center">
                            <div className="mdp-oublie-icone-succes mb-3" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <path d="m9 11 3 3L22 4" />
                                </svg>
                            </div>
                            <h1 className="titre-serif mdp-oublie-titre-form">Email envoyé !</h1>
                            <p className="text-muted mb-4">
                                Si un compte existe avec cette adresse, vous recevrez sous peu un email
                                contenant un lien pour réinitialiser votre mot de passe.
                            </p>

                            <div className="mdp-oublie-info mb-4">
                                <strong>Que faire maintenant ?</strong>
                                <ul className="mt-2 mb-0">
                                    <li>Consultez votre boîte de réception</li>
                                    <li>Vérifiez votre dossier <strong>spam/courrier indésirable</strong></li>
                                    <li>Le lien est valable <strong>1 heure</strong></li>
                                </ul>
                            </div>

                            <Link to="/connexion" className="btn btn-outline-primary w-100">
                                ← Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        // === ETAT FORMULAIRE ===
                        <>
                            <h1 className="titre-serif mdp-oublie-titre-form">Mot de passe oublié ?</h1>
                            <p className="text-muted">
                                Ne vous inquiétez pas, nous allons vous aider à retrouver l'accès à votre compte
                            </p>

                            <form onSubmit={soumettre} noValidate className="mt-4">
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label fw-medium">
                                        Adresse email <span className="text-danger">*</span>
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
                                            placeholder="jean.dupont@exemple.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-text">
                                        Entrez l'adresse email que vous avez utilisée lors de votre inscription
                                    </div>
                                </div>

                                <div className="mdp-oublie-info mb-4">
                                    <div className="d-flex align-items-start gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-1">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4" />
                                            <path d="M12 8h.01" />
                                        </svg>
                                        <div>
                                            <strong>Informations importantes :</strong>
                                            <ul className="mb-0 mt-2 mdp-oublie-info-liste">
                                                <li>Le lien de réinitialisation est valable pendant <strong>1 heure</strong></li>
                                                <li>Vérifiez votre dossier <strong>spam/courrier indésirable</strong> si vous ne recevez pas l'email</li>
                                                <li>Pour votre sécurité, le lien ne peut être utilisé qu'une seule fois</li>
                                                <li>Si vous rencontrez un problème, <Link to="/contact">contactez-nous</Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2"
                                    disabled={chargement || !email}
                                >
                                    {chargement ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2" aria-hidden="true">
                                                <path d="m22 2-7 20-4-9-9-4Z" />
                                                <path d="M22 2 11 13" />
                                            </svg>
                                            Envoyer le lien de réinitialisation
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mdp-oublie-separateur">
                                <span>ou</span>
                            </div>

                            <div className="row g-2">
                                <div className="col-6">
                                    <Link to="/connexion" className="btn btn-outline-primary w-100">
                                        ← Se connecter
                                    </Link>
                                </div>
                                <div className="col-6">
                                    <Link to="/inscription" className="btn btn-outline-primary w-100">
                                        Créer un compte
                                    </Link>
                                </div>
                            </div>

                            <div className="text-center text-muted small mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" aria-hidden="true">
                                    <rect width="18" height="11" x="3" y="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Vos données sont protégées et chiffrées
                            </div>
                        </>
                    )}
                </div>
            }
        />
    )
}
