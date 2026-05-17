// ============================================================
// PAGE REINITIALISER MOT DE PASSE
//
// Recoit le token via l'URL : /reinitialiser-mot-de-passe?token=xxx
// L'utilisateur saisit son nouveau mot de passe avec validation
// visuelle des criteres en temps reel.
//
// Si succes, redirige vers /connexion avec message de succes.
// ============================================================

import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import PageAuth from '../../components/layout/PageAuth'
import './ReinitialiserMotDePasse.css'

// Criteres de validation (memes que pour l'inscription)
function validerMotDePasse(mdp: string) {
    return {
        longueur: mdp.length >= 10,
        majuscule: /[A-Z]/.test(mdp),
        minuscule: /[a-z]/.test(mdp),
        chiffre: /\d/.test(mdp),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(mdp),
    }
}

export default function ReinitialiserMotDePasse() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''

    const [motDePasse, setMotDePasse] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [afficherMdp, setAfficherMdp] = useState(false)
    const [afficherConfirm, setAfficherConfirm] = useState(false)
    const [chargement, setChargement] = useState(false)
    const [erreur, setErreur] = useState('')

    // Si pas de token dans l'URL, c'est une erreur
    useEffect(() => {
        if (!token) {
            setErreur('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.')
        }
    }, [token])

    const criteres = validerMotDePasse(motDePasse)
    const tousCriteresOk = Object.values(criteres).every(Boolean)
    const confirmationOk = motDePasse === confirmation && motDePasse !== ''

    async function soumettre(e: FormEvent) {
        e.preventDefault()
        setErreur('')

        if (!tousCriteresOk) {
            setErreur('Le mot de passe ne respecte pas tous les critères de sécurité.')
            return
        }
        if (!confirmationOk) {
            setErreur('Les deux mots de passe ne correspondent pas.')
            return
        }

        setChargement(true)
        try {
            await api.post('/api/auth/reinitialiser-mot-de-passe', {
                token,
                nouveauMotDePasse: motDePasse,
            })
            // Redirection avec message de succes
            navigate('/connexion', {
                state: { message: 'Mot de passe réinitialisé avec succès ! Vous pouvez vous connecter.' },
            })
        } catch (err: any) {
            setErreur(err.message || 'Erreur lors de la réinitialisation. Le lien est peut-être expiré.')
            setChargement(false)
        }
    }

    return (
        <PageAuth
            cotegauche={
                <div className="reinit-gauche">
                    <div className="reinit-logo">Vite & Gourmand</div>

                    <div className="reinit-icone-cercle" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>

                    <h2 className="titre-serif reinit-titre">
                        Sécurisez votre compte
                    </h2>
                    <p className="reinit-soustitre">
                        Créez un nouveau mot de passe robuste pour protéger vos informations
                    </p>

                    <ul className="reinit-conseils">
                        <li>
                            <div className="reinit-check" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>
                            <div>
                                <div className="reinit-conseil-titre">Minimum 10 caractères</div>
                                <div className="reinit-conseil-desc">Un mot de passe plus long est plus sécurisé</div>
                            </div>
                        </li>
                        <li>
                            <div className="reinit-check" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>
                            <div>
                                <div className="reinit-conseil-titre">Mélangez majuscules et minuscules</div>
                                <div className="reinit-conseil-desc">Combinez lettres en majuscule et minuscule</div>
                            </div>
                        </li>
                        <li>
                            <div className="reinit-check" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>
                            <div>
                                <div className="reinit-conseil-titre">Incluez chiffres et symboles</div>
                                <div className="reinit-conseil-desc">Ajoutez des chiffres (0-9) et caractères spéciaux (!@#$)</div>
                            </div>
                        </li>
                    </ul>

                    <div className="reinit-progression">
                        <span className="reinit-point"></span>
                        <span className="reinit-point"></span>
                        <span className="reinit-point active"></span>
                    </div>
                    <div className="reinit-etape-libelle">Étape 3 sur 3</div>
                </div>
            }
            cotedroit={
                <div className="page-auth-carte">
                    <h1 className="titre-serif reinit-titre-form">Définir un nouveau mot de passe</h1>
                    <p className="text-muted">
                        Choisissez un mot de passe fort et unique pour sécuriser votre compte
                    </p>

                    {/* Lien verifie (vert) */}
                    {token && !erreur && (
                        <div className="reinit-alert-succes mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="m9 11 3 3L22 4" />
                            </svg>
                            <div>
                                <strong>Lien vérifié</strong>
                                <div className="small">Votre demande de réinitialisation a été validée avec succès</div>
                            </div>
                        </div>
                    )}

                    {/* Erreur */}
                    {erreur && (
                        <div className="alert alert-danger" role="alert">
                            {erreur}
                        </div>
                    )}

                    <form onSubmit={soumettre} noValidate>
                        {/* Nouveau mot de passe */}
                        <div className="mb-3">
                            <label htmlFor="mdp" className="form-label fw-medium">
                                Nouveau mot de passe <span className="text-danger">*</span>
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
                                    id="mdp"
                                    className="form-control"
                                    placeholder="Entrez votre nouveau mot de passe"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    disabled={!token}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setAfficherMdp(!afficherMdp)}
                                    aria-label={afficherMdp ? 'Masquer' : 'Afficher'}
                                >
                                    {afficherMdp ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {/* Confirmation */}
                        <div className="mb-3">
                            <label htmlFor="confirm" className="form-label fw-medium">
                                Confirmer le mot de passe <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect width="18" height="11" x="3" y="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    type={afficherConfirm ? 'text' : 'password'}
                                    id="confirm"
                                    className="form-control"
                                    placeholder="Confirmez votre nouveau mot de passe"
                                    value={confirmation}
                                    onChange={(e) => setConfirmation(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    disabled={!token}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setAfficherConfirm(!afficherConfirm)}
                                    aria-label={afficherConfirm ? 'Masquer' : 'Afficher'}
                                >
                                    {afficherConfirm ? '🙈' : '👁'}
                                </button>
                            </div>
                            {confirmation !== '' && !confirmationOk && (
                                <div className="text-danger small mt-1">
                                    Les mots de passe ne correspondent pas
                                </div>
                            )}
                        </div>

                        {/* Criteres */}
                        <div className="reinit-criteres mb-3">
                            <div className="reinit-criteres-titre">Votre mot de passe doit contenir :</div>
                            <ul>
                                <li className={criteres.longueur ? 'valide' : ''}>
                                    <span className="reinit-marque">{criteres.longueur ? '✓' : '○'}</span>
                                    Au moins 10 caractères
                                </li>
                                <li className={criteres.majuscule ? 'valide' : ''}>
                                    <span className="reinit-marque">{criteres.majuscule ? '✓' : '○'}</span>
                                    Une lettre majuscule (A-Z)
                                </li>
                                <li className={criteres.minuscule ? 'valide' : ''}>
                                    <span className="reinit-marque">{criteres.minuscule ? '✓' : '○'}</span>
                                    Une lettre minuscule (a-z)
                                </li>
                                <li className={criteres.chiffre ? 'valide' : ''}>
                                    <span className="reinit-marque">{criteres.chiffre ? '✓' : '○'}</span>
                                    Un chiffre (0-9)
                                </li>
                                <li className={criteres.special ? 'valide' : ''}>
                                    <span className="reinit-marque">{criteres.special ? '✓' : '○'}</span>
                                    Un caractère spécial (!@#$%^&*)
                                </li>
                            </ul>
                        </div>

                        {/* Conseil securite */}
                        <div className="reinit-conseil-securite mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            <div>
                                <strong>Conseil de sécurité</strong>
                                <div className="small">
                                    Évitez d'utiliser des informations personnelles évidentes comme votre nom,
                                    date de naissance ou des mots du dictionnaire. Privilégiez une phrase secrète mémorable.
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2"
                            disabled={chargement || !tousCriteresOk || !confirmationOk || !token}
                        >
                            {chargement ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Modification en cours...
                                </>
                            ) : (
                                <>
                                    🔒 Définir mon nouveau mot de passe
                                </>
                            )}
                        </button>
                    </form>

                    <div className="reinit-separateur">
                        <span>ou</span>
                    </div>

                    <div className="text-center">
                        <Link to="/connexion" className="reinit-lien-retour">
                            ← Se connecter
                        </Link>
                    </div>

                    <div className="text-center text-muted small mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" aria-hidden="true">
                            <rect width="18" height="11" x="3" y="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Connexion sécurisée avec chiffrement SSL
                    </div>
                </div>
            }
        />
    )
}
