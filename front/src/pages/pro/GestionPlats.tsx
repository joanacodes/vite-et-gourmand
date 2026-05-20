// Gestion des plats - admin/employe
// CRUD : creer, modifier, supprimer un plat avec ses allergenes.

import { useState, useEffect, useMemo } from 'react'
import type { FormEvent } from 'react'
import { Plus, Pencil, Trash2, Search, Soup, X } from 'lucide-react'
import { api } from '../../services/api'
import type { Plat } from '../../types'
import KpiCarte from '../../components/admin/KpiCarte'
import './GestionPlats.css'

interface Allergene {
    allergene_id: number
    libelle: string
}

interface PlatAvecAllergenes extends Plat {
    allergenes?: Allergene[]
}

interface Props {
    racine: '/admin' | '/employe'
}

const TYPES_PLAT = [
    { key: 'entree', label: 'Entrée' },
    { key: 'plat', label: 'Plat principal' },
    { key: 'dessert', label: 'Dessert' },
] as const

export default function GestionPlats({}: Props) {
    const [plats, setPlats] = useState<PlatAvecAllergenes[]>([])
    const [allergenes, setAllergenes] = useState<Allergene[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)

    // Filtres
    const [recherche, setRecherche] = useState('')
    const [filtreType, setFiltreType] = useState<string>('')
    const [filtreAllergene, setFiltreAllergene] = useState<string>('')

    // Modale creation/edition
    const [modaleOuverte, setModaleOuverte] = useState(false)
    const [platEnEdition, setPlatEnEdition] = useState<PlatAvecAllergenes | null>(null)

    // Champs formulaire
    const [formTitre, setFormTitre] = useState('')
    const [formType, setFormType] = useState<Plat['type']>('entree')
    const [formAllergenes, setFormAllergenes] = useState<number[]>([])
    const [enregistrement, setEnregistrement] = useState(false)

    // Modale suppression
    const [platASupprimer, setPlatASupprimer] = useState<PlatAvecAllergenes | null>(null)
    const [suppressionEnCours, setSuppressionEnCours] = useState(false)

    async function charger() {
        try {
            setChargement(true)
            setErreur(null)
            const [resPlats, resAllergenes] = await Promise.all([
                api.get<{ plats: PlatAvecAllergenes[] }>('/api/plats'),
                api.get<{ allergenes: Allergene[] }>('/api/allergenes'),
            ])
            setPlats(resPlats.plats || [])
            setAllergenes(resAllergenes.allergenes || [])
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger les plats.')
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
    const kpis = useMemo(() => {
        const parType: Record<string, number> = { entree: 0, plat: 0, dessert: 0 }
        plats.forEach((p) => {
            if (parType[p.type] !== undefined) parType[p.type]++
        })
        const avecAllergene = plats.filter((p) => (p.allergenes?.length || 0) > 0).length
        return {
            total: plats.length,
            entrees: parType.entree,
            plats: parType.plat,
            desserts: parType.dessert,
            avecAllergene,
        }
    }, [plats])

    // Filtrage
    const platsFiltres = useMemo(() => {
        return plats.filter((p) => {
            if (recherche.trim()) {
                const q = recherche.toLowerCase()
                if (!p.titre.toLowerCase().includes(q)) return false
            }
            if (filtreType && p.type !== filtreType) return false
            if (filtreAllergene) {
                const id = parseInt(filtreAllergene)
                if (!p.allergenes?.some((a) => a.allergene_id === id)) return false
            }
            return true
        })
    }, [plats, recherche, filtreType, filtreAllergene])

    function ouvrirModaleCreation() {
        setPlatEnEdition(null)
        setFormTitre('')
        setFormType('entree')
        setFormAllergenes([])
        setModaleOuverte(true)
    }

    function ouvrirModaleEdition(plat: PlatAvecAllergenes) {
        setPlatEnEdition(plat)
        setFormTitre(plat.titre)
        setFormType(plat.type)
        setFormAllergenes(plat.allergenes?.map((a) => a.allergene_id) || [])
        setModaleOuverte(true)
    }

    function basculerAllergene(id: number) {
        setFormAllergenes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    async function soumettre(e: FormEvent) {
        e.preventDefault()
        if (!formTitre.trim()) return
        try {
            setEnregistrement(true)
            setErreur(null)
            const payload = {
                titre: formTitre.trim(),
                type: formType,
                allergenes: formAllergenes,
            }
            if (platEnEdition) {
                await api.put(`/api/plats/${platEnEdition.plat_id}`, payload)
                afficherSucces('Plat modifié')
            } else {
                await api.post('/api/plats', payload)
                afficherSucces('Plat créé')
            }
            setModaleOuverte(false)
            await charger()
        } catch (err: any) {
            setErreur(err?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setEnregistrement(false)
        }
    }

    async function confirmerSuppression() {
        if (!platASupprimer) return
        try {
            setSuppressionEnCours(true)
            await api.delete(`/api/plats/${platASupprimer.plat_id}`)
            setPlats((prev) => prev.filter((p) => p.plat_id !== platASupprimer.plat_id))
            setPlatASupprimer(null)
            afficherSucces('Plat supprimé')
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de supprimer le plat (peut-être utilisé dans un menu).')
        } finally {
            setSuppressionEnCours(false)
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
        <div className="gestion-plats">
            <header className="gp-entete">
                <div>
                    <h1 className="titre-serif gp-titre">Gestion des Plats</h1>
                    <p className="gp-sous-titre">Catalogue des plats utilisés dans les menus</p>
                </div>
                <button type="button" onClick={ouvrirModaleCreation} className="btn btn-primary">
                    <Plus size={16} className="me-2" />
                    Nouveau plat
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

            {/* KPIs */}
            <section className="gp-kpis">
                <KpiCarte
                    icone={<Soup size={22} />}
                    valeur={kpis.total}
                    label="Total plats"
                    couleurIcone="bordeaux"
                />
                <KpiCarte
                    icone={<Soup size={22} />}
                    valeur={kpis.entrees}
                    label="Entrées"
                    couleurIcone="sauge"
                />
                <KpiCarte
                    icone={<Soup size={22} />}
                    valeur={kpis.plats}
                    label="Plats principaux"
                    couleurIcone="bleu"
                />
                <KpiCarte
                    icone={<Soup size={22} />}
                    valeur={kpis.desserts}
                    label="Desserts"
                    couleurIcone="or"
                />
            </section>

            {/* Filtres */}
            <section className="gp-filtres">
                <div className="gp-filtre-recherche">
                    <Search size={16} className="gp-filtre-icone" />
                    <input
                        type="search"
                        placeholder="Rechercher un plat..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="form-control"
                    />
                </div>
                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="form-select"
                    aria-label="Type"
                >
                    <option value="">Tous les types</option>
                    {TYPES_PLAT.map((t) => (
                        <option key={t.key} value={t.key}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filtreAllergene}
                    onChange={(e) => setFiltreAllergene(e.target.value)}
                    className="form-select"
                    aria-label="Allergène"
                >
                    <option value="">Tous les allergènes</option>
                    {allergenes.map((a) => (
                        <option key={a.allergene_id} value={a.allergene_id}>
                            {a.libelle}
                        </option>
                    ))}
                </select>
            </section>

            {/* Table */}
            <section className="gp-table-bloc">
                <div className="table-responsive">
                    <table className="gp-table">
                        <thead>
                            <tr>
                                <th>NOM DU PLAT</th>
                                <th>TYPE</th>
                                <th>ALLERGÈNES</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platsFiltres.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted py-4">
                                        Aucun plat ne correspond aux filtres.
                                    </td>
                                </tr>
                            ) : (
                                platsFiltres.map((p) => (
                                    <tr key={p.plat_id}>
                                        <td>
                                            <strong>{p.titre}</strong>
                                        </td>
                                        <td>
                                            <span className={`gp-badge gp-badge--${p.type}`}>
                                                {TYPES_PLAT.find((t) => t.key === p.type)?.label || p.type}
                                            </span>
                                        </td>
                                        <td>
                                            {p.allergenes && p.allergenes.length > 0 ? (
                                                <div className="gp-chips">
                                                    {p.allergenes.map((a) => (
                                                        <span key={a.allergene_id} className="gp-chip">
                                                            {a.libelle}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => ouvrirModaleEdition(p)}
                                                    className="gp-action gp-action-modifier"
                                                    title="Modifier"
                                                    aria-label="Modifier"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPlatASupprimer(p)}
                                                    className="gp-action gp-action-supprimer"
                                                    title="Supprimer"
                                                    aria-label="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="gp-table-footer">
                    <strong>{platsFiltres.length}</strong> sur {plats.length} plats
                </div>
            </section>

            {/* Modale creation / edition */}
            {modaleOuverte && (
                <div
                    className="gp-modale-overlay"
                    onClick={() => setModaleOuverte(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="gp-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">
                            {platEnEdition ? 'Modifier le plat' : 'Nouveau plat'}
                        </h3>
                        <form onSubmit={soumettre}>
                            <div className="mb-3">
                                <label htmlFor="plat-titre" className="form-label fw-medium">
                                    Nom du plat *
                                </label>
                                <input
                                    id="plat-titre"
                                    type="text"
                                    className="form-control"
                                    value={formTitre}
                                    onChange={(e) => setFormTitre(e.target.value)}
                                    placeholder="Ex: Foie gras maison"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="plat-type" className="form-label fw-medium">
                                    Type *
                                </label>
                                <select
                                    id="plat-type"
                                    className="form-select"
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as Plat['type'])}
                                    required
                                >
                                    {TYPES_PLAT.map((t) => (
                                        <option key={t.key} value={t.key}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-medium">Allergènes</label>
                                <div className="gp-allergenes">
                                    {allergenes.map((a) => {
                                        const coche = formAllergenes.includes(a.allergene_id)
                                        return (
                                            <label
                                                key={a.allergene_id}
                                                className={`gp-allergene-chip ${coche ? 'gp-allergene-chip--actif' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={coche}
                                                    onChange={() => basculerAllergene(a.allergene_id)}
                                                />
                                                {a.libelle}
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="d-flex gap-2 justify-content-end">
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
                                    disabled={enregistrement || !formTitre.trim()}
                                >
                                    {enregistrement
                                        ? 'Enregistrement…'
                                        : platEnEdition
                                          ? 'Sauvegarder'
                                          : 'Créer le plat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modale suppression */}
            {platASupprimer && (
                <div
                    className="gp-modale-overlay"
                    onClick={() => setPlatASupprimer(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="gp-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">Supprimer le plat ?</h3>
                        <p>
                            Êtes-vous sûr de vouloir supprimer <strong>{platASupprimer.titre}</strong> ?
                        </p>
                        <p className="text-muted">
                            Si ce plat est utilisé dans un menu, la suppression échouera.
                        </p>
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                onClick={() => setPlatASupprimer(null)}
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
                                {suppressionEnCours ? 'Suppression…' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
