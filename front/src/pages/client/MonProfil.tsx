// Page Mon Profil cote client.
// Modifier infos + changer mot de passe.

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Save, Eye, EyeOff, Lock, User } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import './MonComptePages.css'

interface Profil {
    utilisateur_id: number
    email: string
    nom: string
    prenom: string
    telephone?: string
    ville?: string
    pays?: string
    adresse_postale?: string
}

export default function MonProfil() {
    const { rafraichirProfil } = useAuth()

    // Form profil
    const [nom, setNom] = useState('')
    const [prenom, setPrenom] = useState('')
    const [telephone, setTelephone] = useState('')
    const [ville, setVille] = useState('')
    const [pays, setPays] = useState('')
    const [adressePostale, setAdressePostale] = useState('')
    const [email, setEmail] = useState('')

    // Form mot de passe
    const [ancienMdp, setAncienMdp] = useState('')
    const [nouveauMdp, setNouveauMdp] = useState('')
    const [confirmerMdp, setConfirmerMdp] = useState('')
    const [afficherMdp, setAfficherMdp] = useState(false)

    // UI
    const [chargement, setChargement] = useState(true)
    const [enregistrementProfil, setEnregistrementProfil] = useState(false)
    const [enregistrementMdp, setEnregistrementMdp] = useState(false)
    const [erreurProfil, setErreurProfil] = useState<string | null>(null)
    const [erreurMdp, setErreurMdp] = useState<string | null>(null)
    const [messageOkProfil, setMessageOkProfil] = useState<string | null>(null)
    const [messageOkMdp, setMessageOkMdp] = useState<string | null>(null)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                const data = await api.get<{ utilisateur: Profil }>('/api/utilisateurs/profil')
                const u = data.utilisateur
                setEmail(u.email)
                setNom(u.nom || '')
                setPrenom(u.prenom || '')
                setTelephone(u.telephone || '')
                setVille(u.ville || '')
                setPays(u.pays || '')
                setAdressePostale(u.adresse_postale || '')
            } catch (err: any) {
                setErreurProfil(err?.message || 'Impossible de charger votre profil.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    async function sauvegarderProfil(e: FormEvent) {
        e.preventDefault()
        setErreurProfil(null)
        if (!nom.trim() || !prenom.trim()) {
            setErreurProfil('Le nom et le prénom sont obligatoires.')
            return
        }
        try {
            setEnregistrementProfil(true)
            await api.put('/api/utilisateurs/profil', {
                nom: nom.trim(),
                prenom: prenom.trim(),
                telephone: telephone.trim() || null,
                ville: ville.trim() || null,
                pays: pays.trim() || null,
                adressePostale: adressePostale.trim() || null,
            })
            await rafraichirProfil()
            setMessageOkProfil('Profil mis à jour avec succès')
            setTimeout(() => setMessageOkProfil(null), 3500)
        } catch (err: any) {
            setErreurProfil(err?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setEnregistrementProfil(false)
        }
    }

    function validerMdp(mdp: string): string | null {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/
        if (!regex.test(mdp)) {
            return 'Le mot de passe doit contenir au moins 10 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.'
        }
        return null
    }

    async function changerMotDePasse(e: FormEvent) {
        e.preventDefault()
        setErreurMdp(null)
        if (nouveauMdp !== confirmerMdp) {
            setErreurMdp('Les deux mots de passe ne correspondent pas.')
            return
        }
        const erreurValidation = validerMdp(nouveauMdp)
        if (erreurValidation) {
            setErreurMdp(erreurValidation)
            return
        }
        try {
            setEnregistrementMdp(true)
            await api.put('/api/utilisateurs/mot-de-passe', {
                ancienMotDePasse: ancienMdp,
                nouveauMotDePasse: nouveauMdp,
            })
            setAncienMdp('')
            setNouveauMdp('')
            setConfirmerMdp('')
            setMessageOkMdp('Mot de passe changé avec succès')
            setTimeout(() => setMessageOkMdp(null), 3500)
        } catch (err: any) {
            setErreurMdp(err?.message || 'Erreur lors du changement de mot de passe.')
        } finally {
            setEnregistrementMdp(false)
        }
    }

    if (chargement) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="mc-page">
            <h1 className="titre-serif mc-titre">Mon profil</h1>
            <p className="mc-sous-titre">Gérez vos informations personnelles</p>

            {/* Form profil */}
            <section className="mc-carte">
                <h2 className="titre-serif mc-carte-titre">
                    <User size={18} aria-hidden="true" className="me-2" />
                    Informations personnelles
                </h2>

                {messageOkProfil && (
                    <div className="alert alert-success" role="status" aria-live="polite">
                        {messageOkProfil}
                    </div>
                )}
                {erreurProfil && (
                    <div className="alert alert-danger" role="alert">
                        {erreurProfil}
                    </div>
                )}

                <form onSubmit={sauvegarderProfil}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="profil-prenom" className="form-label fw-medium">
                                Prénom *
                            </label>
                            <input
                                id="profil-prenom"
                                type="text"
                                className="form-control"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="profil-nom" className="form-label fw-medium">
                                Nom *
                            </label>
                            <input
                                id="profil-nom"
                                type="text"
                                className="form-control"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <label htmlFor="profil-email" className="form-label fw-medium">
                                Email
                            </label>
                            <input
                                id="profil-email"
                                type="email"
                                className="form-control"
                                value={email}
                                disabled
                            />
                            <div className="form-text">
                                Pour changer votre email, contactez notre équipe.
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="profil-tel" className="form-label fw-medium">
                                Téléphone
                            </label>
                            <input
                                id="profil-tel"
                                type="tel"
                                className="form-control"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                placeholder="06 12 34 56 78"
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="profil-ville" className="form-label fw-medium">
                                Ville
                            </label>
                            <input
                                id="profil-ville"
                                type="text"
                                className="form-control"
                                value={ville}
                                onChange={(e) => setVille(e.target.value)}
                                placeholder="Bordeaux"
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="profil-pays" className="form-label fw-medium">
                                Pays
                            </label>
                            <input
                                id="profil-pays"
                                type="text"
                                className="form-control"
                                value={pays}
                                onChange={(e) => setPays(e.target.value)}
                                placeholder="France"
                            />
                        </div>
                        <div className="col-12">
                            <label htmlFor="profil-adresse" className="form-label fw-medium">
                                Adresse postale
                            </label>
                            <input
                                id="profil-adresse"
                                type="text"
                                className="form-control"
                                value={adressePostale}
                                onChange={(e) => setAdressePostale(e.target.value)}
                                placeholder="12 rue de la République"
                            />
                        </div>
                    </div>
                    <div className="text-end mt-3">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={enregistrementProfil}
                        >
                            <Save size={16} className="me-2" />
                            {enregistrementProfil ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Form mot de passe */}
            <section className="mc-carte">
                <h2 className="titre-serif mc-carte-titre">
                    <Lock size={18} aria-hidden="true" className="me-2" />
                    Changer mon mot de passe
                </h2>

                {messageOkMdp && (
                    <div className="alert alert-success" role="status" aria-live="polite">
                        {messageOkMdp}
                    </div>
                )}
                {erreurMdp && (
                    <div className="alert alert-danger" role="alert">
                        {erreurMdp}
                    </div>
                )}

                <form onSubmit={changerMotDePasse}>
                    <div className="row g-3">
                        <div className="col-12">
                            <label htmlFor="mdp-ancien" className="form-label fw-medium">
                                Mot de passe actuel *
                            </label>
                            <input
                                id="mdp-ancien"
                                type={afficherMdp ? 'text' : 'password'}
                                className="form-control"
                                value={ancienMdp}
                                onChange={(e) => setAncienMdp(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="mdp-nouveau" className="form-label fw-medium">
                                Nouveau mot de passe *
                            </label>
                            <input
                                id="mdp-nouveau"
                                type={afficherMdp ? 'text' : 'password'}
                                className="form-control"
                                value={nouveauMdp}
                                onChange={(e) => setNouveauMdp(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="mdp-confirmer" className="form-label fw-medium">
                                Confirmer le nouveau *
                            </label>
                            <input
                                id="mdp-confirmer"
                                type={afficherMdp ? 'text' : 'password'}
                                className="form-control"
                                value={confirmerMdp}
                                onChange={(e) => setConfirmerMdp(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <button
                                type="button"
                                onClick={() => setAfficherMdp((v) => !v)}
                                className="btn btn-link p-0 text-decoration-none"
                            >
                                {afficherMdp ? (
                                    <>
                                        <EyeOff size={14} className="me-1" />
                                        Cacher les mots de passe
                                    </>
                                ) : (
                                    <>
                                        <Eye size={14} className="me-1" />
                                        Afficher les mots de passe
                                    </>
                                )}
                            </button>
                            <div className="form-text">
                                10 caractères min, dont une majuscule, une minuscule, un chiffre et
                                un caractère spécial.
                            </div>
                        </div>
                    </div>
                    <div className="text-end mt-3">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                enregistrementMdp ||
                                !ancienMdp ||
                                !nouveauMdp ||
                                !confirmerMdp
                            }
                        >
                            <Save size={16} className="me-2" />
                            {enregistrementMdp ? 'Changement…' : 'Changer le mot de passe'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
