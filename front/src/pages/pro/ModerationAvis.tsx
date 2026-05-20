// Moderation des avis - admin/employe
// Liste les avis (par defaut en_attente) avec actions Valider / Refuser.

import { useState, useEffect } from 'react'
import { Star, Check, X, MessageSquare } from 'lucide-react'
import { api } from '../../services/api'
import './ModerationAvis.css'

interface AvisModeration {
    avis_id: number
    note: number
    description: string
    statut: 'en_attente' | 'valide' | 'refuse'
    date_creation: string
    auteur_prenom: string
    auteur_nom: string
    auteur_email: string
    menu_titre: string
    numero_commande: string
}

interface Props {
    racine: '/admin' | '/employe'
}

export default function ModerationAvis({}: Props) {
    const [avis, setAvis] = useState<AvisModeration[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)
    const [filtreStatut, setFiltreStatut] = useState<'en_attente' | 'valide' | 'refuse'>('en_attente')
    // Ids en cours de moderation (pour griser le bouton)
    const [enModeration, setEnModeration] = useState<Set<number>>(new Set())

    async function charger() {
        try {
            setChargement(true)
            setErreur(null)
            const data = await api.get<{ avis: AvisModeration[] }>(
                `/api/avis/moderation?statut=${filtreStatut}`
            )
            setAvis(data.avis || [])
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger les avis.')
        } finally {
            setChargement(false)
        }
    }

    useEffect(() => {
        charger()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtreStatut])

    function afficherSucces(msg: string) {
        setMessageOk(msg)
        setTimeout(() => setMessageOk(null), 3000)
    }

    async function moderer(avisId: number, nouveauStatut: 'valide' | 'refuse') {
        try {
            setEnModeration((prev) => new Set(prev).add(avisId))
            await api.put(`/api/avis/${avisId}/moderer`, { statut: nouveauStatut })
            // Mise a jour optimiste : on retire l'avis de la liste si on est sur en_attente
            setAvis((prev) => prev.filter((a) => a.avis_id !== avisId))
            afficherSucces(nouveauStatut === 'valide' ? 'Avis validé' : 'Avis refusé')
        } catch (err: any) {
            setErreur(err?.message || 'Erreur lors de la modération.')
        } finally {
            setEnModeration((prev) => {
                const newSet = new Set(prev)
                newSet.delete(avisId)
                return newSet
            })
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
        <div className="moderation-avis">
            <header className="ma-entete">
                <div>
                    <h1 className="titre-serif ma-titre">Modération des avis</h1>
                    <p className="ma-sous-titre">
                        Validez ou refusez les avis avant leur affichage sur le site
                    </p>
                </div>
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

            {/* Onglets de filtre */}
            <div className="ma-onglets" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'en_attente'}
                    className={`ma-onglet ${filtreStatut === 'en_attente' ? 'ma-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('en_attente')}
                >
                    En attente
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'valide'}
                    className={`ma-onglet ${filtreStatut === 'valide' ? 'ma-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('valide')}
                >
                    Validés
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'refuse'}
                    className={`ma-onglet ${filtreStatut === 'refuse' ? 'ma-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('refuse')}
                >
                    Refusés
                </button>
            </div>

            {avis.length === 0 ? (
                <div className="ma-vide">
                    <MessageSquare size={48} aria-hidden="true" />
                    <h3>
                        {filtreStatut === 'en_attente'
                            ? 'Aucun avis en attente'
                            : filtreStatut === 'valide'
                              ? 'Aucun avis validé'
                              : 'Aucun avis refusé'}
                    </h3>
                    <p>
                        {filtreStatut === 'en_attente'
                            ? 'Tous les avis ont été traités. Bravo !'
                            : 'Aucun avis ne correspond à ce filtre pour l’instant.'}
                    </p>
                </div>
            ) : (
                <div className="ma-liste">
                    {avis.map((a) => (
                        <article key={a.avis_id} className="ma-carte">
                            <div className="ma-carte-header">
                                <div>
                                    <div className="ma-auteur">
                                        <div className="ma-avatar" aria-hidden="true">
                                            {a.auteur_prenom?.[0]?.toUpperCase()}
                                            {a.auteur_nom?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <strong>
                                                {a.auteur_prenom} {a.auteur_nom}
                                            </strong>
                                            <div className="ma-meta">
                                                {a.auteur_email} • Commande {a.numero_commande}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ma-note">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            size={18}
                                            fill={n <= a.note ? '#F5C84A' : 'transparent'}
                                            stroke={n <= a.note ? '#F5C84A' : '#D1D5DB'}
                                        />
                                    ))}
                                    <span className="ma-note-valeur">{a.note}/5</span>
                                </div>
                            </div>

                            <div className="ma-menu-info">
                                Menu commandé : <strong>{a.menu_titre}</strong>
                            </div>

                            <p className="ma-commentaire">"{a.description}"</p>

                            <div className="ma-pied">
                                <span className="ma-date">
                                    Reçu le{' '}
                                    {new Date(a.date_creation).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                                {filtreStatut === 'en_attente' && (
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => moderer(a.avis_id, 'refuse')}
                                            disabled={enModeration.has(a.avis_id)}
                                            className="btn btn-outline-danger btn-sm"
                                        >
                                            <X size={14} className="me-1" />
                                            Refuser
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moderer(a.avis_id, 'valide')}
                                            disabled={enModeration.has(a.avis_id)}
                                            className="btn btn-success btn-sm"
                                        >
                                            <Check size={14} className="me-1" />
                                            Valider
                                        </button>
                                    </div>
                                )}
                                {filtreStatut !== 'en_attente' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            moderer(a.avis_id, filtreStatut === 'valide' ? 'refuse' : 'valide')
                                        }
                                        disabled={enModeration.has(a.avis_id)}
                                        className="btn btn-outline-primary btn-sm"
                                    >
                                        {filtreStatut === 'valide' ? 'Retirer' : 'Restaurer'}
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
