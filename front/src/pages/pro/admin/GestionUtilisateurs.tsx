// Gestion des utilisateurs - admin uniquement.
// Liste filtrable + creation de compte employe + active/desactive.

import { useState, useEffect, useMemo } from 'react'
import type { FormEvent } from 'react'
import { Plus, UserCog, Search, ShieldCheck, ShieldOff, Eye, EyeOff } from 'lucide-react'
import { api } from '../../../services/api'
import './GestionUtilisateurs.css'

interface UtilisateurListe {
    utilisateur_id: number
    email: string
    nom: string
    prenom: string
    telephone?: string
    ville?: string
    actif: boolean
    date_creation: string
    role: string
}

export default function GestionUtilisateurs() {
    const [utilisateurs, setUtilisateurs] = useState<UtilisateurListe[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)

    // Filtres
    const [recherche, setRecherche] = useState('')
    const [filtreRole, setFiltreRole] = useState<string>('')
    const [filtreActif, setFiltreActif] = useState<string>('')

    // Modale creation employe
    const [modaleOuverte, setModaleOuverte] = useState(false)
    const [formEmail, setFormEmail] = useState('')
    const [formMdp, setFormMdp] = useState('')
    const [formPrenom, setFormPrenom] = useState('')
    const [formNom, setFormNom] = useState('')
    const [formTelephone, setFormTelephone] = useState('')
    const [afficherMdp, setAfficherMdp] = useState(false)
    const [enregistrement, setEnregistrement] = useState(false)
    const [erreurForm, setErreurForm] = useState<string | null>(null)

    // En cours de modification (pour griser le bouton)
    const [enModification, setEnModification] = useState<Set<number>>(new Set())

    async function charger() {
        try {
            setChargement(true)
            setErreur(null)
            const data = await api.get<{ utilisateurs: UtilisateurListe[] }>('/api/utilisateurs')
            setUtilisateurs(data.utilisateurs || [])
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger les utilisateurs.')
        } finally {
            setChargement(false)
        }
    }

    useEffect(() => {
        charger()
    }, [])

    function afficherSucces(msg: string) {
        setMessageOk(msg)
        setTimeout(() => setMessageOk(null), 3500)
    }

    // Comptages
    const compteurs = useMemo(() => {
        const total = utilisateurs.length
        const employes = utilisateurs.filter((u) => u.role === 'employe').length
        const admins = utilisateurs.filter((u) => u.role === 'administrateur').length
        const clients = utilisateurs.filter((u) => u.role === 'utilisateur').length
        return { total, employes, admins, clients }
    }, [utilisateurs])

    // Filtrage
    const utilisateursFiltres = useMemo(() => {
        return utilisateurs.filter((u) => {
            if (recherche.trim()) {
                const q = recherche.toLowerCase()
                const match =
                    u.email.toLowerCase().includes(q) ||
                    u.nom.toLowerCase().includes(q) ||
                    u.prenom.toLowerCase().includes(q)
                if (!match) return false
            }
            if (filtreRole && u.role !== filtreRole) return false
            if (filtreActif === 'actif' && !u.actif) return false
            if (filtreActif === 'inactif' && u.actif) return false
            return true
        })
    }, [utilisateurs, recherche, filtreRole, filtreActif])

    async function basculerActif(u: UtilisateurListe) {
        try {
            setEnModification((prev) => new Set(prev).add(u.utilisateur_id))
            const action = u.actif ? 'desactiver' : 'reactiver'
            await api.put(`/api/utilisateurs/${u.utilisateur_id}/${action}`)
            setUtilisateurs((prev) =>
                prev.map((x) =>
                    x.utilisateur_id === u.utilisateur_id ? { ...x, actif: !x.actif } : x
                )
            )
            afficherSucces(u.actif ? 'Compte désactivé' : 'Compte réactivé')
        } catch (err: any) {
            setErreur(err?.message || 'Erreur lors de la modification.')
        } finally {
            setEnModification((prev) => {
                const newSet = new Set(prev)
                newSet.delete(u.utilisateur_id)
                return newSet
            })
        }
    }

    function ouvrirModale() {
        setFormEmail('')
        setFormMdp('')
        setFormPrenom('')
        setFormNom('')
        setFormTelephone('')
        setErreurForm(null)
        setAfficherMdp(false)
        setModaleOuverte(true)
    }

    function validerMotDePasse(mdp: string): string | null {
        // Meme regex que le back
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/
        if (!regex.test(mdp)) {
            return 'Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
        }
        return null
    }

    async function creerEmploye(e: FormEvent) {
        e.preventDefault()
        setErreurForm(null)
        const erreurMdp = validerMotDePasse(formMdp)
        if (erreurMdp) {
            setErreurForm(erreurMdp)
            return
        }
        try {
            setEnregistrement(true)
            await api.post('/api/utilisateurs/employe', {
                email: formEmail.trim(),
                motDePasse: formMdp,
                prenom: formPrenom.trim(),
                nom: formNom.trim(),
                telephone: formTelephone.trim() || undefined,
            })
            setModaleOuverte(false)
            afficherSucces('Compte employé créé')
            await charger()
        } catch (err: any) {
            setErreurForm(err?.message || "Erreur lors de la création.")
        } finally {
            setEnregistrement(false)
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
        <div className="gestion-utilisateurs">
            <header className="gu-entete">
                <div>
                    <h1 className="titre-serif gu-titre">Gestion des utilisateurs</h1>
                    <p className="gu-sous-titre">
                        Créez des comptes employés et gérez les accès
                    </p>
                </div>
                <button type="button" onClick={ouvrirModale} className="btn btn-primary">
                    <Plus size={16} className="me-2" />
                    Créer un compte employé
                </button>
            </header>

            {messageOk && (
                <div className="alert alert-success" role="status" aria-live="polite">
                    {messageOk}
                </div>
            )}
            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {/* Pilules compteurs */}
            <div className="gu-pilules">
                <div className="gu-pilule">
                    <strong>{compteurs.total}</strong> Total
                </div>
                <div className="gu-pilule gu-pilule--bordeaux">
                    <strong>{compteurs.admins}</strong> Administrateurs
                </div>
                <div className="gu-pilule gu-pilule--sauge">
                    <strong>{compteurs.employes}</strong> Employés
                </div>
                <div className="gu-pilule gu-pilule--bleu">
                    <strong>{compteurs.clients}</strong> Clients
                </div>
            </div>

            {/* Filtres */}
            <section className="gu-filtres">
                <div className="gu-filtre-recherche">
                    <Search size={16} className="gu-filtre-icone" />
                    <input
                        type="search"
                        placeholder="Rechercher par nom, prénom, email..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="form-control"
                    />
                </div>
                <select
                    value={filtreRole}
                    onChange={(e) => setFiltreRole(e.target.value)}
                    className="form-select"
                    aria-label="Rôle"
                >
                    <option value="">Tous les rôles</option>
                    <option value="administrateur">Administrateur</option>
                    <option value="employe">Employé</option>
                    <option value="utilisateur">Client</option>
                </select>
                <select
                    value={filtreActif}
                    onChange={(e) => setFiltreActif(e.target.value)}
                    className="form-select"
                    aria-label="Statut"
                >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actifs</option>
                    <option value="inactif">Désactivés</option>
                </select>
            </section>

            {/* Table */}
            <section className="gu-table-bloc">
                <div className="table-responsive">
                    <table className="gu-table">
                        <thead>
                            <tr>
                                <th>UTILISATEUR</th>
                                <th>EMAIL</th>
                                <th>RÔLE</th>
                                <th>DATE CRÉATION</th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {utilisateursFiltres.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted py-4">
                                        Aucun utilisateur ne correspond aux filtres.
                                    </td>
                                </tr>
                            ) : (
                                utilisateursFiltres.map((u) => (
                                    <tr key={u.utilisateur_id} className={!u.actif ? 'gu-row-inactif' : ''}>
                                        <td>
                                            <div className="gu-utilisateur">
                                                <div className="gu-avatar" aria-hidden="true">
                                                    {u.prenom?.[0]?.toUpperCase()}
                                                    {u.nom?.[0]?.toUpperCase()}
                                                </div>
                                                <strong>
                                                    {u.prenom} {u.nom}
                                                </strong>
                                            </div>
                                        </td>
                                        <td className="gu-email">{u.email}</td>
                                        <td>
                                            <span className={`gu-badge-role gu-badge-role--${u.role}`}>
                                                {u.role === 'administrateur'
                                                    ? 'Administrateur'
                                                    : u.role === 'employe'
                                                      ? 'Employé'
                                                      : 'Client'}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(u.date_creation).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td>
                                            {u.actif ? (
                                                <span className="gu-statut gu-statut--actif">Actif</span>
                                            ) : (
                                                <span className="gu-statut gu-statut--inactif">Désactivé</span>
                                            )}
                                        </td>
                                        <td>
                                            {u.role !== 'administrateur' && (
                                                <button
                                                    type="button"
                                                    onClick={() => basculerActif(u)}
                                                    disabled={enModification.has(u.utilisateur_id)}
                                                    className={
                                                        u.actif
                                                            ? 'btn btn-outline-danger btn-sm'
                                                            : 'btn btn-success btn-sm'
                                                    }
                                                >
                                                    {u.actif ? (
                                                        <>
                                                            <ShieldOff size={14} className="me-1" />
                                                            Désactiver
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck size={14} className="me-1" />
                                                            Réactiver
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {u.role === 'administrateur' && (
                                                <span className="text-muted small">
                                                    <UserCog size={12} className="me-1" />
                                                    Compte protégé
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="gu-table-footer">
                    <strong>{utilisateursFiltres.length}</strong> sur {utilisateurs.length} utilisateurs
                </div>
            </section>

            {/* Modale creation employe */}
            {modaleOuverte && (
                <div
                    className="gu-modale-overlay"
                    onClick={() => setModaleOuverte(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="gu-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Créer un compte employé</h3>
                        <p className="text-muted small">
                            L'employé pourra se connecter avec ces identifiants. Communiquez-les-lui en
                            sécurité.
                        </p>

                        {erreurForm && (
                            <div className="alert alert-danger" role="alert">
                                {erreurForm}
                            </div>
                        )}

                        <form onSubmit={creerEmploye}>
                            <div className="row g-3">
                                <div className="col-6">
                                    <label htmlFor="emp-prenom" className="form-label fw-medium">
                                        Prénom *
                                    </label>
                                    <input
                                        id="emp-prenom"
                                        type="text"
                                        className="form-control"
                                        value={formPrenom}
                                        onChange={(e) => setFormPrenom(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <label htmlFor="emp-nom" className="form-label fw-medium">
                                        Nom *
                                    </label>
                                    <input
                                        id="emp-nom"
                                        type="text"
                                        className="form-control"
                                        value={formNom}
                                        onChange={(e) => setFormNom(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="emp-email" className="form-label fw-medium">
                                        Email *
                                    </label>
                                    <input
                                        id="emp-email"
                                        type="email"
                                        className="form-control"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="prenom.nom@vitegourmand.fr"
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="emp-mdp" className="form-label fw-medium">
                                        Mot de passe initial *
                                    </label>
                                    <div className="position-relative">
                                        <input
                                            id="emp-mdp"
                                            type={afficherMdp ? 'text' : 'password'}
                                            className="form-control"
                                            value={formMdp}
                                            onChange={(e) => setFormMdp(e.target.value)}
                                            required
                                            style={{ paddingRight: 40 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAfficherMdp((v) => !v)}
                                            className="gu-mdp-toggle"
                                            aria-label={afficherMdp ? 'Cacher' : 'Afficher'}
                                        >
                                            {afficherMdp ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <div className="form-text">
                                        10 caractères min, dont une majuscule, une minuscule, un chiffre,
                                        un caractère spécial.
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label htmlFor="emp-tel" className="form-label fw-medium">
                                        Téléphone (optionnel)
                                    </label>
                                    <input
                                        id="emp-tel"
                                        type="tel"
                                        className="form-control"
                                        value={formTelephone}
                                        onChange={(e) => setFormTelephone(e.target.value)}
                                        placeholder="06 12 34 56 78"
                                    />
                                </div>
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button
                                    type="button"
                                    onClick={() => setModaleOuverte(false)}
                                    className="btn btn-outline-primary"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={enregistrement}
                                >
                                    {enregistrement ? 'Création…' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
