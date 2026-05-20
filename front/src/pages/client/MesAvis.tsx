// Page "Mes avis" cote client.
// Liste tous les avis laisses par l'utilisateur connecte avec leur statut.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageSquare } from 'lucide-react'
import { api } from '../../services/api'
import './MonComptePages.css'

interface MonAvis {
    avis_id: number
    note: number
    description: string
    statut: 'en_attente' | 'valide' | 'refuse'
    date_creation: string
    menu_titre?: string
    numero_commande?: string
}

const LABELS_STATUT: Record<string, string> = {
    en_attente: 'En attente de validation',
    valide: 'Publié',
    refuse: 'Refusé',
}

export default function MesAvis() {
    const [avis, setAvis] = useState<MonAvis[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                // L'endpoint listerAvis filtre par utilisateur si on est connecte client
                const data = await api.get<{ avis: MonAvis[] }>('/api/avis?mesAvis=true')
                setAvis(data.avis || [])
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger vos avis.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

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
            <h1 className="titre-serif mc-titre">Mes avis</h1>
            <p className="mc-sous-titre">Retrouvez ici tous les avis que vous avez laissés</p>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {avis.length === 0 ? (
                <div className="mc-vide">
                    <MessageSquare size={48} aria-hidden="true" />
                    <h3>Aucun avis</h3>
                    <p>Vous n'avez pas encore laissé d'avis sur une prestation.</p>
                    <Link to="/mon-compte/commandes" className="btn btn-primary mt-2">
                        Voir mes commandes
                    </Link>
                </div>
            ) : (
                <div className="mc-avis-liste">
                    {avis.map((a) => (
                        <article key={a.avis_id} className="mc-carte mc-avis-carte">
                            <div className="mc-avis-header">
                                <div className="mc-stars-affichage">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            size={16}
                                            fill={n <= a.note ? '#F5C84A' : 'transparent'}
                                            stroke={n <= a.note ? '#F5C84A' : '#D1D5DB'}
                                        />
                                    ))}
                                    <span className="mc-stars-valeur">{a.note}/5</span>
                                </div>
                                <span className={`mc-badge-avis mc-badge-avis--${a.statut}`}>
                                    {LABELS_STATUT[a.statut]}
                                </span>
                            </div>

                            {a.menu_titre && (
                                <div className="mc-avis-menu">
                                    Pour : <strong>{a.menu_titre}</strong>
                                    {a.numero_commande && (
                                        <Link
                                            to={`/mon-compte/commandes/${a.numero_commande}`}
                                            className="mc-avis-lien"
                                        >
                                            (commande {a.numero_commande})
                                        </Link>
                                    )}
                                </div>
                            )}

                            <p className="mc-avis-texte">{a.description}</p>

                            <div className="mc-avis-date">
                                Laissé le{' '}
                                {new Date(a.date_creation).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
