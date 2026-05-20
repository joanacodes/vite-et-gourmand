// Detail d'une commande cote client.
// Voir + annuler (si en_attente) + donner un avis (si livre/terminee).

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Truck,
    ChevronRight,
    AlertTriangle,
    Star,
    Check,
} from 'lucide-react'
import { api } from '../../services/api'
import type { Commande } from '../../types'
import './MonComptePages.css'

const LABELS_STATUT: Record<string, string> = {
    en_attente: 'En attente',
    accepte: 'Acceptée',
    en_preparation: 'En préparation',
    en_cours_livraison: 'En livraison',
    livre: 'Livrée',
    attente_retour_materiel: 'En cours de retour matériel',
    terminee: 'Terminée',
    annulee: 'Annulée',
}

interface HistoriqueEntree {
    historique_id?: number
    statut: string
    date_modification: string
    commentaire?: string
}

interface AvisExistant {
    avis_id: number
    note: number
    description: string
    statut: string
}

export default function DetailCommandeClient() {
    const { numero } = useParams<{ numero: string }>()
    const navigate = useNavigate()

    const [commande, setCommande] = useState<Commande | null>(null)
    const [historique, setHistorique] = useState<HistoriqueEntree[]>([])
    const [avisExistant, setAvisExistant] = useState<AvisExistant | null>(null)
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)

    // Annulation
    const [modaleAnnulation, setModaleAnnulation] = useState(false)
    const [motifAnnulation, setMotifAnnulation] = useState('')
    const [modeContact, setModeContact] = useState('telephone_et_email')
    const [annulationEnCours, setAnnulationEnCours] = useState(false)

    // Avis
    const [modaleAvis, setModaleAvis] = useState(false)
    const [note, setNote] = useState(5)
    const [commentaire, setCommentaire] = useState('')
    const [envoiAvis, setEnvoiAvis] = useState(false)

    async function charger() {
        if (!numero) return
        try {
            setChargement(true)
            setErreur(null)
            const [cmdData, histData] = await Promise.all([
                api.get<{ commande: Commande }>(`/api/commandes/${numero}`),
                api.get<{ historique: HistoriqueEntree[] }>(`/api/commandes/${numero}/historique`),
            ])
            setCommande(cmdData.commande)
            setHistorique(histData.historique || [])

            // Tente de recuperer un avis deja existant pour cette commande
            // (le back renvoie le statut de l'avis pour qu'on sache si on peut en redonner un)
            try {
                const avisData = await api.get<{ avis: AvisExistant[] }>(
                    `/api/avis?numeroCommande=${numero}`
                )
                if (avisData.avis && avisData.avis.length > 0) {
                    setAvisExistant(avisData.avis[0])
                }
            } catch {
                // Pas grave si pas d'avis trouve
            }
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger la commande.')
        } finally {
            setChargement(false)
        }
    }

    useEffect(() => {
        charger()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numero])

    function afficherSucces(msg: string) {
        setMessageOk(msg)
        setTimeout(() => setMessageOk(null), 3500)
    }

    async function confirmerAnnulation() {
        if (!motifAnnulation.trim()) return
        try {
            setAnnulationEnCours(true)
            await api.put(`/api/commandes/${numero}/annuler`, {
                motifAnnulation,
                modeContactAnnulation: modeContact,
            })
            setModaleAnnulation(false)
            await charger()
            afficherSucces('Votre commande a bien été annulée')
        } catch (err: any) {
            setErreur(err?.message || "Impossible d'annuler la commande.")
        } finally {
            setAnnulationEnCours(false)
        }
    }

    async function envoyerAvis(e: FormEvent) {
        e.preventDefault()
        if (note < 1 || note > 5 || !commentaire.trim()) return
        try {
            setEnvoiAvis(true)
            await api.post('/api/avis', {
                numeroCommande: numero,
                note,
                description: commentaire.trim(),
            })
            setModaleAvis(false)
            await charger()
            afficherSucces('Avis envoyé ! Il sera publié après validation.')
        } catch (err: any) {
            setErreur(err?.message || "Impossible d'envoyer votre avis.")
        } finally {
            setEnvoiAvis(false)
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

    if (!commande) {
        return (
            <div>
                <div className="alert alert-danger" role="alert">
                    {erreur || 'Commande introuvable.'}
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/mon-compte/commandes')}
                    className="btn btn-outline-primary"
                >
                    Retour à mes commandes
                </button>
            </div>
        )
    }

    const total = Number(commande.prix_menu || 0) + Number(commande.prix_livraison || 0)
    const peutAnnuler = commande.statut === 'en_attente' || commande.statut === 'accepte'
    const peutLaisserAvis =
        ['livre', 'terminee'].includes(commande.statut) && !avisExistant

    return (
        <div className="mc-page">
            {/* Breadcrumb */}
            <nav className="mc-breadcrumb" aria-label="Fil d'Ariane">
                <Link to="/mon-compte/commandes">Mes commandes</Link>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{commande.numero_commande}</span>
            </nav>

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

            {/* Titre + statut */}
            <header className="mc-detail-entete">
                <div>
                    <h1 className="titre-serif mc-titre">{commande.menu_titre}</h1>
                    <p className="mc-sous-titre">Commande {commande.numero_commande}</p>
                </div>
                <span
                    className={`mc-badge mc-badge--${commande.statut.replace(/_/g, '-')} mc-badge--lg`}
                >
                    {LABELS_STATUT[commande.statut] || commande.statut}
                </span>
            </header>

            {/* Avis deja laisse */}
            {avisExistant && (
                <div className="mc-avis-info">
                    <Star size={16} fill="#F5C84A" stroke="#F5C84A" />
                    <span>
                        Vous avez laissé un avis ({avisExistant.note}/5) — Statut :{' '}
                        <strong>
                            {avisExistant.statut === 'valide'
                                ? 'publié'
                                : avisExistant.statut === 'refuse'
                                  ? 'refusé'
                                  : 'en attente de modération'}
                        </strong>
                    </span>
                </div>
            )}

            {/* Bouton avis */}
            {peutLaisserAvis && (
                <div className="mc-cta-avis">
                    <div>
                        <strong>Comment s'est passée votre prestation ?</strong>
                        <p>Votre avis aide les autres clients à choisir.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModaleAvis(true)}
                        className="btn btn-primary"
                    >
                        <Star size={16} className="me-2" />
                        Laisser un avis
                    </button>
                </div>
            )}

            {/* Infos prestation */}
            <section className="mc-carte">
                <h2 className="titre-serif mc-carte-titre">Détails de votre prestation</h2>
                <div className="mc-grille-2col">
                    <div className="mc-info-item">
                        <Calendar size={16} aria-hidden="true" />
                        <div>
                            <div className="mc-info-label">Date</div>
                            <div className="mc-info-valeur">
                                {new Date(commande.date_prestation).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="mc-info-item">
                        <Clock size={16} aria-hidden="true" />
                        <div>
                            <div className="mc-info-label">Heure</div>
                            <div className="mc-info-valeur">
                                {commande.heure_livraison || 'Non précisée'}
                            </div>
                        </div>
                    </div>
                    <div className="mc-info-item">
                        <Users size={16} aria-hidden="true" />
                        <div>
                            <div className="mc-info-label">Nombre de personnes</div>
                            <div className="mc-info-valeur">{commande.nombre_personnes} personnes</div>
                        </div>
                    </div>
                    <div className="mc-info-item">
                        <Truck size={16} aria-hidden="true" />
                        <div>
                            <div className="mc-info-label">Prêt de matériel</div>
                            <div className="mc-info-valeur">
                                {commande.pret_materiel ? 'Inclus' : 'Non demandé'}
                            </div>
                        </div>
                    </div>
                    <div className="mc-info-item mc-col-full">
                        <MapPin size={16} aria-hidden="true" />
                        <div>
                            <div className="mc-info-label">Adresse de livraison</div>
                            <div className="mc-info-valeur">{commande.lieu_livraison}</div>
                        </div>
                    </div>
                </div>

                {commande.notes_client && (
                    <div className="mc-notes-bloc">
                        <div className="mc-info-label">Vos notes pour le traiteur</div>
                        <p className="mc-notes-contenu">{commande.notes_client}</p>
                    </div>
                )}
            </section>

            {/* Recap prix */}
            <section className="mc-carte">
                <h2 className="titre-serif mc-carte-titre">Récapitulatif</h2>
                <div className="mc-recap">
                    <div className="mc-recap-ligne">
                        <span>
                            {commande.menu_titre} ({commande.nombre_personnes} pers.)
                        </span>
                        <strong>{Number(commande.prix_menu || 0).toFixed(2)} €</strong>
                    </div>
                    <div className="mc-recap-ligne">
                        <span>Frais de livraison</span>
                        <strong>{Number(commande.prix_livraison || 0).toFixed(2)} €</strong>
                    </div>
                    <hr />
                    <div className="mc-recap-ligne mc-recap-total">
                        <span>Total TTC</span>
                        <strong>{total.toFixed(2)} €</strong>
                    </div>
                </div>
            </section>

            {/* Historique */}
            {historique.length > 0 && (
                <section className="mc-carte">
                    <h2 className="titre-serif mc-carte-titre">Suivi de votre commande</h2>
                    <div className="mc-historique">
                        {historique.map((h, idx) => (
                            <div
                                key={h.historique_id ?? idx}
                                className={`mc-historique-entree ${idx === 0 ? 'mc-historique-actuel' : ''}`}
                            >
                                <div className="mc-historique-pastille" aria-hidden="true">
                                    {idx === 0 ? <Check size={12} /> : '•'}
                                </div>
                                <div>
                                    <strong>{LABELS_STATUT[h.statut] || h.statut}</strong>
                                    <div className="mc-historique-date">
                                        {new Date(h.date_modification).toLocaleString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Annulation */}
            {peutAnnuler && (
                <section className="mc-carte mc-carte-annulation">
                    <h2 className="mc-carte-titre mc-titre-annulation">
                        <AlertTriangle size={18} aria-hidden="true" />
                        Annuler cette commande
                    </h2>
                    <p>
                        Vous pouvez annuler votre commande tant qu'elle n'est pas en préparation.
                        Une fois annulée, l'équipe vous contactera pour le remboursement de l'acompte.
                    </p>
                    <button
                        type="button"
                        onClick={() => setModaleAnnulation(true)}
                        className="btn btn-outline-danger"
                    >
                        Annuler ma commande
                    </button>
                </section>
            )}

            {/* === MODALE ANNULATION === */}
            {modaleAnnulation && (
                <div
                    className="mc-modale-overlay"
                    onClick={() => setModaleAnnulation(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="mc-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Annuler cette commande ?</h3>
                        <p>
                            Êtes-vous sûr de vouloir annuler votre commande pour le{' '}
                            <strong>
                                {new Date(commande.date_prestation).toLocaleDateString('fr-FR')}
                            </strong>{' '}
                            ?
                        </p>

                        <label htmlFor="motif" className="form-label fw-medium">
                            Pouvez-vous nous expliquer la raison ? *
                        </label>
                        <textarea
                            id="motif"
                            className="form-control"
                            rows={3}
                            value={motifAnnulation}
                            onChange={(e) => setMotifAnnulation(e.target.value)}
                            placeholder="Ex: changement de date, événement annulé..."
                            required
                        />

                        <div className="form-label fw-medium mt-3">
                            Comment souhaitez-vous être contacté ?
                        </div>
                        <div className="form-check">
                            <input
                                type="radio"
                                id="mc-tel"
                                name="mc-mode"
                                value="telephone"
                                checked={modeContact === 'telephone'}
                                onChange={(e) => setModeContact(e.target.value)}
                                className="form-check-input"
                            />
                            <label htmlFor="mc-tel" className="form-check-label">
                                Téléphone uniquement
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="radio"
                                id="mc-email"
                                name="mc-mode"
                                value="email"
                                checked={modeContact === 'email'}
                                onChange={(e) => setModeContact(e.target.value)}
                                className="form-check-input"
                            />
                            <label htmlFor="mc-email" className="form-check-label">
                                Email uniquement
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="radio"
                                id="mc-both"
                                name="mc-mode"
                                value="telephone_et_email"
                                checked={modeContact === 'telephone_et_email'}
                                onChange={(e) => setModeContact(e.target.value)}
                                className="form-check-input"
                            />
                            <label htmlFor="mc-both" className="form-check-label">
                                Téléphone et email
                            </label>
                        </div>

                        <div className="d-flex gap-2 justify-content-end mt-3">
                            <button
                                type="button"
                                onClick={() => setModaleAnnulation(false)}
                                className="btn btn-outline-primary"
                            >
                                Garder ma commande
                            </button>
                            <button
                                type="button"
                                onClick={confirmerAnnulation}
                                className="btn btn-danger"
                                disabled={annulationEnCours || !motifAnnulation.trim()}
                            >
                                {annulationEnCours ? 'Annulation…' : 'Confirmer l\'annulation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODALE AVIS === */}
            {modaleAvis && (
                <div
                    className="mc-modale-overlay"
                    onClick={() => setModaleAvis(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="mc-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Laisser un avis</h3>
                        <p className="text-muted">
                            Comment s'est passée votre prestation pour <strong>{commande.menu_titre}</strong> ?
                        </p>

                        <form onSubmit={envoyerAvis}>
                            <div className="form-label fw-medium">Votre note *</div>
                            <div className="mc-stars-input">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        type="button"
                                        key={n}
                                        onClick={() => setNote(n)}
                                        className="mc-star-bouton"
                                        aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                                    >
                                        <Star
                                            size={28}
                                            fill={n <= note ? '#F5C84A' : 'transparent'}
                                            stroke={n <= note ? '#F5C84A' : '#D1D5DB'}
                                        />
                                    </button>
                                ))}
                                <span className="mc-stars-valeur">{note}/5</span>
                            </div>

                            <label htmlFor="commentaire" className="form-label fw-medium mt-3">
                                Votre commentaire *
                            </label>
                            <textarea
                                id="commentaire"
                                className="form-control"
                                rows={4}
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                placeholder="Partagez votre expérience..."
                                required
                            />
                            <div className="form-text">
                                Votre avis sera publié sur la page d'accueil après validation par notre équipe.
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-3">
                                <button
                                    type="button"
                                    onClick={() => setModaleAvis(false)}
                                    className="btn btn-outline-primary"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={envoiAvis || !commentaire.trim()}
                                >
                                    {envoiAvis ? 'Envoi…' : 'Envoyer mon avis'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
