// Page Liste des menus - admin/employe.
// KPIs + filtres + table avec actions CRUD.

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Plus,
    Pencil,
    Copy,
    Trash2,
    Search,
    UtensilsCrossed,
    CheckCircle,
    PauseCircle,
    AlertTriangle,
} from 'lucide-react'
import { api } from '../../../services/api'
import type { Menu } from '../../../types'
import KpiCarte from '../../../components/admin/KpiCarte'
import './ListeMenus.css'

interface Theme {
    theme_id: number
    libelle: string
}

interface Props {
    racine: '/admin' | '/employe'
}

export default function ListeMenus({ racine }: Props) {
    const navigate = useNavigate()
    const [menus, setMenus] = useState<Menu[]>([])
    const [themes, setThemes] = useState<Theme[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)

    // Filtres
    const [recherche, setRecherche] = useState('')
    const [filtreTheme, setFiltreTheme] = useState('')
    const [filtreStatut, setFiltreStatut] = useState<'tous' | 'actif' | 'inactif' | 'rupture'>('tous')

    // Modale de confirmation suppression
    const [menuASupprimer, setMenuASupprimer] = useState<Menu | null>(null)
    const [suppressionEnCours, setSuppressionEnCours] = useState(false)

    // Messages temporaires
    const [messageOk, setMessageOk] = useState<string | null>(null)

    async function charger() {
        try {
            setChargement(true)
            setErreur(null)
            const [resMenus, resThemes] = await Promise.all([
                api.get<{ menus: Menu[] }>('/api/menus'),
                api.get<{ themes: Theme[] }>('/api/themes'),
            ])
            setMenus(resMenus.menus || [])
            setThemes(resThemes.themes || [])
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger les menus.')
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

    // KPIs
    // Note : pas de champ `actif` en BDD, on derive depuis quantite_restante
    // > 0 = actif/disponible, = 0 = rupture de stock
    const kpis = useMemo(() => {
        const total = menus.length
        const rupture = menus.filter((m) => m.quantite_restante === 0).length
        const actifs = menus.filter((m) => m.quantite_restante > 0).length
        // Inactif = on n'a pas la donnee, on garde 0 pour l'instant
        const inactifs = 0
        return { total, actifs, inactifs, rupture }
    }, [menus])

    // Filtrage
    const menusFiltres = useMemo(() => {
        return menus.filter((m) => {
            // Recherche texte
            if (recherche.trim()) {
                const q = recherche.toLowerCase()
                const match =
                    m.titre?.toLowerCase().includes(q) ||
                    m.theme?.toLowerCase().includes(q) ||
                    m.description?.toLowerCase().includes(q)
                if (!match) return false
            }
            // Theme
            if (filtreTheme && m.theme !== filtreTheme) return false
            // Statut
            if (filtreStatut === 'actif' && m.quantite_restante === 0) return false
            if (filtreStatut === 'rupture' && m.quantite_restante > 0) return false
            // Pour 'inactif' on aurait besoin d'un champ dedie (skipped pour l'instant)
            return true
        })
    }, [menus, recherche, filtreTheme, filtreStatut])

    async function confirmerSuppression() {
        if (!menuASupprimer) return
        try {
            setSuppressionEnCours(true)
            await api.delete(`/api/menus/${menuASupprimer.menu_id}`)
            setMenus((prev) => prev.filter((m) => m.menu_id !== menuASupprimer.menu_id))
            setMenuASupprimer(null)
            afficherSucces('Menu supprimé')
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de supprimer le menu.')
        } finally {
            setSuppressionEnCours(false)
        }
    }

    async function basculerStatut(menu: Menu) {
        // Le toggle simule un activation/desactivation en touchant quantite_restante.
        // Si le menu est en rupture (0), on lui remet 10 unites par defaut.
        // Si actif, on passe a 0 (rupture).
        const nouvelleQte = menu.quantite_restante > 0 ? 0 : 10
        try {
            await api.put(`/api/menus/${menu.menu_id}`, {
                titre: menu.titre,
                description: menu.description,
                nombrePersonnesMinimum: menu.nombre_personnes_minimum,
                prixParPersonne: Number(menu.prix_par_personne),
                conditions: menu.conditions,
                quantiteRestante: nouvelleQte,
                // themeId : il faut le renvoyer mais on n'a que le libelle...
                // On laisse le back gerer (on enverra null et le back doit accepter)
            })
            // On recharge pour rafraichir
            await charger()
            afficherSucces(
                nouvelleQte > 0 ? 'Menu réactivé (stock 10)' : 'Menu désactivé (rupture)'
            )
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de modifier le statut.')
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
        <div className="liste-menus">
            <header className="lm-entete">
                <div>
                    <h1 className="titre-serif lm-titre">Gestion des Menus</h1>
                    <p className="lm-sous-titre">Gérez vos menus et leurs compositions</p>
                </div>
                <Link to={`${racine}/menus/nouveau`} className="btn btn-primary">
                    <Plus size={16} className="me-2" />
                    Créer un nouveau menu
                </Link>
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

            {/* Filtres */}
            <section className="lm-filtres">
                <div className="lm-filtre-recherche">
                    <Search size={16} className="lm-filtre-recherche-icone" />
                    <input
                        type="search"
                        placeholder="Rechercher un menu par nom, catégorie..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="form-control"
                        aria-label="Rechercher"
                    />
                </div>
                <select
                    value={filtreTheme}
                    onChange={(e) => setFiltreTheme(e.target.value)}
                    className="form-select"
                    aria-label="Catégorie"
                >
                    <option value="">Toutes les catégories</option>
                    {themes.map((t) => (
                        <option key={t.theme_id} value={t.libelle}>
                            {t.libelle}
                        </option>
                    ))}
                </select>
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value as any)}
                    className="form-select"
                    aria-label="Statut"
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="actif">Actifs</option>
                    <option value="rupture">Rupture de stock</option>
                </select>
            </section>

            {/* KPIs */}
            <section className="lm-kpis">
                <KpiCarte
                    icone={<UtensilsCrossed size={22} />}
                    valeur={kpis.total}
                    label="Total menus"
                    couleurIcone="bordeaux"
                />
                <KpiCarte
                    icone={<CheckCircle size={22} />}
                    valeur={kpis.actifs}
                    label="Menus actifs"
                    couleurIcone="sauge"
                />
                <KpiCarte
                    icone={<PauseCircle size={22} />}
                    valeur={kpis.inactifs}
                    label="Menus inactifs"
                    couleurIcone="bleu"
                />
                <KpiCarte
                    icone={<AlertTriangle size={22} />}
                    valeur={kpis.rupture}
                    label="Rupture stock"
                    couleurIcone="or"
                />
            </section>

            {/* Table */}
            <section className="lm-table-bloc">
                <div className="table-responsive">
                    <table className="lm-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Tout sélectionner" /></th>
                                <th>IMAGE</th>
                                <th>NOM DU MENU</th>
                                <th>CATÉGORIE</th>
                                <th>PRIX/PERS.</th>
                                <th>MIN. PERS.</th>
                                <th>STOCK</th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menusFiltres.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center text-muted py-4">
                                        Aucun menu ne correspond aux filtres.
                                    </td>
                                </tr>
                            ) : (
                                menusFiltres.map((menu) => {
                                    const enRupture = menu.quantite_restante === 0
                                    const imageUrl = menu.image_principale?.url

                                    return (
                                        <tr
                                            key={menu.menu_id}
                                            className={`lm-row-clickable ${enRupture ? 'lm-row-rupture' : ''}`}
                                            onClick={() => navigate(`${racine}/menus/${menu.menu_id}`)}
                                        >
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Sélectionner ${menu.titre}`}
                                                />
                                            </td>
                                            <td>
                                                <div className="lm-image-cell">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={menu.titre} />
                                                    ) : (
                                                        <div className="lm-image-placeholder">
                                                            🍽️
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="lm-nom">
                                                    <strong className="lm-nom-lien">
                                                        {menu.titre}
                                                    </strong>
                                                    <div className="lm-nom-meta">
                                                        {menu.plats?.length || 0} plats •{' '}
                                                        {menu.description?.slice(0, 50)}
                                                        {(menu.description?.length || 0) > 50 ? '…' : ''}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="lm-badge-theme">{menu.theme}</span>
                                            </td>
                                            <td className="fw-medium">
                                                {Number(menu.prix_par_personne).toFixed(2)} €
                                            </td>
                                            <td>{menu.nombre_personnes_minimum} pers.</td>
                                            <td>
                                                {enRupture ? (
                                                    <div className="lm-stock-rupture">
                                                        <strong>0 unités</strong>
                                                        <div className="lm-stock-rupture-detail">
                                                            Rupture de stock
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="lm-stock-ok">
                                                        {menu.quantite_restante} unités
                                                    </span>
                                                )}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <label className="form-switch lm-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={!enRupture}
                                                        onChange={() => basculerStatut(menu)}
                                                        aria-label="Activer/désactiver le menu"
                                                    />
                                                </label>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="d-flex gap-2">
                                                    <Link
                                                        to={`${racine}/menus/${menu.menu_id}`}
                                                        className="lm-action lm-action-modifier"
                                                        title="Modifier"
                                                        aria-label="Modifier"
                                                    >
                                                        <Pencil size={14} />
                                                    </Link>
                                                    <Link
                                                        to={`${racine}/menus/nouveau?dupliquer=${menu.menu_id}`}
                                                        className="lm-action lm-action-dupliquer"
                                                        title="Dupliquer"
                                                        aria-label="Dupliquer"
                                                    >
                                                        <Copy size={14} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMenuASupprimer(menu)}
                                                        className="lm-action lm-action-supprimer"
                                                        title="Supprimer"
                                                        aria-label="Supprimer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="lm-table-footer">
                    Affichage de <strong>{menusFiltres.length}</strong> sur {menus.length} menus
                </div>
            </section>

            {/* Modale confirmation suppression */}
            {menuASupprimer && (
                <div
                    className="lm-modale-overlay"
                    onClick={() => setMenuASupprimer(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="lm-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Supprimer le menu ?</h3>
                        <p>
                            Êtes-vous sûr de vouloir supprimer définitivement{' '}
                            <strong>{menuASupprimer.titre}</strong> ?
                        </p>
                        <p className="text-muted">
                            Cette action est irréversible. Si des commandes existantes
                            utilisent ce menu, la suppression échouera.
                        </p>
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                onClick={() => setMenuASupprimer(null)}
                                className="btn btn-outline-primary"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={confirmerSuppression}
                                className="btn btn-danger"
                                disabled={suppressionEnCours}
                            >
                                {suppressionEnCours ? 'Suppression…' : 'Supprimer définitivement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
