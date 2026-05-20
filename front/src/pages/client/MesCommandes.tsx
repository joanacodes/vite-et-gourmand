// Liste des commandes du client connecte.
// Filtre simple par statut + liste de cartes (pas une table, plus convivial).

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import type { Commande } from '../../types'
import { useInfiniteList } from '../../hooks/useInfiniteList'
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

export default function MesCommandes() {
    const [commandes, setCommandes] = useState<Commande[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [filtreStatut, setFiltreStatut] = useState<'tout' | 'en_cours' | 'terminees' | 'annulees'>(
        'tout'
    )

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

    const commandesFiltrees = useMemo(() => {
        let liste = [...commandes]
        if (filtreStatut === 'en_cours') {
            liste = liste.filter((c) =>
                ['en_attente', 'accepte', 'en_preparation', 'en_cours_livraison'].includes(c.statut)
            )
        } else if (filtreStatut === 'terminees') {
            liste = liste.filter((c) =>
                ['livre', 'terminee', 'attente_retour_materiel'].includes(c.statut)
            )
        } else if (filtreStatut === 'annulees') {
            liste = liste.filter((c) => c.statut === 'annulee')
        }
        // Tri par date de prestation decroissante
        liste.sort(
            (a, b) =>
                new Date(b.date_prestation).getTime() - new Date(a.date_prestation).getTime()
        )
        return liste
    }, [commandes, filtreStatut])

    // Infinite scroll
    const {
        itemsVisibles: commandesAffichees,
        sentinelleRef,
        restant,
        aPlus,
    } = useInfiniteList(commandesFiltrees)

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
            <h1 className="titre-serif mc-titre">Mes commandes</h1>
            <p className="mc-sous-titre">Historique de vos prestations</p>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {/* Onglets filtres */}
            <div className="mc-onglets" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'tout'}
                    className={`mc-onglet ${filtreStatut === 'tout' ? 'mc-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('tout')}
                >
                    Toutes ({commandes.length})
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'en_cours'}
                    className={`mc-onglet ${filtreStatut === 'en_cours' ? 'mc-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('en_cours')}
                >
                    En cours
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'terminees'}
                    className={`mc-onglet ${filtreStatut === 'terminees' ? 'mc-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('terminees')}
                >
                    Terminées
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filtreStatut === 'annulees'}
                    className={`mc-onglet ${filtreStatut === 'annulees' ? 'mc-onglet--actif' : ''}`}
                    onClick={() => setFiltreStatut('annulees')}
                >
                    Annulées
                </button>
            </div>

            {commandesFiltrees.length === 0 ? (
                <div className="mc-vide">
                    <ShoppingBag size={48} aria-hidden="true" />
                    <h3>Aucune commande</h3>
                    <p>Vous n'avez pas encore de commande dans cette catégorie.</p>
                    <Link to="/menus" className="btn btn-primary mt-2">
                        Découvrir nos menus
                    </Link>
                </div>
            ) : (
                <div className="mc-commandes">
                    {commandesAffichees.map((c) => (
                        <Link
                            to={`/mon-compte/commandes/${c.numero_commande}`}
                            key={c.numero_commande}
                            className="mc-commande-carte"
                        >
                            <div className="mc-commande-info">
                                <div className="mc-commande-numero">{c.numero_commande}</div>
                                <div className="mc-commande-menu">{c.menu_titre}</div>
                                <div className="mc-commande-meta">
                                    <Calendar size={12} aria-hidden="true" />
                                    {new Date(c.date_prestation).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                    {c.heure_livraison && <> à {c.heure_livraison}</>} ·{' '}
                                    {c.nombre_personnes} pers.
                                </div>
                            </div>
                            <div className="mc-commande-droite">
                                <div className="mc-commande-prix">
                                    {(
                                        Number(c.prix_menu || 0) + Number(c.prix_livraison || 0)
                                    ).toFixed(2)}{' '}
                                    €
                                </div>
                                <span
                                    className={`mc-badge mc-badge--${c.statut.replace(/_/g, '-')}`}
                                >
                                    {LABELS_STATUT[c.statut] || c.statut}
                                </span>
                                <ChevronRight size={16} className="mc-commande-fleche" />
                            </div>
                        </Link>
                    ))}
                    {aPlus && (
                        <>
                            <div className="text-center text-muted py-2">
                                {restant} commandes de plus en scrollant…
                            </div>
                            <div ref={sentinelleRef} style={{ height: 1 }} aria-hidden="true" />
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
