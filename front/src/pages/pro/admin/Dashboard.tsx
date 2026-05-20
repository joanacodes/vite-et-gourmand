// Tableau de bord admin - vue globale de l'activite.
// Maquette : KPIs + 2 graphiques + commandes recentes + comptes employes

import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ShoppingCart,
    Euro,
    UserPlus,
    Star,
    Plus,
    MoreVertical,
    Check,
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    CartesianGrid,
} from 'recharts'
import { api } from '../../../services/api'
import type { Commande } from '../../../types'
import KpiCarte from '../../../components/admin/KpiCarte'
import './Dashboard.css'

// Type local : ce que renvoie GET /api/utilisateurs (snake_case)
interface UtilisateurListe {
    utilisateur_id: number
    email: string
    nom: string
    prenom: string
    actif: boolean
    date_creation: string
    role: string
}

// Couleurs du donut chart, dans l'ordre de la charte
const COULEURS_GRAPHIQUE = [
    '#7B2D26', // bordeaux
    '#3E5C4A', // vert sauge
    '#1F3A5F', // bleu nuit
    '#C9A875', // ocre/or
    '#9CA3AF', // gris
    '#A06B5C', // bordeaux clair
    '#5B8270', // sauge clair
]

interface ReponseDashboard {
    commandes: { total: number }
    chiffreAffaires: { total: number }
    utilisateurs: { actifs: number }
    avis: { valides: number; noteMoyenne: number }
    traffic: { consultationsMenus: number }
}

interface MenuStat {
    menuId: number
    titre: string
    nombreCommandes: number
}

interface MenuCaStat {
    menuId: number
    titre: string
    nombreCommandes: number
    chiffreAffaires: number
}

type Periode = 'semaine' | 'mois' | 'annee' | 'tout'

export default function Dashboard() {
    // Donnees dashboard
    const [stats, setStats] = useState<ReponseDashboard | null>(null)
    const [commandesParMenu, setCommandesParMenu] = useState<MenuStat[]>([])
    const [caParMenu, setCaParMenu] = useState<MenuCaStat[]>([])
    const [commandesRecentes, setCommandesRecentes] = useState<Commande[]>([])
    const [employes, setEmployes] = useState<UtilisateurListe[]>([])

    // Filtres periode pour les graphiques
    const [periodeCommandes, setPeriodeCommandes] = useState<Periode>('annee')
    const [periodeCa, setPeriodeCa] = useState<Periode>('annee')
    const [menuFiltreCa, setMenuFiltreCa] = useState<string>('tous')

    // Filtres commandes recentes
    const [filtreStatut, setFiltreStatut] = useState<string>('')
    const [filtreRecherche, setFiltreRecherche] = useState<string>('')

    // Chargement
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    // Menu contextuel "3 points" sur les commandes recentes
    const [menuOuvert, setMenuOuvert] = useState<string | null>(null)
    const [majStatutEnCours, setMajStatutEnCours] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const navigate = useNavigate()

    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function gererClicExterieur(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOuvert(null)
            }
        }
        if (menuOuvert) {
            document.addEventListener('mousedown', gererClicExterieur)
            return () => document.removeEventListener('mousedown', gererClicExterieur)
        }
    }, [menuOuvert])

    // Premier chargement : on recupere tout en parallele
    useEffect(() => {
        async function chargerTout() {
            try {
                setChargement(true)
                setErreur(null)

                const [dash, cmdes, ca, derniers, emp] = await Promise.all([
                    api.get<ReponseDashboard>('/api/stats/dashboard'),
                    api.get<{ menus: MenuStat[] }>(`/api/stats/commandes-par-menu?periode=${periodeCommandes}`),
                    api.get<{ menus: MenuCaStat[] }>(`/api/stats/ca-par-menu?periode=${periodeCa}`),
                    api.get<{ commandes: Commande[] }>('/api/commandes?limit=10'),
                    api.get<{ utilisateurs: UtilisateurListe[] }>('/api/utilisateurs?role=employe'),
                ])

                setStats(dash)
                setCommandesParMenu(cmdes.menus || [])
                setCaParMenu(ca.menus || [])
                setCommandesRecentes(derniers.commandes || [])
                setEmployes(emp.utilisateurs || [])
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger le tableau de bord.')
            } finally {
                setChargement(false)
            }
        }
        chargerTout()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Rechargement uniquement du graphique commandes quand la periode change
    useEffect(() => {
        async function recharger() {
            try {
                const data = await api.get<{ menus: MenuStat[] }>(
                    `/api/stats/commandes-par-menu?periode=${periodeCommandes}`
                )
                setCommandesParMenu(data.menus || [])
            } catch {
                // On garde les donnees actuelles en cas d'erreur
            }
        }
        // On evite de recharger au premier rendu (deja fait dans chargerTout)
        if (!chargement) recharger()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodeCommandes])

    // Idem pour le CA
    useEffect(() => {
        async function recharger() {
            try {
                const params = new URLSearchParams({ periode: periodeCa })
                if (menuFiltreCa !== 'tous') {
                    params.set('menuId', menuFiltreCa)
                }
                const data = await api.get<{ menus: MenuCaStat[] }>(
                    `/api/stats/ca-par-menu?${params.toString()}`
                )
                setCaParMenu(data.menus || [])
            } catch {
                // idem
            }
        }
        if (!chargement) recharger()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodeCa, menuFiltreCa])

    // Filtrage des commandes recentes cote client
    const commandesFiltrees = useMemo(() => {
        let liste = commandesRecentes
        if (filtreStatut) {
            liste = liste.filter((c) => c.statut === filtreStatut)
        }
        if (filtreRecherche.trim()) {
            const recherche = filtreRecherche.toLowerCase()
            liste = liste.filter(
                (c) =>
                    c.numero_commande?.toLowerCase().includes(recherche) ||
                    c.client_prenom?.toLowerCase().includes(recherche) ||
                    c.client_nom?.toLowerCase().includes(recherche) ||
                    c.menu_titre?.toLowerCase().includes(recherche)
            )
        }
        return liste.slice(0, 6)
    }, [commandesRecentes, filtreStatut, filtreRecherche])

    // Changement rapide de statut depuis le menu contextuel
    async function changerStatutRapide(numero: string, nouveauStatut: string) {
        try {
            setMajStatutEnCours(numero)
            await api.put(`/api/commandes/${numero}/statut`, { statut: nouveauStatut })
            // Mise a jour locale
            setCommandesRecentes((prev) =>
                prev.map((c) =>
                    c.numero_commande === numero
                        ? { ...c, statut: nouveauStatut as any }
                        : c
                )
            )
            setMenuOuvert(null)
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de changer le statut.')
        } finally {
            setMajStatutEnCours(null)
        }
    }

    // Donnees pour le donut chart CA par menu (limite a 5 top + autres)
    const donutData = useMemo(() => {
        if (caParMenu.length === 0) return []
        const tries = [...caParMenu].sort((a, b) => b.chiffreAffaires - a.chiffreAffaires)
        if (tries.length <= 5) return tries
        const top5 = tries.slice(0, 5)
        const autresCa = tries.slice(5).reduce((sum, m) => sum + m.chiffreAffaires, 0)
        if (autresCa > 0) {
            return [...top5, { menuId: -1, titre: 'Autres', nombreCommandes: 0, chiffreAffaires: autresCa }]
        }
        return top5
    }, [caParMenu])

    if (chargement) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    if (erreur) {
        return (
            <div>
                <h1 className="titre-serif dashboard-titre">Tableau de bord</h1>
                <div className="alert alert-danger mt-3" role="alert">
                    {erreur}
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <h1 className="titre-serif dashboard-titre">Tableau de bord</h1>

            {/* ===== KPIs ===== */}
            <section className="dashboard-kpis" aria-label="Indicateurs clés">
                <KpiCarte
                    icone={<ShoppingCart size={22} />}
                    valeur={stats?.commandes.total ?? 0}
                    label="Commandes ce mois"
                    variation={{ valeur: 12, suffixe: 'vs mois dernier' }}
                    couleurIcone="bordeaux"
                />
                <KpiCarte
                    icone={<Euro size={22} />}
                    valeur={`${Math.round(stats?.chiffreAffaires.total ?? 0).toLocaleString('fr-FR')} €`}
                    label="Chiffre d'affaires"
                    variation={{ valeur: 8, suffixe: 'vs mois dernier' }}
                    couleurIcone="sauge"
                />
                <KpiCarte
                    icone={<UserPlus size={22} />}
                    valeur={stats?.utilisateurs.actifs ?? 0}
                    label="Clients actifs"
                    variation={{ valeur: 15, suffixe: 'vs mois dernier' }}
                    couleurIcone="bleu"
                />
                <KpiCarte
                    icone={<Star size={22} />}
                    valeur={`${(stats?.avis.noteMoyenne ?? 0).toFixed(1)}/5`}
                    label="Note moyenne"
                    couleurIcone="or"
                />
            </section>

            {/* ===== GRAPHIQUES ===== */}
            <section className="dashboard-graphiques">
                {/* Commandes par menu (barres horizontales) */}
                <div className="dashboard-carte">
                    <div className="dashboard-carte-entete">
                        <h2 className="titre-serif dashboard-carte-titre">Commandes par menu</h2>
                        <select
                            value={periodeCommandes}
                            onChange={(e) => setPeriodeCommandes(e.target.value as Periode)}
                            className="form-select form-select-sm dashboard-select"
                            aria-label="Période"
                        >
                            <option value="semaine">Cette semaine</option>
                            <option value="mois">Ce mois</option>
                            <option value="annee">Cette année</option>
                            <option value="tout">Depuis le début</option>
                        </select>
                    </div>

                    {commandesParMenu.length === 0 ? (
                        <p className="text-muted text-center py-4">
                            Aucune commande pour la période sélectionnée.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={commandesParMenu}
                                layout="vertical"
                                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="titre"
                                    stroke="#6B7280"
                                    fontSize={12}
                                    width={130}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#FFFFFF',
                                        border: '1px solid #E8E8E8',
                                        borderRadius: 8,
                                    }}
                                    formatter={(v: number) => [`${v} commandes`, '']}
                                />
                                <Bar dataKey="nombreCommandes" radius={[0, 6, 6, 0]}>
                                    {commandesParMenu.map((_, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={COULEURS_GRAPHIQUE[idx % COULEURS_GRAPHIQUE.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* CA par menu (donut) */}
                <div className="dashboard-carte">
                    <div className="dashboard-carte-entete">
                        <h2 className="titre-serif dashboard-carte-titre">CA par menu</h2>
                        <div className="d-flex gap-2 flex-wrap">
                            <select
                                value={menuFiltreCa}
                                onChange={(e) => setMenuFiltreCa(e.target.value)}
                                className="form-select form-select-sm dashboard-select"
                                aria-label="Menu"
                            >
                                <option value="tous">Tous les menus</option>
                                {caParMenu.map((m) => (
                                    <option key={m.menuId} value={m.menuId}>
                                        {m.titre}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={periodeCa}
                                onChange={(e) => setPeriodeCa(e.target.value as Periode)}
                                className="form-select form-select-sm dashboard-select"
                                aria-label="Période"
                            >
                                <option value="semaine">Cette semaine</option>
                                <option value="mois">Ce mois</option>
                                <option value="annee">Cette année</option>
                                <option value="tout">Depuis le début</option>
                            </select>
                        </div>
                    </div>

                    {donutData.length === 0 || donutData.every((d) => d.chiffreAffaires === 0) ? (
                        <p className="text-muted text-center py-4">
                            Aucun chiffre d'affaires pour la période sélectionnée.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    dataKey="chiffreAffaires"
                                    nameKey="titre"
                                    innerRadius={55}
                                    outerRadius={95}
                                    paddingAngle={2}
                                    label={(props: any) => {
                                        const total = donutData.reduce(
                                            (sum, d) => sum + d.chiffreAffaires,
                                            0
                                        )
                                        if (total === 0) return ''
                                        const pct = (props.value / total) * 100
                                        // On masque les tranches de moins de 5% pour ne pas surcharger
                                        if (pct < 5) return ''
                                        return `${pct.toFixed(0)}%`
                                    }}
                                    labelLine={false}
                                >
                                    {donutData.map((_, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={COULEURS_GRAPHIQUE[idx % COULEURS_GRAPHIQUE.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number) => {
                                        const total = donutData.reduce(
                                            (sum, d) => sum + d.chiffreAffaires,
                                            0
                                        )
                                        const pct = total > 0 ? (v / total) * 100 : 0
                                        return [
                                            `${v.toFixed(2)} € (${pct.toFixed(1)}%)`,
                                            'CA',
                                        ]
                                    }}
                                    contentStyle={{
                                        background: '#FFFFFF',
                                        border: '1px solid #E8E8E8',
                                        borderRadius: 8,
                                    }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: 12 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            {/* ===== COMMANDES RECENTES ===== */}
            <section className="dashboard-carte dashboard-section">
                <div className="dashboard-carte-entete">
                    <h2 className="titre-serif dashboard-carte-titre">Commandes récentes</h2>
                </div>

                <div className="dashboard-filtres">
                    <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="form-select form-select-sm"
                        aria-label="Filtrer par statut"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="accepte">Accepté</option>
                        <option value="en_preparation">En préparation</option>
                        <option value="en_cours_livraison">En livraison</option>
                        <option value="livre">Livré</option>
                        <option value="terminee">Terminée</option>
                        <option value="annulee">Annulée</option>
                    </select>
                    <input
                        type="search"
                        placeholder="Rechercher une commande..."
                        value={filtreRecherche}
                        onChange={(e) => setFiltreRecherche(e.target.value)}
                        className="form-control form-control-sm flex-grow-1"
                        aria-label="Recherche"
                    />
                </div>

                <div className="table-responsive">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>N° commande</th>
                                <th>Client</th>
                                <th>Menu</th>
                                <th>Date prestation</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {commandesFiltrees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-4">
                                        Aucune commande à afficher.
                                    </td>
                                </tr>
                            ) : (
                                commandesFiltrees.map((cmd) => {
                                    const statutsPossibles: Array<{ key: string; label: string }> = [
                                        { key: 'en_attente', label: 'En attente' },
                                        { key: 'accepte', label: 'Accepté' },
                                        { key: 'en_preparation', label: 'En préparation' },
                                        { key: 'en_cours_livraison', label: 'En livraison' },
                                        { key: 'livre', label: 'Livré' },
                                        { key: 'terminee', label: 'Terminée' },
                                    ]
                                    return (
                                        <tr
                                            key={cmd.numero_commande}
                                            className="dashboard-table-row-clickable"
                                            onClick={() =>
                                                navigate(`/admin/commandes/${cmd.numero_commande}`)
                                            }
                                        >
                                            <td className="dashboard-table-numero">
                                                <span className="dashboard-table-lien">
                                                    {cmd.numero_commande}
                                                </span>
                                            </td>
                                            <td>
                                                {cmd.client_prenom} {cmd.client_nom}
                                            </td>
                                            <td>{cmd.menu_titre || '—'}</td>
                                            <td>
                                                {cmd.date_prestation
                                                    ? new Date(cmd.date_prestation).toLocaleDateString('fr-FR', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="fw-medium">
                                                {(
                                                    Number(cmd.prix_menu || 0) +
                                                    Number(cmd.prix_livraison || 0)
                                                ).toFixed(2)}{' '}
                                                €
                                            </td>
                                            <td>
                                                <BadgeStatut statut={cmd.statut} />
                                            </td>
                                            <td
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ position: 'relative' }}
                                            >
                                                <button
                                                    type="button"
                                                    className="dashboard-table-action"
                                                    aria-label="Changer le statut"
                                                    aria-haspopup="menu"
                                                    aria-expanded={menuOuvert === cmd.numero_commande}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMenuOuvert(
                                                            menuOuvert === cmd.numero_commande
                                                                ? null
                                                                : cmd.numero_commande
                                                        )
                                                    }}
                                                    disabled={majStatutEnCours === cmd.numero_commande}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {menuOuvert === cmd.numero_commande && (
                                                    <div
                                                        ref={menuRef}
                                                        className="dashboard-menu-contextuel"
                                                        role="menu"
                                                    >
                                                        <div className="dashboard-menu-titre">
                                                            Changer le statut
                                                        </div>
                                                        {statutsPossibles.map((s) => (
                                                            <button
                                                                key={s.key}
                                                                type="button"
                                                                role="menuitem"
                                                                className={`dashboard-menu-item ${cmd.statut === s.key ? 'dashboard-menu-item--actif' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (cmd.statut !== s.key) {
                                                                        changerStatutRapide(
                                                                            cmd.numero_commande,
                                                                            s.key
                                                                        )
                                                                    }
                                                                }}
                                                                disabled={cmd.statut === s.key}
                                                            >
                                                                {cmd.statut === s.key && (
                                                                    <Check size={12} />
                                                                )}
                                                                {s.label}
                                                            </button>
                                                        ))}
                                                        <hr className="dashboard-menu-sep" />
                                                        <Link
                                                            to={`/admin/commandes/${cmd.numero_commande}`}
                                                            className="dashboard-menu-item"
                                                            role="menuitem"
                                                            onClick={() => setMenuOuvert(null)}
                                                        >
                                                            Voir le détail complet →
                                                        </Link>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ===== COMPTES EMPLOYES ===== */}
            <section className="dashboard-carte dashboard-section">
                <div className="dashboard-carte-entete">
                    <h2 className="titre-serif dashboard-carte-titre">Comptes employés</h2>
                    <Link to="/admin/utilisateurs" className="btn btn-primary btn-sm">
                        <Plus size={16} className="me-1" />
                        Créer un compte employé
                    </Link>
                </div>

                <div className="table-responsive">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Nom</th>
                                <th>Date création</th>
                                <th>Statut</th>
                                <th aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {employes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        Aucun employé enregistré.
                                    </td>
                                </tr>
                            ) : (
                                employes.slice(0, 5).map((emp) => (
                                    <tr key={emp.utilisateur_id}>
                                        <td>{emp.email}</td>
                                        <td>
                                            {emp.prenom} {emp.nom}
                                        </td>
                                        <td>
                                            {emp.date_creation
                                                ? new Date(emp.date_creation).toLocaleDateString('fr-FR', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—'}
                                        </td>
                                        <td>
                                            <span
                                                className={`form-check form-switch d-inline-flex ${
                                                    emp.actif ? '' : ''
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={emp.actif}
                                                    readOnly
                                                    aria-label="Compte actif"
                                                />
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/admin/utilisateurs`}
                                                className={
                                                    emp.actif
                                                        ? 'dashboard-action-rouge'
                                                        : 'dashboard-action-verte'
                                                }
                                            >
                                                {emp.actif ? 'Désactiver' : 'Réactiver'}
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

// Petit composant interne pour afficher les badges de statut
function BadgeStatut({ statut }: { statut: string }) {
    const map: Record<string, { label: string; classe: string }> = {
        en_attente: { label: 'En attente', classe: 'badge-en-attente' },
        accepte: { label: 'Accepté', classe: 'badge-accepte' },
        en_preparation: { label: 'En préparation', classe: 'badge-en-preparation' },
        en_cours_livraison: { label: 'En livraison', classe: 'badge-en-livraison' },
        livre: { label: 'Livré', classe: 'badge-livre' },
        attente_retour_materiel: { label: 'Retour matériel', classe: 'badge-attente-retour' },
        terminee: { label: 'Terminée', classe: 'badge-terminee' },
        annulee: { label: 'Annulée', classe: 'badge-annulee' },
    }
    const info = map[statut] || { label: statut, classe: 'badge-terminee' }
    return <span className={`dashboard-badge ${info.classe}`}>{info.label}</span>
}
