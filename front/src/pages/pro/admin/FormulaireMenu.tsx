// Formulaire de creation / modification d'un menu.
// Route /admin/menus/nouveau (creation) ou /admin/menus/:id (edition)
//
// Sections : Infos principales, Tarification, Composition (plats),
// Regimes, Galerie d'images (URL externe pour l'instant), Apercu,
// Statut de publication.

import { useState, useEffect, useMemo } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, X, Plus, Star, Trash2, Check } from 'lucide-react'
import { api } from '../../../services/api'
import type { Menu, Plat } from '../../../types'
import UploadImage from '../../../components/UploadImage'
import './FormulaireMenu.css'

interface Theme {
    theme_id: number
    libelle: string
}

interface Regime {
    regime_id: number
    libelle: string
}

interface ImageMenu {
    image_id?: number
    url: string
    legende: string
    est_principale: boolean
    // Flag local pour gerer les images pas encore sauvees
    nouvelle?: boolean
}

interface Props {
    racine: '/admin' | '/employe'
    mode: 'creation' | 'edition'
}

// Categories de plat affichees dans la composition
// Note : la BDD ne supporte que 3 types (entree, plat, dessert)
// La maquette montrait 4 categories (accompagnements en plus) mais on
// reste sur les 3 du schema pour ne pas modifier la BDD pour l'instant.
const CATEGORIES_PLAT: Array<{ key: Plat['type']; label: string }> = [
    { key: 'entree', label: 'Entrées' },
    { key: 'plat', label: 'Plats principaux' },
    { key: 'dessert', label: 'Desserts' },
]

export default function FormulaireMenu({ racine, mode }: Props) {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const dupliquerId = searchParams.get('dupliquer')

    // Refs de donnees
    const [themes, setThemes] = useState<Theme[]>([])
    const [regimes, setRegimes] = useState<Regime[]>([])
    const [tousPlats, setTousPlats] = useState<Plat[]>([])

    // Champs du formulaire
    const [titre, setTitre] = useState('')
    const [description, setDescription] = useState('')
    const [themeId, setThemeId] = useState<string>('')
    const [prixParPersonne, setPrixParPersonne] = useState('')
    const [nombrePersonnesMinimum, setNombrePersonnesMinimum] = useState('')
    const [quantiteRestante, setQuantiteRestante] = useState('')
    const [conditions, setConditions] = useState('')
    const [regimesSelectionnes, setRegimesSelectionnes] = useState<number[]>([])
    const [platsSelectionnes, setPlatsSelectionnes] = useState<number[]>([])
    const [images, setImages] = useState<ImageMenu[]>([])

    // UI
    const [chargement, setChargement] = useState(true)
    const [enregistrement, setEnregistrement] = useState(false)
    const [erreur, setErreur] = useState<string | null>(null)

    // Modale ajout image
    // (anciens etats modale image retires : remplaces par le composant UploadImage
    //  qui upload directement le fichier au lieu de demander une URL externe)

    // Modale creation rapide d'un plat
    const [modalePlat, setModalePlat] = useState<Plat['type'] | null>(null)
    const [nouveauPlatNom, setNouveauPlatNom] = useState('')

    // === CHARGEMENT INITIAL ===
    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                setErreur(null)

                // On charge toujours themes/regimes/plats
                const [resThemes, resRegimes, resPlats] = await Promise.all([
                    api.get<{ themes: Theme[] }>('/api/themes'),
                    api.get<{ regimes: Regime[] }>('/api/regimes'),
                    api.get<{ plats: Plat[] }>('/api/plats'),
                ])
                setThemes(resThemes.themes || [])
                setRegimes(resRegimes.regimes || [])
                setTousPlats(resPlats.plats || [])

                // Si edition ou duplication, on charge le menu existant
                const idACharger = mode === 'edition' ? id : dupliquerId
                if (idACharger) {
                    const data = await api.get<{ menu: Menu }>(`/api/menus/${idACharger}`)
                    const m = data.menu
                    setTitre(mode === 'edition' ? m.titre : `${m.titre} (copie)`)
                    setDescription(m.description || '')
                    setPrixParPersonne(String(m.prix_par_personne))
                    setNombrePersonnesMinimum(String(m.nombre_personnes_minimum))
                    setQuantiteRestante(String(m.quantite_restante))
                    setConditions(m.conditions || '')

                    // Theme : on cherche son ID a partir du libelle
                    const themeMatch = resThemes.themes.find((t) => t.libelle === m.theme)
                    if (themeMatch) setThemeId(String(themeMatch.theme_id))

                    setPlatsSelectionnes(m.plats?.map((p) => p.plat_id) || [])
                    setRegimesSelectionnes(m.regimes?.map((r) => r.regime_id) || [])
                    setImages(
                        (m.images || []).map((img) => ({
                            image_id: img.image_id,
                            url: img.url,
                            legende: img.legende || '',
                            est_principale: img.est_principale || false,
                            nouvelle: mode === 'creation', // si on duplique, on ajoutera comme nouvelles
                        }))
                    )
                }
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger les données.')
            } finally {
                setChargement(false)
            }
        }
        charger()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, dupliquerId, mode])

    // === HELPERS ===

    function basculerPlat(platId: number) {
        setPlatsSelectionnes((prev) =>
            prev.includes(platId) ? prev.filter((id) => id !== platId) : [...prev, platId]
        )
    }

    function basculerRegime(regimeId: number) {
        setRegimesSelectionnes((prev) =>
            prev.includes(regimeId) ? prev.filter((id) => id !== regimeId) : [...prev, regimeId]
        )
    }

    function ajouterImage(url: string) {
        if (!url.trim()) return
        setImages((prev) => [
            ...prev,
            {
                url: url.trim(),
                legende: '',
                // Premiere image = principale par defaut
                est_principale: prev.length === 0,
                nouvelle: true,
            },
        ])
    }

    function supprimerImage(index: number) {
        setImages((prev) => {
            const newList = prev.filter((_, i) => i !== index)
            // Si on a supprime la principale, on remet la premiere
            const aUnePrincipale = newList.some((img) => img.est_principale)
            if (!aUnePrincipale && newList.length > 0) {
                newList[0].est_principale = true
            }
            return newList
        })
    }

    function definirImagePrincipale(index: number) {
        setImages((prev) =>
            prev.map((img, i) => ({ ...img, est_principale: i === index }))
        )
    }

    async function creerPlatRapide() {
        if (!modalePlat || !nouveauPlatNom.trim()) return
        try {
            const data = await api.post<{ plat: Plat }>('/api/plats', {
                titre: nouveauPlatNom.trim(),
                type: modalePlat,
                allergenes: [],
            })
            // Ajout au catalogue local + selection auto
            setTousPlats((prev) => [...prev, data.plat])
            setPlatsSelectionnes((prev) => [...prev, data.plat.plat_id])
            setNouveauPlatNom('')
            setModalePlat(null)
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de créer le plat.')
        }
    }

    // === VALIDATION ===

    function valider(): string | null {
        if (!titre.trim()) return 'Le nom du menu est obligatoire.'
        if (!themeId) return 'La catégorie est obligatoire.'
        if (!description.trim()) return 'La description est obligatoire.'
        const prix = parseFloat(prixParPersonne)
        if (isNaN(prix) || prix <= 0) return 'Le prix par personne doit être supérieur à 0.'
        const minPers = parseInt(nombrePersonnesMinimum)
        if (isNaN(minPers) || minPers < 1) return 'Le minimum de personnes doit être au moins 1.'
        const stock = parseInt(quantiteRestante)
        if (isNaN(stock) || stock < 0) return 'Le stock doit être positif ou nul.'
        return null
    }

    // === SOUMISSION ===

    async function soumettre(e: FormEvent) {
        e.preventDefault()
        const erreurValidation = valider()
        if (erreurValidation) {
            setErreur(erreurValidation)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        setErreur(null)
        setEnregistrement(true)

        try {
            const payload = {
                titre: titre.trim(),
                description: description.trim(),
                themeId: parseInt(themeId),
                prixParPersonne: parseFloat(prixParPersonne),
                nombrePersonnesMinimum: parseInt(nombrePersonnesMinimum),
                quantiteRestante: parseInt(quantiteRestante),
                conditions: conditions.trim() || null,
                plats: platsSelectionnes,
                regimes: regimesSelectionnes,
            }

            let menuId: number

            if (mode === 'creation') {
                const data = await api.post<{ menu: { menu_id: number } }>('/api/menus', payload)
                menuId = data.menu.menu_id
            } else {
                await api.put(`/api/menus/${id}`, payload)
                menuId = parseInt(id!)
            }

            // Gestion des images : on ajoute toutes les nouvelles
            // (la modification d'images existantes est gérée image par image
            //  via PUT ; pour l'instant on ajoute seulement les nouvelles)
            const nouvellesImages = images.filter((img) => img.nouvelle)
            for (const img of nouvellesImages) {
                await api.post(`/api/menus/${menuId}/images`, {
                    url: img.url,
                    legende: img.legende || null,
                    estPrincipale: img.est_principale,
                })
            }

            navigate(`${racine}/menus`)
        } catch (err: any) {
            setErreur(err?.message || "Erreur lors de l'enregistrement.")
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setEnregistrement(false)
        }
    }

    // === DERIVES ===

    // Plats groupes par categorie
    const platsParCategorie = useMemo(() => {
        const map: Record<string, Plat[]> = {}
        CATEGORIES_PLAT.forEach((c) => (map[c.key] = []))
        tousPlats.forEach((p) => {
            if (map[p.type]) map[p.type].push(p)
        })
        return map
    }, [tousPlats])

    // Liste des plats deja selectionnes par categorie
    const platsSelectionnesParCategorie = useMemo(() => {
        const map: Record<string, Plat[]> = {}
        CATEGORIES_PLAT.forEach((c) => (map[c.key] = []))
        tousPlats
            .filter((p) => platsSelectionnes.includes(p.plat_id))
            .forEach((p) => {
                if (map[p.type]) map[p.type].push(p)
            })
        return map
    }, [tousPlats, platsSelectionnes])

    // Checklist de completude (statut de publication)
    const checklist = {
        infosCompletes:
            !!titre.trim() && !!themeId && !!description.trim() && !!prixParPersonne,
        imagesAjoutees: images.length > 0,
        compositionDefinie: platsSelectionnes.length > 0,
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
        <form onSubmit={soumettre} className="formulaire-menu" noValidate>
            {/* Barre d'actions sticky */}
            <header className="fm-actions-bar">
                <nav aria-label="Fil d'Ariane" className="fm-breadcrumb">
                    <Link to={`${racine}/menus`}>Menus</Link>
                    <span aria-hidden="true">›</span>
                    <span>{mode === 'creation' ? 'Créer un menu' : titre || 'Modifier'}</span>
                </nav>
                <div className="d-flex gap-2">
                    <Link to={`${racine}/menus`} className="btn btn-outline-primary">
                        <X size={16} className="me-2" />
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={enregistrement}
                    >
                        <Save size={16} className="me-2" />
                        {enregistrement
                            ? 'Enregistrement…'
                            : mode === 'creation'
                              ? 'Enregistrer le menu'
                              : 'Sauvegarder'}
                    </button>
                </div>
            </header>

            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            <div className="fm-grille">
                {/* ===================== COLONNE GAUCHE ===================== */}
                <div className="fm-col-gauche">
                    {/* Informations principales */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Informations principales</h2>

                        <div className="mb-3">
                            <label htmlFor="fm-titre" className="form-label fw-medium">
                                Nom du menu <span className="text-danger" aria-hidden="true">*</span>
                            </label>
                            <input
                                id="fm-titre"
                                type="text"
                                className="form-control"
                                value={titre}
                                onChange={(e) => setTitre(e.target.value)}
                                placeholder="Ex: Menu de Noël Tradition"
                                required
                            />
                            <div className="form-text">
                                Le nom du menu tel qu'il apparaîtra aux clients
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="fm-theme" className="form-label fw-medium">
                                Catégorie <span className="text-danger" aria-hidden="true">*</span>
                            </label>
                            <select
                                id="fm-theme"
                                className="form-select"
                                value={themeId}
                                onChange={(e) => setThemeId(e.target.value)}
                                required
                            >
                                <option value="">Sélectionnez une catégorie</option>
                                {themes.map((t) => (
                                    <option key={t.theme_id} value={t.theme_id}>
                                        {t.libelle}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="fm-description" className="form-label fw-medium">
                                Description <span className="text-danger" aria-hidden="true">*</span>
                            </label>
                            <textarea
                                id="fm-description"
                                className="form-control"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Décrivez votre menu en quelques lignes..."
                                required
                            />
                            <div className="form-text">
                                Une description attractive pour donner envie aux clients
                            </div>
                        </div>
                    </section>

                    {/* Tarification & capacité */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Tarification & capacité</h2>
                        <div className="fm-grille-3">
                            <div>
                                <label htmlFor="fm-prix" className="form-label fw-medium">
                                    Prix par personne *
                                </label>
                                <div className="input-group">
                                    <input
                                        id="fm-prix"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="form-control"
                                        value={prixParPersonne}
                                        onChange={(e) => setPrixParPersonne(e.target.value)}
                                        placeholder="65.00"
                                        required
                                    />
                                    <span className="input-group-text">€</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fm-min-pers" className="form-label fw-medium">
                                    Minimum personnes *
                                </label>
                                <div className="input-group">
                                    <input
                                        id="fm-min-pers"
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={nombrePersonnesMinimum}
                                        onChange={(e) => setNombrePersonnesMinimum(e.target.value)}
                                        placeholder="8"
                                        required
                                    />
                                    <span className="input-group-text">pers.</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fm-stock" className="form-label fw-medium">
                                    Stock disponible *
                                </label>
                                <div className="input-group">
                                    <input
                                        id="fm-stock"
                                        type="number"
                                        min="0"
                                        className="form-control"
                                        value={quantiteRestante}
                                        onChange={(e) => setQuantiteRestante(e.target.value)}
                                        placeholder="24"
                                        required
                                    />
                                    <span className="input-group-text">menus</span>
                                </div>
                            </div>
                        </div>
                        <div className="fm-info-tarif">
                            <strong>Information tarifaire</strong>
                            <p>
                                Le prix total sera calculé automatiquement en fonction du
                                nombre de personnes. Le minimum de personnes est requis pour
                                valider la commande.
                            </p>
                        </div>

                        <div className="mt-3">
                            <label htmlFor="fm-conditions" className="form-label fw-medium">
                                Conditions particulières
                            </label>
                            <textarea
                                id="fm-conditions"
                                className="form-control"
                                rows={2}
                                value={conditions}
                                onChange={(e) => setConditions(e.target.value)}
                                placeholder="Ex: Commande à passer au minimum 7 jours avant la prestation..."
                            />
                        </div>
                    </section>

                    {/* Composition du menu */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Composition du menu</h2>
                        {CATEGORIES_PLAT.map((cat) => (
                            <div key={cat.key} className="fm-categorie">
                                <div className="fm-categorie-header">
                                    <span className="fm-categorie-label">{cat.label.toUpperCase()}</span>
                                    <span className="fm-categorie-count">
                                        {platsSelectionnesParCategorie[cat.key].length} plat
                                        {platsSelectionnesParCategorie[cat.key].length > 1 ? 's' : ''} sélectionné
                                        {platsSelectionnesParCategorie[cat.key].length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Plats deja selectionnes */}
                                <div className="fm-plats-tags">
                                    {platsSelectionnesParCategorie[cat.key].map((p) => (
                                        <span key={p.plat_id} className="fm-plat-tag">
                                            {p.titre}
                                            <button
                                                type="button"
                                                onClick={() => basculerPlat(p.plat_id)}
                                                aria-label={`Retirer ${p.titre}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Plats disponibles a ajouter */}
                                <details className="fm-plats-dispo">
                                    <summary>
                                        + Choisir parmi les plats existants (
                                        {platsParCategorie[cat.key].filter(
                                            (p) => !platsSelectionnes.includes(p.plat_id)
                                        ).length}
                                        )
                                    </summary>
                                    <div className="fm-plats-liste">
                                        {platsParCategorie[cat.key]
                                            .filter((p) => !platsSelectionnes.includes(p.plat_id))
                                            .map((p) => (
                                                <button
                                                    key={p.plat_id}
                                                    type="button"
                                                    onClick={() => basculerPlat(p.plat_id)}
                                                    className="fm-plat-bouton-ajout"
                                                >
                                                    <Plus size={12} />
                                                    {p.titre}
                                                </button>
                                            ))}
                                        {platsParCategorie[cat.key].filter(
                                            (p) => !platsSelectionnes.includes(p.plat_id)
                                        ).length === 0 && (
                                            <span className="text-muted">
                                                Tous les plats de cette catégorie sont déjà sélectionnés.
                                            </span>
                                        )}
                                    </div>
                                </details>

                                {/* Bouton de creation rapide */}
                                <button
                                    type="button"
                                    onClick={() => setModalePlat(cat.key)}
                                    className="fm-plat-bouton-creer"
                                >
                                    <Plus size={14} />
                                    Créer un nouveau {cat.label.toLowerCase().slice(0, -1)}
                                </button>
                            </div>
                        ))}
                    </section>

                    {/* Régimes alimentaires */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Régimes alimentaires adaptés</h2>
                        <p className="text-muted small mb-3">
                            Sélectionnez les régimes alimentaires compatibles avec ce menu
                        </p>
                        <div className="fm-regimes">
                            {regimes.map((r) => {
                                const coche = regimesSelectionnes.includes(r.regime_id)
                                return (
                                    <label
                                        key={r.regime_id}
                                        className={`fm-regime-carte ${coche ? 'fm-regime-carte--actif' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={coche}
                                            onChange={() => basculerRegime(r.regime_id)}
                                        />
                                        <div>
                                            <strong>{r.libelle}</strong>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </section>
                </div>

                {/* ===================== COLONNE DROITE ===================== */}
                <aside className="fm-col-droite">
                    {/* Galerie d'images */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Galerie d'images</h2>

                        <UploadImage
                            categorie="menus"
                            onUploaded={(url) => ajouterImage(url)}
                        />

                        {images.length > 0 && (
                            <>
                                <div className="fm-thumbnails">
                                    {images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`fm-thumbnail ${img.est_principale ? 'fm-thumbnail--principale' : ''}`}
                                        >
                                            <img src={img.url} alt={img.legende || ''} />
                                            {img.est_principale && (
                                                <Star size={14} className="fm-thumbnail-star" fill="currentColor" />
                                            )}
                                            <div className="fm-thumbnail-actions">
                                                {!img.est_principale && (
                                                    <button
                                                        type="button"
                                                        onClick={() => definirImagePrincipale(idx)}
                                                        title="Définir comme principale"
                                                        aria-label="Définir comme principale"
                                                    >
                                                        <Star size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => supprimerImage(idx)}
                                                    title="Supprimer"
                                                    aria-label="Supprimer cette image"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="fm-images-aide">
                                    Cliquez sur l'étoile pour définir l'image principale
                                </p>
                            </>
                        )}
                    </section>

                    {/* Apercu client */}
                    <section className="fm-carte fm-apercu">
                        <h2 className="titre-serif fm-carte-titre">Aperçu client</h2>
                        <div className="fm-apercu-carte">
                            {images.find((i) => i.est_principale) ? (
                                <img
                                    src={images.find((i) => i.est_principale)!.url}
                                    alt=""
                                    className="fm-apercu-image"
                                />
                            ) : (
                                <div className="fm-apercu-image fm-apercu-placeholder">
                                    🍽️
                                </div>
                            )}
                            {themeId && themes.find((t) => String(t.theme_id) === themeId) && (
                                <span className="fm-apercu-badge">
                                    {themes.find((t) => String(t.theme_id) === themeId)!.libelle}
                                </span>
                            )}
                            <h3 className="fm-apercu-titre">{titre || 'Nom de votre menu'}</h3>
                            <p className="fm-apercu-desc">
                                {description || 'Description du menu...'}
                            </p>
                            <div className="fm-apercu-prix">
                                <span className="text-muted small">À partir de</span>
                                <strong>
                                    {prixParPersonne || '0'} €/pers.
                                </strong>
                            </div>
                        </div>
                    </section>

                    {/* Statut de publication */}
                    <section className="fm-carte">
                        <h2 className="titre-serif fm-carte-titre">Statut de publication</h2>

                        <div className="fm-checklist">
                            <div
                                className={`fm-check ${checklist.infosCompletes ? 'fm-check--ok' : ''}`}
                            >
                                <span className="fm-check-icone">
                                    {checklist.infosCompletes ? <Check size={14} /> : '•'}
                                </span>
                                <div>
                                    <strong>Informations complètes</strong>
                                    <div className="text-muted small">
                                        {checklist.infosCompletes
                                            ? 'Toutes les informations requises sont renseignées'
                                            : 'Complétez les champs obligatoires'}
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`fm-check ${checklist.imagesAjoutees ? 'fm-check--ok' : ''}`}
                            >
                                <span className="fm-check-icone">
                                    {checklist.imagesAjoutees ? <Check size={14} /> : '•'}
                                </span>
                                <div>
                                    <strong>Images ajoutées</strong>
                                    <div className="text-muted small">
                                        {images.length} image{images.length > 1 ? 's' : ''} dans la galerie
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`fm-check ${checklist.compositionDefinie ? 'fm-check--ok' : ''}`}
                            >
                                <span className="fm-check-icone">
                                    {checklist.compositionDefinie ? <Check size={14} /> : '•'}
                                </span>
                                <div>
                                    <strong>Composition définie</strong>
                                    <div className="text-muted small">
                                        {platsSelectionnes.length} plat
                                        {platsSelectionnes.length > 1 ? 's' : ''} sélectionné
                                        {platsSelectionnes.length > 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>

            {/* === MODALE CREATION RAPIDE D'UN PLAT === */}
            {modalePlat && (
                <div
                    className="fm-modale-overlay"
                    onClick={() => setModalePlat(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="fm-modale" onClick={(e) => e.stopPropagation()}>
                        <h3 className="titre-serif">
                            Créer un nouveau{' '}
                            {CATEGORIES_PLAT.find((c) => c.key === modalePlat)?.label.toLowerCase()}
                        </h3>
                        <div className="mb-3">
                            <label htmlFor="plat-nom" className="form-label fw-medium">
                                Nom du plat *
                            </label>
                            <input
                                id="plat-nom"
                                type="text"
                                className="form-control"
                                value={nouveauPlatNom}
                                onChange={(e) => setNouveauPlatNom(e.target.value)}
                                placeholder="Ex: Foie gras maison"
                                autoFocus
                            />
                            <div className="form-text">
                                Le plat sera créé et automatiquement ajouté à votre menu.
                                Vous pourrez modifier ses détails (prix, allergènes) depuis
                                la gestion des plats.
                            </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                onClick={() => setModalePlat(null)}
                                className="btn btn-outline-primary"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={creerPlatRapide}
                                className="btn btn-primary"
                                disabled={!nouveauPlatNom.trim()}
                            >
                                Créer et ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
