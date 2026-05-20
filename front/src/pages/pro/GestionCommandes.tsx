// Gestion des commandes - page partagee admin + employe.
// Maquette : KPIs en haut, filtres avances + filtres rapides
// en pilules, table avec pagination.

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    Download,
    Plus,
    Eye,
    ArrowUp,
    Search,
    RotateCcw,
    Calendar,
    Clock,
    ChefHat,
    Euro,
} from 'lucide-react'
import { api } from '../../services/api'
import type { Commande, StatutCommande } from '../../types'
import KpiCarte from '../../components/admin/KpiCarte'
import { useInfiniteList } from '../../hooks/useInfiniteList'
import './GestionCommandes.css'

type ChampsTri = 'numero_commande' | 'date_prestation' | 'nombre_personnes' | 'prix' | 'statut'

interface Props {
    /** Le racine determine ou mene le lien "voir le detail" */
    racine: '/admin' | '/employe'
}

export default function GestionCommandes({ racine }: Props) {
    const [commandes, setCommandes] = useState<Commande[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    // Filtres
    const [recherche, setRecherche] = useState('')
    const [filtreStatut, setFiltreStatut] = useState<string>('')
    const [filtreClient, setFiltreClient] = useState<string>('')
    const [filtrePeriode, setFiltrePeriode] = useState<string>('semaine')

    // Pagination
    // (anciens etats de pagination retires : infinite scroll les remplace)
    // const [pageActuelle, setPageActuelle] = useState(1)
    // const [lignesParPage, setLignesParPage] = useState(10)

    // Tri
    const [champTri, setChampTri] = useState<ChampsTri>('date_prestation')
    const [ordreCroissant, setOrdreCroissant] = useState(false)

    // Modale "fonctionnalite a venir" pour Nouvelle commande
    const [modaleOuverte, setModaleOuverte] = useState(false)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                setErreur(null)
                const data = await api.get<{ commandes: Commande[] }>('/api/commandes')
                setCommandes(data.commandes || [])
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger les commandes.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    // Liste des clients uniques pour le filtre dropdown
    const clientsUniques = useMemo(() => {
        const map = new Map<number, string>()
        commandes.forEach((c) => {
            if (c.utilisateur_id) {
                map.set(c.utilisateur_id, `${c.client_prenom} ${c.client_nom}`)
            }
        })
        return Array.from(map.entries()).map(([id, nom]) => ({ id, nom }))
    }, [commandes])

    // Filtres appliques
    const commandesFiltrees = useMemo(() => {
        let liste = [...commandes]

        // Recherche texte
        if (recherche.trim()) {
            const q = recherche.toLowerCase()
            liste = liste.filter(
                (c) =>
                    c.numero_commande?.toLowerCase().includes(q) ||
                    c.client_prenom?.toLowerCase().includes(q) ||
                    c.client_nom?.toLowerCase().includes(q) ||
                    c.client_email?.toLowerCase().includes(q) ||
                    c.menu_titre?.toLowerCase().includes(q)
            )
        }

        // Statut
        if (filtreStatut) {
            liste = liste.filter((c) => c.statut === filtreStatut)
        }

        // Client
        if (filtreClient) {
            liste = liste.filter((c) => String(c.utilisateur_id) === filtreClient)
        }

        // Periode (filtre sur date_commande)
        if (filtrePeriode && filtrePeriode !== 'tout') {
            const maintenant = new Date()
            const debutFiltre = new Date(maintenant)
            if (filtrePeriode === 'semaine') {
                debutFiltre.setDate(maintenant.getDate() - 7)
            } else if (filtrePeriode === 'mois') {
                debutFiltre.setMonth(maintenant.getMonth() - 1)
            } else if (filtrePeriode === 'annee') {
                debutFiltre.setFullYear(maintenant.getFullYear() - 1)
            }
            liste = liste.filter(
                (c) => c.date_commande && new Date(c.date_commande) >= debutFiltre
            )
        }

        // Tri
        liste.sort((a, b) => {
            let va: any
            let vb: any
            if (champTri === 'prix') {
                va = Number(a.prix_menu || 0) + Number(a.prix_livraison || 0)
                vb = Number(b.prix_menu || 0) + Number(b.prix_livraison || 0)
            } else if (champTri === 'date_prestation') {
                va = a.date_prestation || ''
                vb = b.date_prestation || ''
            } else {
                va = a[champTri] || ''
                vb = b[champTri] || ''
            }
            if (va < vb) return ordreCroissant ? -1 : 1
            if (va > vb) return ordreCroissant ? 1 : -1
            return 0
        })

        return liste
    }, [commandes, recherche, filtreStatut, filtreClient, filtrePeriode, champTri, ordreCroissant])

    // Comptages pour les filtres rapides
    const compteurs = useMemo(() => {
        const c: Record<string, number> = {}
        commandes.forEach((cmd) => {
            c[cmd.statut] = (c[cmd.statut] || 0) + 1
        })
        return c
    }, [commandes])

    // KPIs
    const kpis = useMemo(() => {
        const debutMois = new Date()
        debutMois.setDate(1)
        debutMois.setHours(0, 0, 0, 0)

        const ceMois = commandes.filter(
            (c) => c.date_commande && new Date(c.date_commande) >= debutMois
        )
        const aTraiter = commandes.filter((c) => c.statut === 'en_attente').length
        const enCours = commandes.filter((c) =>
            ['accepte', 'en_preparation', 'en_cours_livraison'].includes(c.statut)
        ).length
        const revenuMensuel = ceMois
            .filter((c) =>
                ['accepte', 'en_preparation', 'en_cours_livraison', 'livre', 'attente_retour_materiel', 'terminee'].includes(
                    c.statut
                )
            )
            .reduce((sum, c) => sum + Number(c.prix_menu || 0) + Number(c.prix_livraison || 0), 0)

        return {
            ceMois: ceMois.length,
            aTraiter,
            enCours,
            revenuMensuel,
        }
    }, [commandes])

    // Infinite scroll a la place de la pagination paginee
    const {
        itemsVisibles: commandesAffichees,
        sentinelleRef,
        restant,
        aPlus,
    } = useInfiniteList(commandesFiltrees)

    // Reset utile si filtres changent (le hook le fait deja, mais ca ne coute rien)
    // (anciennement on remettait pageActuelle a 1)

    function changerTri(champ: ChampsTri) {
        if (champTri === champ) {
            setOrdreCroissant((v) => !v)
        } else {
            setChampTri(champ)
            setOrdreCroissant(false)
        }
    }

    function reinitialiserFiltres() {
        setRecherche('')
        setFiltreStatut('')
        setFiltreClient('')
        setFiltrePeriode('semaine')
    }

    function exporterCsvBasique() {
        // Placeholder : CSV minimal cote client.
        // TODO : remplacer par un export complet plus tard
        const lignes = [
            ['Numero', 'Date prestation', 'Client', 'Menu', 'Personnes', 'Montant', 'Statut'].join(';'),
            ...commandesFiltrees.map((c) =>
                [
                    c.numero_commande,
                    c.date_prestation,
                    `${c.client_prenom} ${c.client_nom}`,
                    c.menu_titre || '',
                    c.nombre_personnes,
                    (Number(c.prix_menu || 0) + Number(c.prix_livraison || 0)).toFixed(2),
                    c.statut,
                ].join(';')
            ),
        ].join('\n')

        const blob = new Blob(['\uFEFF' + lignes], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
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
        <div className="gestion-commandes">
            <header className="gestion-commandes-entete">
                <div>
                    <h1 className="titre-serif gestion-commandes-titre">Gestion des Commandes</h1>
                    <p className="gestion-commandes-sous-titre">
                        Visualisez, filtrez et gérez toutes vos commandes
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={exporterCsvBasique}
                        className="btn btn-outline-primary btn-sm"
                    >
                        <Download size={16} className="me-2" />
                        Exporter en CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => setModaleOuverte(true)}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={16} className="me-2" />
                        Nouvelle commande
                    </button>
                </div>
            </header>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            {/* ===== KPIs ===== */}
            <section className="gestion-commandes-kpis" aria-label="Indicateurs">
                <KpiCarte
                    icone={<Calendar size={22} />}
                    valeur={kpis.ceMois}
                    label="Commandes ce mois"
                    variation={{ valeur: 12, suffixe: 'ce mois' }}
                    couleurIcone="bordeaux"
                />
                <KpiCarte
                    icone={<Clock size={22} />}
                    valeur={kpis.aTraiter}
                    label="Commandes en attente"
                    couleurIcone="or"
                />
                <KpiCarte
                    icone={<ChefHat size={22} />}
                    valeur={kpis.enCours}
                    label="Commandes actives"
                    couleurIcone="bleu"
                />
                <KpiCarte
                    icone={<Euro size={22} />}
                    valeur={`${Math.round(kpis.revenuMensuel).toLocaleString('fr-FR')} €`}
                    label="Revenu mensuel"
                    variation={{ valeur: 8, suffixe: 'ce mois' }}
                    couleurIcone="sauge"
                />
            </section>

            {/* ===== FILTRES ===== */}
            <section className="gc-filtres-bloc">
                <div className="gc-filtres-grille">
                    <div className="gc-filtre">
                        <label htmlFor="gc-recherche" className="gc-filtre-label">
                            RECHERCHER
                        </label>
                        <div className="gc-filtre-recherche">
                            <Search size={16} className="gc-filtre-recherche-icone" />
                            <input
                                id="gc-recherche"
                                type="search"
                                className="form-control"
                                placeholder="Commande, client, menu..."
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="gc-filtre">
                        <label htmlFor="gc-statut" className="gc-filtre-label">
                            STATUT
                        </label>
                        <select
                            id="gc-statut"
                            className="form-select"
                            value={filtreStatut}
                            onChange={(e) => setFiltreStatut(e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="en_attente">En attente</option>
                            <option value="accepte">Accepté</option>
                            <option value="en_preparation">En préparation</option>
                            <option value="en_cours_livraison">En livraison</option>
                            <option value="livre">Livré</option>
                            <option value="attente_retour_materiel">Attente retour matériel</option>
                            <option value="terminee">Terminée</option>
                            <option value="annulee">Annulée</option>
                        </select>
                    </div>
                    <div className="gc-filtre">
                        <label htmlFor="gc-client" className="gc-filtre-label">
                            CLIENT
                        </label>
                        <select
                            id="gc-client"
                            className="form-select"
                            value={filtreClient}
                            onChange={(e) => setFiltreClient(e.target.value)}
                        >
                            <option value="">Tous les clients</option>
                            {clientsUniques.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="gc-filtre">
                        <label htmlFor="gc-periode" className="gc-filtre-label">
                            PÉRIODE
                        </label>
                        <select
                            id="gc-periode"
                            className="form-select"
                            value={filtrePeriode}
                            onChange={(e) => setFiltrePeriode(e.target.value)}
                        >
                            <option value="semaine">Cette semaine</option>
                            <option value="mois">Ce mois</option>
                            <option value="annee">Cette année</option>
                            <option value="tout">Toutes</option>
                        </select>
                    </div>
                </div>

                {/* Filtres rapides en pilules */}
                <div className="gc-filtres-rapides">
                    <span className="gc-filtres-rapides-label">Filtres rapides :</span>
                    <PiluleFiltre
                        statut="en_attente"
                        label="En attente"
                        compteur={compteurs.en_attente || 0}
                        actif={filtreStatut === 'en_attente'}
                        onClick={() => setFiltreStatut(filtreStatut === 'en_attente' ? '' : 'en_attente')}
                    />
                    <PiluleFiltre
                        statut="accepte"
                        label="Accepté"
                        compteur={compteurs.accepte || 0}
                        actif={filtreStatut === 'accepte'}
                        onClick={() => setFiltreStatut(filtreStatut === 'accepte' ? '' : 'accepte')}
                    />
                    <PiluleFiltre
                        statut="en_preparation"
                        label="En préparation"
                        compteur={compteurs.en_preparation || 0}
                        actif={filtreStatut === 'en_preparation'}
                        onClick={() => setFiltreStatut(filtreStatut === 'en_preparation' ? '' : 'en_preparation')}
                    />
                    <PiluleFiltre
                        statut="en_cours_livraison"
                        label="En livraison"
                        compteur={compteurs.en_cours_livraison || 0}
                        actif={filtreStatut === 'en_cours_livraison'}
                        onClick={() =>
                            setFiltreStatut(filtreStatut === 'en_cours_livraison' ? '' : 'en_cours_livraison')
                        }
                    />
                    <PiluleFiltre
                        statut="livre"
                        label="Livré"
                        compteur={compteurs.livre || 0}
                        actif={filtreStatut === 'livre'}
                        onClick={() => setFiltreStatut(filtreStatut === 'livre' ? '' : 'livre')}
                    />
                    <button
                        type="button"
                        onClick={reinitialiserFiltres}
                        className="gc-pilule-reset"
                    >
                        <RotateCcw size={14} />
                        Réinitialiser
                    </button>
                </div>
            </section>

            {/* ===== TABLE ===== */}
            <section className="gc-table-bloc">
                <div className="table-responsive">
                    <table className="gc-table table-cartes">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" aria-label="Tout sélectionner" />
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => changerTri('numero_commande')}
                                        className="gc-table-tri"
                                    >
                                        N° COMMANDE
                                    </button>
                                </th>
                                <th>CLIENT</th>
                                <th>MENU</th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => changerTri('date_prestation')}
                                        className="gc-table-tri"
                                    >
                                        DATE / HEURE
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => changerTri('nombre_personnes')}
                                        className="gc-table-tri"
                                    >
                                        PERSONNES
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => changerTri('prix')}
                                        className="gc-table-tri"
                                    >
                                        MONTANT
                                    </button>
                                </th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commandesAffichees.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center text-muted py-4">
                                        Aucune commande ne correspond aux filtres.
                                    </td>
                                </tr>
                            ) : (
                                commandesAffichees.map((cmd) => (
                                    <tr key={cmd.numero_commande}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                aria-label={`Sélectionner ${cmd.numero_commande}`}
                                            />
                                        </td>
                                        <td data-label="N° commande" className="gc-table-numero">
                                            <Link
                                                to={`${racine}/commandes/${cmd.numero_commande}`}
                                                className="gc-table-lien"
                                            >
                                                {cmd.numero_commande}
                                            </Link>
                                        </td>
                                        <td data-label="Client" className="td-stack">
                                            <div className="gc-table-client">
                                                <div className="gc-table-avatar" aria-hidden="true">
                                                    {cmd.client_prenom?.[0]?.toUpperCase()}
                                                    {cmd.client_nom?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="gc-table-client-infos">
                                                    <div className="gc-table-client-nom">
                                                        {cmd.client_prenom} {cmd.client_nom}
                                                    </div>
                                                    <div className="gc-table-client-email">
                                                        {cmd.client_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Menu">{cmd.menu_titre || '—'}</td>
                                        <td data-label="Date prestation">
                                            <div className="gc-table-date">
                                                {cmd.date_prestation
                                                    ? new Date(cmd.date_prestation).toLocaleDateString('fr-FR', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '—'}
                                                {cmd.heure_livraison && (
                                                    <div className="gc-table-heure">{cmd.heure_livraison}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td data-label="Personnes">{cmd.nombre_personnes}</td>
                                        <td data-label="Montant" className="fw-medium">
                                            {(
                                                Number(cmd.prix_menu || 0) +
                                                Number(cmd.prix_livraison || 0)
                                            ).toFixed(0)}{' '}
                                            €
                                        </td>
                                        <td data-label="Statut">
                                            <BadgeStatut statut={cmd.statut} />
                                        </td>
                                        <td className="td-actions">
                                            <div className="d-flex gap-2">
                                                <Link
                                                    to={`${racine}/commandes/${cmd.numero_commande}`}
                                                    className="gc-table-action"
                                                    title="Voir le détail"
                                                    aria-label="Voir le détail"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                {cmd.statut === 'en_attente' && (
                                                    <Link
                                                        to={`${racine}/commandes/${cmd.numero_commande}`}
                                                        className="gc-table-action"
                                                        title="Faire avancer"
                                                        aria-label="Faire avancer le statut"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer avec infinite scroll (remplace l'ancienne pagination) */}
                <div className="gc-pagination">
                    <div className="gc-pagination-info">
                        {commandesFiltrees.length === 0
                            ? '0 résultat'
                            : aPlus
                              ? `Affichage de ${commandesAffichees.length} sur ${commandesFiltrees.length} commandes — ${restant} de plus en scrollant…`
                              : `${commandesFiltrees.length} commande${commandesFiltrees.length > 1 ? 's' : ''}`}
                    </div>
                </div>

                {/* Sentinelle pour l'infinite scroll */}
                {aPlus && <div ref={sentinelleRef} style={{ height: 1 }} aria-hidden="true" />}
            </section>

            {/* Modale "fonctionnalite a venir" */}
            {modaleOuverte && (
                <div
                    className="gc-modale-overlay"
                    onClick={() => setModaleOuverte(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modale-titre"
                >
                    <div className="gc-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 id="modale-titre" className="titre-serif">Nouvelle commande</h3>
                        <p>
                            La création de commande par un employé n'est pas encore disponible.
                            Cette fonctionnalité sera ajoutée dans une prochaine itération.
                        </p>
                        <p className="text-muted">
                            En attendant, le client peut commander directement depuis l'espace public.
                        </p>
                        <button
                            type="button"
                            onClick={() => setModaleOuverte(false)}
                            className="btn btn-primary"
                        >
                            Compris
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ===== Sous-composants =====

function PiluleFiltre({
    statut,
    label,
    compteur,
    actif,
    onClick,
}: {
    statut: StatutCommande
    label: string
    compteur: number
    actif: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`gc-pilule gc-pilule--${statut} ${actif ? 'gc-pilule--actif' : ''}`}
            aria-pressed={actif}
        >
            {label}
            <span className="gc-pilule-compteur">{compteur}</span>
        </button>
    )
}

function BadgeStatut({ statut }: { statut: string }) {
    const map: Record<string, { label: string; classe: string }> = {
        en_attente: { label: 'En attente', classe: 'gc-badge--en-attente' },
        accepte: { label: 'Accepté', classe: 'gc-badge--accepte' },
        en_preparation: { label: 'En préparation', classe: 'gc-badge--en-preparation' },
        en_cours_livraison: { label: 'En livraison', classe: 'gc-badge--en-livraison' },
        livre: { label: 'Livré', classe: 'gc-badge--livre' },
        attente_retour_materiel: { label: 'Retour matériel', classe: 'gc-badge--attente-retour' },
        terminee: { label: 'Terminée', classe: 'gc-badge--terminee' },
        annulee: { label: 'Annulée', classe: 'gc-badge--annulee' },
    }
    const info = map[statut] || { label: statut, classe: 'gc-badge--terminee' }
    return <span className={`gc-badge ${info.classe}`}>{info.label}</span>
}

// Note : la fonction de pagination paginee a ete remplacee par
// l'infinite scroll (hook useInfiniteList).
