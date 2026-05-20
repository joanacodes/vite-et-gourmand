// Vue d'ensemble de l'espace client.
// Resume des commandes + prochaine prestation + avis a laisser.

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, Star, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import type { Commande } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import './MonComptePages.css'

export default function MonCompteDashboard() {
    const { utilisateur } = useAuth()
    const [commandes, setCommandes] = useState<Commande[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                const data = await api.get<{ commandes: Commande[] }>('/api/commandes')
                setCommandes(data.commandes || [])
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger vos commandes.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    const kpis = useMemo(() => {
        const total = commandes.length
        const enCours = commandes.filter((c) =>
            ['en_attente', 'accepte', 'en_preparation', 'en_cours_livraison'].includes(c.statut)
        ).length
        const terminees = commandes.filter((c) =>
            ['livre', 'terminee', 'attente_retour_materiel'].includes(c.statut)
        ).length
        return { total, enCours, terminees }
    }, [commandes])

    // Prochaine commande (la plus proche dans le futur, parmi les non-annulees)
    const prochaineCommande = useMemo(() => {
        const aVenir = commandes.filter(
            (c) =>
                c.statut !== 'annulee' &&
                c.statut !== 'terminee' &&
                c.date_prestation &&
                new Date(c.date_prestation) >= new Date()
        )
        aVenir.sort(
            (a, b) =>
                new Date(a.date_prestation).getTime() - new Date(b.date_prestation).getTime()
        )
        return aVenir[0] || null
    }, [commandes])

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
            <h1 className="titre-serif mc-titre">Bonjour {utilisateur?.prenom} 👋</h1>
            <p className="mc-sous-titre">Voici un aperçu de votre activité</p>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {/* KPIs simples */}
            <section className="mc-kpis">
                <div className="mc-kpi">
                    <Calendar size={20} className="mc-kpi-icone" />
                    <div>
                        <div className="mc-kpi-valeur">{kpis.total}</div>
                        <div className="mc-kpi-label">Commandes au total</div>
                    </div>
                </div>
                <div className="mc-kpi mc-kpi--sauge">
                    <Clock size={20} className="mc-kpi-icone" />
                    <div>
                        <div className="mc-kpi-valeur">{kpis.enCours}</div>
                        <div className="mc-kpi-label">En cours</div>
                    </div>
                </div>
                <div className="mc-kpi mc-kpi--bleu">
                    <CheckCircle size={20} className="mc-kpi-icone" />
                    <div>
                        <div className="mc-kpi-valeur">{kpis.terminees}</div>
                        <div className="mc-kpi-label">Terminées</div>
                    </div>
                </div>
            </section>

            {/* Prochaine commande */}
            {prochaineCommande && (
                <section className="mc-carte">
                    <h2 className="titre-serif mc-carte-titre">Votre prochaine prestation</h2>
                    <div className="mc-prochaine">
                        <div>
                            <div className="mc-prochaine-menu">{prochaineCommande.menu_titre}</div>
                            <div className="mc-prochaine-meta">
                                <Calendar size={14} aria-hidden="true" />
                                {new Date(prochaineCommande.date_prestation).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                                {prochaineCommande.heure_livraison && (
                                    <> à {prochaineCommande.heure_livraison}</>
                                )}
                            </div>
                            <div className="mc-prochaine-meta">
                                {prochaineCommande.nombre_personnes} personnes ·{' '}
                                {(
                                    Number(prochaineCommande.prix_menu || 0) +
                                    Number(prochaineCommande.prix_livraison || 0)
                                ).toFixed(2)}{' '}
                                €
                            </div>
                        </div>
                        <Link
                            to={`/mon-compte/commandes/${prochaineCommande.numero_commande}`}
                            className="btn btn-outline-primary btn-sm"
                        >
                            Voir le détail
                            <ChevronRight size={14} className="ms-1" />
                        </Link>
                    </div>
                </section>
            )}

            {/* Actions rapides */}
            <section className="mc-actions">
                <Link to="/menus" className="mc-action-carte">
                    <h3>🍽️ Découvrir nos menus</h3>
                    <p>Parcourez nos menus pour votre prochaine prestation</p>
                </Link>
                <Link to="/mon-compte/commandes" className="mc-action-carte">
                    <h3>📋 Toutes mes commandes</h3>
                    <p>Consultez l'historique complet de vos commandes</p>
                </Link>
                <Link to="/mon-compte/avis" className="mc-action-carte">
                    <h3>
                        <Star size={18} fill="#F5C84A" stroke="#F5C84A" /> Laisser un avis
                    </h3>
                    <p>Partagez votre expérience après une prestation</p>
                </Link>
            </section>
        </div>
    )
}
