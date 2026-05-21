// Page de detail d'une commande - admin et employe.
// Maquette complete : infos, historique, workflow, notes internes,
// annulation, contact client, etc.

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    Mail,
    Phone,
    Calendar,
    User,
    Truck,
    CheckCircle,
    Clock,
    AlertTriangle,
    Plus,
    ChevronRight,
} from 'lucide-react'
import { api } from '../../services/api'
import type { Commande, StatutCommande } from '../../types'
import './DetailCommande.css'

interface Props {
    racine: '/admin' | '/employe'
}

interface HistoriqueEntree {
    historique_id?: number
    statut: string
    date_modification: string
    modifie_par_prenom?: string
    modifie_par_nom?: string
    commentaire?: string
}

interface NoteInterne {
    note_id: number
    contenu: string
    date_creation: string
    auteur_prenom: string
    auteur_nom: string
}

// Ordre des statuts pour l'affichage de l'historique et options de changement
const STATUTS_ORDRE: StatutCommande[] = [
    'en_attente',
    'accepte',
    'en_preparation',
    'en_cours_livraison',
    'livre',
    'attente_retour_materiel',
    'terminee',
    'annulee',
]

const LABELS_STATUT: Record<string, string> = {
    en_attente: 'En attente',
    accepte: 'Accepté',
    en_preparation: 'En préparation',
    en_cours_livraison: 'En cours de livraison',
    livre: 'Livré',
    attente_retour_materiel: 'Attente retour matériel',
    terminee: 'Terminée',
    annulee: 'Annulée',
}

export default function DetailCommande({ racine }: Props) {
    const { numero } = useParams<{ numero: string }>()

    const [commande, setCommande] = useState<Commande | null>(null)
    const [historique, setHistorique] = useState<HistoriqueEntree[]>([])
    const [notesInternes, setNotesInternes] = useState<NoteInterne[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    // Workflow statuts
    const [nouveauStatut, setNouveauStatut] = useState<string>('')
    const [maj, setMaj] = useState(false)
    const [messageOk, setMessageOk] = useState<string | null>(null)

    // Modale Contact client
    const [contactOuvert, setContactOuvert] = useState(false)
    const [contactSujet, setContactSujet] = useState('')
    const [contactMessage, setContactMessage] = useState('')
    const [contactEnCours, setContactEnCours] = useState(false)

    // (modale facture retiree : fonctionnalite reportee)

    // Note interne
    const [nouvelleNote, setNouvelleNote] = useState('')
    const [ajoutNote, setAjoutNote] = useState(false)

    // Annulation
    const [motifAnnulation, setMotifAnnulation] = useState('')
    const [modeContactAnnulation, setModeContactAnnulation] = useState('telephone_et_email')
    const [annulationEnCours, setAnnulationEnCours] = useState(false)

    async function charger() {
        if (!numero) return
        try {
            setChargement(true)
            setErreur(null)

            const [cmd, hist, notes] = await Promise.all([
                api.get<{ commande: Commande }>(`/api/commandes/${numero}`),
                api.get<{ historique: HistoriqueEntree[] }>(`/api/commandes/${numero}/historique`),
                api.get<{ notes: NoteInterne[] }>(`/api/commandes/${numero}/notes-internes`),
            ])

            setCommande(cmd.commande)
            setHistorique(hist.historique || [])
            setNotesInternes(notes.notes || [])
            setNouveauStatut(cmd.commande.statut)
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

    // ===== Helpers =====

    function afficherSucces(msg: string) {
        setMessageOk(msg)
        setTimeout(() => setMessageOk(null), 4000)
    }

    // ===== Actions =====

    async function changerStatut() {
        if (!nouveauStatut || !commande || nouveauStatut === commande.statut) return
        try {
            setMaj(true)
            setErreur(null)
            await api.put(`/api/commandes/${numero}/statut`, { statut: nouveauStatut })
            await charger()
            afficherSucces(`Statut mis à jour : ${LABELS_STATUT[nouveauStatut]}`)
        } catch (err: any) {
            setErreur(err?.message || 'Erreur lors du changement de statut.')
        } finally {
            setMaj(false)
        }
    }

    async function envoyerContactClient(e: FormEvent) {
        e.preventDefault()
        if (!contactSujet.trim() || !contactMessage.trim()) return
        try {
            setContactEnCours(true)
            await api.post(`/api/commandes/${numero}/contact-client`, {
                sujet: contactSujet,
                message: contactMessage,
            })
            setContactOuvert(false)
            setContactSujet('')
            setContactMessage('')
            afficherSucces('Email envoyé au client')
        } catch (err: any) {
            setErreur(err?.message || "Impossible d'envoyer l'email.")
        } finally {
            setContactEnCours(false)
        }
    }

    async function ajouterNoteInterne(e: FormEvent) {
        e.preventDefault()
        if (!nouvelleNote.trim()) return
        try {
            setAjoutNote(true)
            await api.post(`/api/commandes/${numero}/notes-internes`, {
                contenu: nouvelleNote,
            })
            setNouvelleNote('')
            // On recharge juste les notes
            const data = await api.get<{ notes: NoteInterne[] }>(
                `/api/commandes/${numero}/notes-internes`
            )
            setNotesInternes(data.notes || [])
            afficherSucces('Note interne ajoutée')
        } catch (err: any) {
            setErreur(err?.message || "Impossible d'ajouter la note.")
        } finally {
            setAjoutNote(false)
        }
    }

    async function confirmerAnnulation() {
        if (!motifAnnulation.trim()) return
        try {
            setAnnulationEnCours(true)
            await api.put(`/api/commandes/${numero}/annuler`, {
                motifAnnulation: motifAnnulation,
                modeContactAnnulation: modeContactAnnulation,
            })
            await charger()
            setMotifAnnulation('')
            afficherSucces('Commande annulée')
        } catch (err: any) {
            setErreur(err?.message || "Erreur lors de l'annulation.")
        } finally {
            setAnnulationEnCours(false)
        }
    }

    // ===== Rendu =====

    if (chargement) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    if (erreur && !commande) {
        return (
            <div>
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
                <Link to={`${racine}/commandes`} className="btn btn-outline-primary">
                    Retour à la liste
                </Link>
            </div>
        )
    }

    if (!commande) return null

    // Calculs d'affichage
    const total = Number(commande.prix_menu || 0) + Number(commande.prix_livraison || 0)
    // Valeurs en dur conformement aux choix : acompte 30%, TVA 20% (incluse dans le total cote BDD - on fait juste un affichage didactique)
    const tva = total * (20 / 120) // estimation TVA depuis TTC
    const sousTotal = total - tva
    const acompte = total * 0.3
    const restePayer = total - acompte
    const dejaAnnulee = commande.statut === 'annulee'
    const dejaTerminee = commande.statut === 'terminee'

    return (
        <div className="detail-commande">
            {/* Breadcrumb */}
            <nav aria-label="Fil d'Ariane" className="dc-breadcrumb">
                <Link to={`${racine}/commandes`}>Commandes</Link>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{commande.numero_commande}</span>
            </nav>

            {/* Message de succes / erreur */}
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

            {/* En-tete : titre + actions rapides */}
            <header className="dc-entete">
                <div>
                    <h1 className="titre-serif dc-titre">
                        Commande {commande.numero_commande}
                    </h1>
                    <div className="dc-meta">
                        <span className="dc-meta-item">
                            <Calendar size={14} aria-hidden="true" />
                            {commande.date_commande
                                ? new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                  })
                                : '—'}
                            {commande.heure_livraison && ` à ${commande.heure_livraison}`}
                        </span>
                        <span className="dc-meta-item">
                            <User size={14} aria-hidden="true" />
                            {commande.client_prenom} {commande.client_nom}
                        </span>
                    </div>
                </div>
                <BadgeStatut statut={commande.statut} taille="lg" />
            </header>

            {/* Actions rapides */}
            <div className="dc-actions-rapides">
                <button
                    type="button"
                    onClick={() => setContactOuvert(true)}
                    className="btn btn-outline-primary btn-sm"
                >
                    <Mail size={16} className="me-2" />
                    Envoyer email
                </button>
                <a
                    href={`tel:${commande.client_telephone || ''}`}
                    className="btn btn-outline-primary btn-sm"
                >
                    <Phone size={16} className="me-2" />
                    Appeler client
                </a>
                {/* Bouton "Télécharger facture" retiré : fonctionnalité PDF reportée à une version ultérieure */}
            </div>

            {/* Layout 2 colonnes */}
            <div className="dc-grille">
                {/* ========== COLONNE GAUCHE ========== */}
                <div className="dc-colonne-gauche">
                    {/* Infos client */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Informations Client</h2>
                        <div className="dc-grille-2col">
                            <div>
                                <div className="dc-label">NOM COMPLET</div>
                                <div className="dc-valeur">
                                    {commande.client_prenom} {commande.client_nom}
                                </div>
                            </div>
                            <div>
                                <div className="dc-label">STATUT COMPTE</div>
                                <span className="dc-badge dc-badge--ok">Actif</span>
                            </div>
                            <div>
                                <div className="dc-label">EMAIL</div>
                                <div className="dc-valeur">{commande.client_email || '—'}</div>
                            </div>
                            <div>
                                <div className="dc-label">TÉLÉPHONE</div>
                                <div className="dc-valeur">{commande.client_telephone || '—'}</div>
                            </div>
                        </div>
                    </section>

                    {/* Menu commande */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Menu Commandé</h2>
                        <div className="dc-menu-bloc">
                            <div className="dc-menu-image" aria-hidden="true">
                                <div className="dc-menu-image-placeholder">🍽️</div>
                            </div>
                            <div>
                                <h3 className="dc-menu-titre">{commande.menu_titre}</h3>
                                <div className="dc-menu-meta">
                                    {commande.prix_par_personne && (
                                        <span>{Number(commande.prix_par_personne).toFixed(0)}€ / personne</span>
                                    )}
                                </div>
                                {commande.menu_description && (
                                    <p className="dc-menu-desc">{commande.menu_description}</p>
                                )}
                            </div>
                        </div>
                        {commande.menu_id && (
                            <Link
                                to={`${racine}/menus/${commande.menu_id}`}
                                className="dc-menu-lien"
                            >
                                Voir tous les détails du menu →
                            </Link>
                        )}
                    </section>

                    {/* Infos service */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Informations de Service</h2>
                        <div className="dc-grille-2col">
                            <div>
                                <div className="dc-label">DATE DE SERVICE</div>
                                <div className="dc-valeur">
                                    {commande.date_prestation
                                        ? new Date(commande.date_prestation).toLocaleDateString('fr-FR', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="dc-label">HEURE DE SERVICE</div>
                                <div className="dc-valeur">{commande.heure_livraison || '—'}</div>
                            </div>
                            <div>
                                <div className="dc-label">NOMBRE DE PERSONNES</div>
                                <div className="dc-valeur">{commande.nombre_personnes} personnes</div>
                            </div>
                            <div>
                                <div className="dc-label">TYPE DE SERVICE</div>
                                <div className="dc-valeur">Service à table</div>
                            </div>
                            <div className="dc-col-full">
                                <div className="dc-label">ADRESSE DE LIVRAISON</div>
                                <div className="dc-valeur">{commande.lieu_livraison || '—'}</div>
                            </div>
                            <div>
                                <div className="dc-label">INSTRUCTIONS D'ACCÈS</div>
                                <div className="dc-valeur text-muted fst-italic">
                                    Aucune instruction
                                </div>
                            </div>
                            <div>
                                <div className="dc-label">CONTACT SUR PLACE</div>
                                <div className="dc-valeur">
                                    {commande.client_prenom} {commande.client_nom}
                                    {commande.client_telephone && (
                                        <> — {commande.client_telephone}</>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Notes client */}
                    {commande.notes_client && (
                        <section className="dc-carte">
                            <h2 className="titre-serif dc-carte-titre">Notes du Client</h2>
                            <div className="dc-notes-client">
                                <p>"{commande.notes_client}"</p>
                                <div className="dc-notes-meta">
                                    <Clock size={12} aria-hidden="true" />
                                    Note ajoutée le{' '}
                                    {new Date(commande.date_commande || '').toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Recap financier */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Récapitulatif Financier</h2>
                        <div className="dc-recap-lignes">
                            <div className="dc-recap-ligne">
                                <span>
                                    {commande.menu_titre} ({commande.nombre_personnes} ×{' '}
                                    {commande.prix_par_personne
                                        ? Number(commande.prix_par_personne).toFixed(0)
                                        : Math.round(Number(commande.prix_menu) / Number(commande.nombre_personnes))}
                                    €)
                                </span>
                                <strong>{Number(commande.prix_menu || 0).toFixed(2)}€</strong>
                            </div>
                            <div className="dc-recap-ligne">
                                <span>Frais de livraison</span>
                                <strong>{Number(commande.prix_livraison || 0).toFixed(2)}€</strong>
                            </div>
                            {commande.pret_materiel && (
                                <div className="dc-recap-ligne">
                                    <span>Prêt de matériel</span>
                                    <strong>Inclus</strong>
                                </div>
                            )}
                            <hr />
                            <div className="dc-recap-ligne">
                                <span>Sous-total HT</span>
                                <strong>{sousTotal.toFixed(2)}€</strong>
                            </div>
                            <div className="dc-recap-ligne">
                                <span>TVA (20%)</span>
                                <strong>{tva.toFixed(2)}€</strong>
                            </div>
                            <hr />
                            <div className="dc-recap-ligne dc-recap-total">
                                <span>Total TTC</span>
                                <strong>{total.toFixed(2)}€</strong>
                            </div>
                            <div className="dc-recap-ligne">
                                <span>Acompte versé (30%)</span>
                                <strong>{acompte.toFixed(2)}€</strong>
                            </div>
                            <div className="dc-recap-ligne dc-recap-reste">
                                <span>Reste à payer</span>
                                <strong>{restePayer.toFixed(2)}€</strong>
                            </div>
                            <div className="dc-acompte-recu" role="status">
                                <CheckCircle size={14} />
                                Acompte reçu
                            </div>
                        </div>
                    </section>

                    {/* Notes internes */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Notes Internes (Employés)</h2>
                        {notesInternes.length === 0 ? (
                            <p className="text-muted">Aucune note interne pour cette commande.</p>
                        ) : (
                            <div className="dc-notes-internes">
                                {notesInternes.map((note) => (
                                    <div key={note.note_id} className="dc-note-interne">
                                        <div className="dc-note-interne-header">
                                            <strong>
                                                {note.auteur_prenom} {note.auteur_nom}
                                            </strong>
                                            <span className="dc-note-interne-date">
                                                {new Date(note.date_creation).toLocaleString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="dc-note-interne-contenu">{note.contenu}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Formulaire d'ajout */}
                        <form onSubmit={ajouterNoteInterne} className="dc-note-form">
                            <label htmlFor="note-contenu" className="dc-label">
                                AJOUTER UNE NOTE INTERNE
                            </label>
                            <textarea
                                id="note-contenu"
                                className="form-control"
                                rows={3}
                                value={nouvelleNote}
                                onChange={(e) => setNouvelleNote(e.target.value)}
                                placeholder="Saisissez votre note interne (visible uniquement par les employés)..."
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm mt-2"
                                disabled={ajoutNote || !nouvelleNote.trim()}
                            >
                                <Plus size={16} className="me-2" />
                                Ajouter une note
                            </button>
                        </form>
                    </section>
                </div>

                {/* ========== COLONNE DROITE (sticky) ========== */}
                <aside className="dc-colonne-droite">
                    {/* Changement de statut */}
                    {!dejaAnnulee && !dejaTerminee && (
                        <section className="dc-carte dc-sticky">
                            <h2 className="titre-serif dc-carte-titre">Changer le statut</h2>
                            <select
                                value={nouveauStatut}
                                onChange={(e) => setNouveauStatut(e.target.value)}
                                className="form-select"
                                aria-label="Nouveau statut"
                            >
                                {STATUTS_ORDRE.filter((s) => s !== 'annulee').map((s) => (
                                    <option key={s} value={s}>
                                        {LABELS_STATUT[s]}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={changerStatut}
                                className="btn btn-primary w-100 mt-2"
                                disabled={maj || nouveauStatut === commande.statut}
                            >
                                {maj ? 'Mise à jour…' : 'Mettre à jour'}
                            </button>
                        </section>
                    )}

                    {/* Historique */}
                    <section className="dc-carte">
                        <h2 className="titre-serif dc-carte-titre">Historique</h2>
                        {historique.length === 0 ? (
                            <p className="text-muted">Aucun historique disponible.</p>
                        ) : (
                            <div className="dc-historique">
                                {historique.map((h, idx) => (
                                    <div key={h.historique_id ?? idx} className="dc-historique-entree">
                                        <div className="dc-historique-pastille" aria-hidden="true">
                                            <Clock size={14} />
                                        </div>
                                        <div className="dc-historique-corps">
                                            <div className="dc-historique-statut">
                                                {LABELS_STATUT[h.statut] || h.statut}
                                                {idx === 0 && (
                                                    <span className="dc-historique-actuel">
                                                        Actuel
                                                    </span>
                                                )}
                                            </div>
                                            <div className="dc-historique-date">
                                                {new Date(h.date_modification).toLocaleString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                            {(h.modifie_par_prenom || h.modifie_par_nom) && (
                                                <div className="dc-historique-auteur">
                                                    Par : {h.modifie_par_prenom} {h.modifie_par_nom}
                                                </div>
                                            )}
                                            {h.commentaire && (
                                                <p className="dc-historique-commentaire">
                                                    {h.commentaire}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Workflow shortcuts */}
                    {!dejaAnnulee && !dejaTerminee && (
                        <section className="dc-carte">
                            <h2 className="titre-serif dc-carte-titre">Actions rapides</h2>
                            {commande.statut === 'en_preparation' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNouveauStatut('en_cours_livraison')
                                        setTimeout(changerStatut, 100)
                                    }}
                                    className="btn btn-primary w-100 mb-2"
                                    disabled={maj}
                                >
                                    <Truck size={16} className="me-2" />
                                    Marquer en cours de livraison
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setContactOuvert(true)}
                                className="btn btn-outline-primary w-100 mb-2"
                            >
                                <Phone size={16} className="me-2" />
                                Contacter le client
                            </button>
                        </section>
                    )}

                    {/* Annulation */}
                    {!dejaAnnulee && !dejaTerminee && (
                        <section className="dc-carte dc-annulation">
                            <h2 className="dc-annulation-titre">
                                <AlertTriangle size={18} aria-hidden="true" />
                                Annulation de Commande
                            </h2>
                            <p className="dc-annulation-warning">
                                Cette action est irréversible et nécessite une justification.
                            </p>
                            <label htmlFor="motif-annulation" className="dc-label">
                                RAISON DE L'ANNULATION *
                            </label>
                            <textarea
                                id="motif-annulation"
                                className="form-control"
                                rows={3}
                                value={motifAnnulation}
                                onChange={(e) => setMotifAnnulation(e.target.value)}
                                placeholder="Expliquez la raison de l'annulation..."
                                required
                            />

                            <div className="dc-label mt-3">MODE DE CONTACT CLIENT</div>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="mode-tel"
                                    name="mode"
                                    value="telephone"
                                    checked={modeContactAnnulation === 'telephone'}
                                    onChange={(e) => setModeContactAnnulation(e.target.value)}
                                    className="form-check-input"
                                />
                                <label htmlFor="mode-tel" className="form-check-label">
                                    Téléphone uniquement
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="mode-email"
                                    name="mode"
                                    value="email"
                                    checked={modeContactAnnulation === 'email'}
                                    onChange={(e) => setModeContactAnnulation(e.target.value)}
                                    className="form-check-input"
                                />
                                <label htmlFor="mode-email" className="form-check-label">
                                    Email uniquement
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="mode-both"
                                    name="mode"
                                    value="telephone_et_email"
                                    checked={modeContactAnnulation === 'telephone_et_email'}
                                    onChange={(e) => setModeContactAnnulation(e.target.value)}
                                    className="form-check-input"
                                />
                                <label htmlFor="mode-both" className="form-check-label">
                                    Téléphone et Email
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={confirmerAnnulation}
                                className="btn btn-danger w-100 mt-3"
                                disabled={annulationEnCours || !motifAnnulation.trim()}
                            >
                                {annulationEnCours ? 'Annulation…' : "🚫 Confirmer l'annulation"}
                            </button>
                        </section>
                    )}
                </aside>
            </div>

            {/* ===== MODALE CONTACT CLIENT ===== */}
            {contactOuvert && (
                <div
                    className="dc-modale-overlay"
                    onClick={() => setContactOuvert(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="dc-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Envoyer un email au client</h3>
                        <form onSubmit={envoyerContactClient}>
                            <label htmlFor="contact-sujet" className="dc-label">
                                SUJET *
                            </label>
                            <input
                                id="contact-sujet"
                                type="text"
                                className="form-control mb-3"
                                value={contactSujet}
                                onChange={(e) => setContactSujet(e.target.value)}
                                required
                            />
                            <label htmlFor="contact-message" className="dc-label">
                                MESSAGE *
                            </label>
                            <textarea
                                id="contact-message"
                                className="form-control"
                                rows={6}
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                required
                            />
                            <div className="d-flex gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setContactOuvert(false)}
                                    className="btn btn-outline-primary"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={contactEnCours || !contactSujet.trim() || !contactMessage.trim()}
                                >
                                    {contactEnCours ? 'Envoi…' : 'Envoyer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

// Badge statut avec taille variable
function BadgeStatut({ statut, taille = 'md' }: { statut: string; taille?: 'md' | 'lg' }) {
    const map: Record<string, string> = {
        en_attente: 'dc-badge--en-attente',
        accepte: 'dc-badge--accepte',
        en_preparation: 'dc-badge--en-preparation',
        en_cours_livraison: 'dc-badge--en-livraison',
        livre: 'dc-badge--livre',
        attente_retour_materiel: 'dc-badge--attente-retour',
        terminee: 'dc-badge--terminee',
        annulee: 'dc-badge--annulee',
    }
    return (
        <span className={`dc-badge dc-badge--${taille} ${map[statut] || 'dc-badge--terminee'}`}>
            {LABELS_STATUT[statut] || statut}
        </span>
    )
}
