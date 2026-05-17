// ============================================================
// PAGE INSCRIPTION
//
// Maquette : split-screen avec slider de features a gauche,
// formulaire d'inscription a droite (3 sections : Infos perso,
// Securite, Adresse de livraison).
//
// Validation visuelle du mot de passe en temps reel (les v verts).
// Apres inscription reussie, redirige vers /connexion avec message.
// ============================================================

import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import PageAuth from '../../components/layout/PageAuth'
import './Inscription.css'

// Features mises en avant a gauche (slider)
const features = [
    {
        titre: 'Commandes simplifiées',
        description: 'Passez vos commandes en quelques clics et gérez vos préférences',
    },
    {
        titre: 'Suivi en temps réel',
        description: 'Suivez vos commandes et livraisons en direct',
    },
    {
        titre: 'Avantages groupes',
        description: 'Bénéficiez de tarifs préférentiels pour vos événements',
    },
    {
        titre: 'Actualités exclusives',
        description: 'Recevez nos nouveautés et offres spéciales en avant-première',
    },
]

// Criteres de validation du mot de passe
function validerMotDePasse(mdp: string) {
    return {
        longueur: mdp.length >= 10,
        majuscule: /[A-Z]/.test(mdp),
        minuscule: /[a-z]/.test(mdp),
        chiffre: /\d/.test(mdp),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(mdp),
    }
}

export default function Inscription() {
    const navigate = useNavigate()

    // Champs du formulaire
    const [prenom, setPrenom] = useState('')
    const [nom, setNom] = useState('')
    const [email, setEmail] = useState('')
    const [telephone, setTelephone] = useState('')
    const [motDePasse, setMotDePasse] = useState('')
    const [confirmationMdp, setConfirmationMdp] = useState('')
    const [afficherMdp, setAfficherMdp] = useState(false)
    const [afficherConfirm, setAfficherConfirm] = useState(false)
    const [adresse, setAdresse] = useState('')
    const [ville, setVille] = useState('')
    const [codePostal, setCodePostal] = useState('')
    const [pays, setPays] = useState('France')
    const [accepteCGV, setAccepteCGV] = useState(false)
    const [accepteNewsletter, setAccepteNewsletter] = useState(false)

    // Etat global
    const [chargement, setChargement] = useState(false)
    const [erreur, setErreur] = useState('')

    // Slider features
    const [indexFeature, setIndexFeature] = useState(0)

    useEffect(() => {
        const intervalle = setInterval(() => {
            setIndexFeature((i) => (i + 1) % features.length)
        }, 4000)
        return () => clearInterval(intervalle)
    }, [])

    const criteres = validerMotDePasse(motDePasse)
    const tousCriteresOk = Object.values(criteres).every(Boolean)
    const confirmationOk = motDePasse === confirmationMdp && motDePasse !== ''

    async function soumettre(e: FormEvent) {
        e.preventDefault()
        setErreur('')

        // Validations finales
        if (!tousCriteresOk) {
            setErreur('Le mot de passe ne respecte pas tous les critères de sécurité.')
            return
        }
        if (!confirmationOk) {
            setErreur('Les deux mots de passe ne correspondent pas.')
            return
        }
        if (!accepteCGV) {
            setErreur('Vous devez accepter les Conditions Générales pour créer un compte.')
            return
        }

        setChargement(true)
        try {
            // Compose l'adresse postale complete pour le back
            const adressePostale = `${adresse}, ${codePostal} ${ville}, ${pays}`

            await api.post('/api/auth/inscription', {
                email,
                motDePasse,
                nom,
                prenom,
                telephone,
                ville,
                pays,
                adressePostale,
                notifNewsletter: accepteNewsletter,
                notifOffres: accepteNewsletter, // par convention, newsletter coche aussi offres
                notifConseils: false,
            })

            // Succes : redirection vers la connexion avec message
            navigate('/connexion', {
                state: { message: 'Compte créé avec succès ! Vous pouvez vous connecter.' },
            })
        } catch (err: any) {
            setErreur(err.message || 'Erreur lors de la création du compte.')
            setChargement(false)
        }
    }

    const feature = features[indexFeature]

    return (
        <PageAuth
            cotegauche={
                <div className="inscription-features">
                    <div className="inscription-logo-gauche">Vite & Gourmand</div>

                    <h2 className="titre-serif inscription-titre-gauche">
                        Rejoignez notre<br />
                        communauté gourmande
                    </h2>
                    <p className="inscription-soustitre-gauche">
                        Créez votre compte et profitez d'une expérience gastronomique unique
                    </p>

                    {/* Liste des features (toutes affichees, celle active mise en avant) */}
                    <ul className="inscription-liste-features">
                        {features.map((f, i) => (
                            <li
                                key={i}
                                className={`inscription-feature ${i === indexFeature ? 'active' : ''}`}
                            >
                                <div className="inscription-feature-icone" aria-hidden="true">
                                    {/* Icone simple selon l'index */}
                                    {i === 0 && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18l-2 9H5l-2-9Z"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/></svg>
                                    )}
                                    {i === 1 && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/><path d="m9 16 3 3 5-5"/></svg>
                                    )}
                                    {i === 2 && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    )}
                                    {i === 3 && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                                    )}
                                </div>
                                <div className="inscription-feature-contenu">
                                    <div className="inscription-feature-titre">{f.titre}</div>
                                    <div className="inscription-feature-desc">{f.description}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Pagination */}
                    <div className="inscription-pagination">
                        {features.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndexFeature(i)}
                                className={`inscription-puce ${i === indexFeature ? 'active' : ''}`}
                                aria-label={`Feature ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            }
            cotedroit={
                <div className="page-auth-carte inscription-carte">
                    <h1 className="titre-serif inscription-titre">Créer mon compte</h1>
                    <p className="text-muted">Remplissez le formulaire pour rejoindre Vite & Gourmand</p>

                    {erreur && (
                        <div className="alert alert-danger" role="alert">
                            {erreur}
                        </div>
                    )}

                    <form onSubmit={soumettre} noValidate>
                        {/* === SECTION 1 : INFORMATIONS PERSONNELLES === */}
                        <div className="inscription-section-label">
                            <span>INFORMATIONS PERSONNELLES</span>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="prenom" className="form-label">
                                    Prénom <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="prenom"
                                    className="form-control"
                                    placeholder="Jean"
                                    value={prenom}
                                    onChange={(e) => setPrenom(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="nom" className="form-label">
                                    Nom <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nom"
                                    className="form-control"
                                    placeholder="Dupont"
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email <span className="text-danger">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="form-control"
                                placeholder="jean.dupont@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                            <div className="form-text">Nous utiliserons cet email pour vous contacter</div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="telephone" className="form-label">
                                Téléphone <span className="text-danger">*</span>
                            </label>
                            <input
                                type="tel"
                                id="telephone"
                                className="form-control"
                                placeholder="06 12 34 56 78"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                required
                                autoComplete="tel"
                            />
                        </div>

                        {/* === SECTION 2 : SECURITE === */}
                        <div className="inscription-section-label">
                            <span>SÉCURITÉ</span>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="mdp" className="form-label">
                                Mot de passe <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type={afficherMdp ? 'text' : 'password'}
                                    id="mdp"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                    autoComplete="new-password"
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

                        <div className="mb-3">
                            <label htmlFor="confirm" className="form-label">
                                Confirmer le mot de passe <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type={afficherConfirm ? 'text' : 'password'}
                                    id="confirm"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={confirmationMdp}
                                    onChange={(e) => setConfirmationMdp(e.target.value)}
                                    required
                                    autoComplete="new-password"
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
                            {confirmationMdp !== '' && !confirmationOk && (
                                <div className="text-danger small mt-1">
                                    Les mots de passe ne correspondent pas
                                </div>
                            )}
                        </div>

                        {/* Validation visuelle des criteres */}
                        <div className="inscription-criteres mb-4">
                            <div className="inscription-criteres-titre">Votre mot de passe doit contenir :</div>
                            <ul>
                                <li className={criteres.longueur ? 'valide' : ''}>
                                    <span className="inscription-critere-marque">{criteres.longueur ? '✓' : '○'}</span>
                                    Au moins 10 caractères
                                </li>
                                <li className={criteres.majuscule ? 'valide' : ''}>
                                    <span className="inscription-critere-marque">{criteres.majuscule ? '✓' : '○'}</span>
                                    Une lettre majuscule (A-Z)
                                </li>
                                <li className={criteres.minuscule ? 'valide' : ''}>
                                    <span className="inscription-critere-marque">{criteres.minuscule ? '✓' : '○'}</span>
                                    Une lettre minuscule (a-z)
                                </li>
                                <li className={criteres.chiffre ? 'valide' : ''}>
                                    <span className="inscription-critere-marque">{criteres.chiffre ? '✓' : '○'}</span>
                                    Un chiffre (0-9)
                                </li>
                                <li className={criteres.special ? 'valide' : ''}>
                                    <span className="inscription-critere-marque">{criteres.special ? '✓' : '○'}</span>
                                    Un caractère spécial (!@#$%^&*)
                                </li>
                            </ul>
                        </div>

                        {/* === SECTION 3 : ADRESSE DE LIVRAISON === */}
                        <div className="inscription-section-label">
                            <span>ADRESSE DE LIVRAISON</span>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="adresse" className="form-label">
                                Adresse <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="adresse"
                                className="form-control"
                                placeholder="15 Rue des Remparts"
                                value={adresse}
                                onChange={(e) => setAdresse(e.target.value)}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="ville" className="form-label">
                                    Ville <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ville"
                                    className="form-control"
                                    placeholder="Bordeaux"
                                    value={ville}
                                    onChange={(e) => setVille(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="cp" className="form-label">
                                    Code postal <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="cp"
                                    className="form-control"
                                    placeholder="33000"
                                    value={codePostal}
                                    onChange={(e) => setCodePostal(e.target.value)}
                                    required
                                    pattern="[0-9]{5}"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="pays" className="form-label">
                                Pays <span className="text-danger">*</span>
                            </label>
                            <select
                                id="pays"
                                className="form-select"
                                value={pays}
                                onChange={(e) => setPays(e.target.value)}
                                required
                            >
                                <option value="France">France</option>
                                <option value="Belgique">Belgique</option>
                                <option value="Suisse">Suisse</option>
                                <option value="Luxembourg">Luxembourg</option>
                            </select>
                        </div>

                        {/* === CONSENTEMENTS === */}
                        <div className="inscription-section-label">
                            <span>CONSENTEMENTS</span>
                        </div>

                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                id="cgv"
                                className="form-check-input"
                                checked={accepteCGV}
                                onChange={(e) => setAccepteCGV(e.target.checked)}
                                required
                            />
                            <label htmlFor="cgv" className="form-check-label">
                                J'accepte les{' '}
                                <Link to="/cgv" target="_blank">Conditions Générales</Link>
                                {' '}et la{' '}
                                <Link to="/confidentialite" target="_blank">Politique de confidentialité</Link>
                                {' '}<span className="text-danger">*</span>
                            </label>
                        </div>

                        <div className="form-check mb-4">
                            <input
                                type="checkbox"
                                id="newsletter"
                                className="form-check-input"
                                checked={accepteNewsletter}
                                onChange={(e) => setAccepteNewsletter(e.target.checked)}
                            />
                            <label htmlFor="newsletter" className="form-check-label">
                                Je souhaite recevoir les actualités, offres spéciales et nouveautés de Vite & Gourmand
                            </label>
                        </div>

                        {/* Bouton submit */}
                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 inscription-bouton-submit"
                            disabled={chargement || !tousCriteresOk || !confirmationOk || !accepteCGV}
                        >
                            {chargement ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    ✓ Créer mon compte
                                </>
                            )}
                        </button>
                    </form>

                    {/* Lien vers connexion */}
                    <div className="text-center mt-4">
                        <span className="text-muted">Vous avez déjà un compte ?</span>
                        <br />
                        <Link to="/connexion" className="inscription-lien-connexion">
                            Se connecter
                        </Link>
                    </div>
                </div>
            }
        />
    )
}
