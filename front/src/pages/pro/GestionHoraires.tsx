// Gestion des horaires - admin
// Tableau 7 jours avec edition inline et sauvegarde individuelle ou globale.

import { useState, useEffect } from 'react'
import { Save, Check, X } from 'lucide-react'
import { api } from '../../services/api'
import './GestionHoraires.css'

interface Horaire {
    horaire_id: number
    jour: string
    heure_ouverture_matin: string | null
    heure_fermeture_matin: string | null
    heure_ouverture_apresmidi: string | null
    heure_fermeture_apresmidi: string | null
    ferme: boolean
}

interface Props {
    racine: '/admin' | '/employe'
}

const JOURS_LABELS: Record<string, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche',
}

export default function GestionHoraires({}: Props) {
    const [horaires, setHoraires] = useState<Horaire[]>([])
    const [chargement, setChargement] = useState(true)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)
    const [enregistrement, setEnregistrement] = useState(false)
    // Ids des horaires modifies (pour ne sauvegarder que ceux-la)
    const [modifies, setModifies] = useState<Set<number>>(new Set())

    async function charger() {
        try {
            setChargement(true)
            setErreur(null)
            const data = await api.get<{ horaires: Horaire[] }>('/api/horaires')
            setHoraires(data.horaires || [])
            setModifies(new Set())
        } catch (err: any) {
            setErreur(err?.message || 'Impossible de charger les horaires.')
        } finally {
            setChargement(false)
        }
    }

    useEffect(() => {
        charger()
    }, [])

    function modifierChamp<K extends keyof Horaire>(id: number, champ: K, valeur: Horaire[K]) {
        setHoraires((prev) =>
            prev.map((h) => (h.horaire_id === id ? { ...h, [champ]: valeur } : h))
        )
        setModifies((prev) => new Set(prev).add(id))
    }

    function basculerFerme(id: number, ferme: boolean) {
        setHoraires((prev) =>
            prev.map((h) => {
                if (h.horaire_id !== id) return h
                if (ferme) {
                    return {
                        ...h,
                        ferme: true,
                        heure_ouverture_matin: null,
                        heure_fermeture_matin: null,
                        heure_ouverture_apresmidi: null,
                        heure_fermeture_apresmidi: null,
                    }
                }
                return { ...h, ferme: false }
            })
        )
        setModifies((prev) => new Set(prev).add(id))
    }

    async function sauvegarderTout() {
        if (modifies.size === 0) return
        try {
            setEnregistrement(true)
            setErreur(null)
            const promises = Array.from(modifies).map((id) => {
                const h = horaires.find((x) => x.horaire_id === id)
                if (!h) return Promise.resolve()
                return api.put(`/api/horaires/${id}`, {
                    heureOuvertureMatin: h.heure_ouverture_matin || null,
                    heureFermetureMatin: h.heure_fermeture_matin || null,
                    heureOuvertureApresmidi: h.heure_ouverture_apresmidi || null,
                    heureFermetureApresmidi: h.heure_fermeture_apresmidi || null,
                    ferme: h.ferme,
                })
            })
            await Promise.all(promises)
            setModifies(new Set())
            setMessageOk('Horaires enregistrés')
            setTimeout(() => setMessageOk(null), 3500)
        } catch (err: any) {
            setErreur(err?.message || 'Erreur lors de la sauvegarde.')
        } finally {
            setEnregistrement(false)
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
        <div className="gestion-horaires">
            <header className="gh-entete">
                <div>
                    <h1 className="titre-serif gh-titre">Horaires d'ouverture</h1>
                    <p className="gh-sous-titre">
                        Définissez les horaires affichés en pied de page du site
                    </p>
                </div>
                <button
                    type="button"
                    onClick={sauvegarderTout}
                    className="btn btn-primary"
                    disabled={modifies.size === 0 || enregistrement}
                >
                    <Save size={16} className="me-2" />
                    {enregistrement
                        ? 'Enregistrement…'
                        : modifies.size === 0
                          ? 'Tout est enregistré'
                          : `Enregistrer (${modifies.size})`}
                </button>
            </header>

            {messageOk && (
                <div className="alert alert-success" role="status" aria-live="polite">
                    <Check size={16} className="me-2" />
                    {messageOk}
                </div>
            )}
            {erreur && (
                <div className="alert alert-danger" role="alert">
                    {erreur}
                </div>
            )}

            <div className="gh-carte">
                <div className="table-responsive">
                    <table className="gh-table">
                        <thead>
                            <tr>
                                <th>JOUR</th>
                                <th>FERMÉ ?</th>
                                <th>MATIN</th>
                                <th>APRÈS-MIDI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {horaires.map((h) => (
                                <tr
                                    key={h.horaire_id}
                                    className={`${h.ferme ? 'gh-row-ferme' : ''} ${modifies.has(h.horaire_id) ? 'gh-row-modifie' : ''}`}
                                >
                                    <td className="gh-jour">
                                        {JOURS_LABELS[h.jour] || h.jour}
                                    </td>
                                    <td>
                                        <label className="form-switch gh-switch">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={h.ferme}
                                                onChange={(e) =>
                                                    basculerFerme(h.horaire_id, e.target.checked)
                                                }
                                                aria-label="Fermé"
                                            />
                                        </label>
                                    </td>
                                    <td>
                                        <div className="gh-heures">
                                            <input
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={h.heure_ouverture_matin || ''}
                                                disabled={h.ferme}
                                                onChange={(e) =>
                                                    modifierChamp(
                                                        h.horaire_id,
                                                        'heure_ouverture_matin',
                                                        e.target.value || null
                                                    )
                                                }
                                                aria-label="Ouverture matin"
                                            />
                                            <span aria-hidden="true">—</span>
                                            <input
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={h.heure_fermeture_matin || ''}
                                                disabled={h.ferme}
                                                onChange={(e) =>
                                                    modifierChamp(
                                                        h.horaire_id,
                                                        'heure_fermeture_matin',
                                                        e.target.value || null
                                                    )
                                                }
                                                aria-label="Fermeture matin"
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="gh-heures">
                                            <input
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={h.heure_ouverture_apresmidi || ''}
                                                disabled={h.ferme}
                                                onChange={(e) =>
                                                    modifierChamp(
                                                        h.horaire_id,
                                                        'heure_ouverture_apresmidi',
                                                        e.target.value || null
                                                    )
                                                }
                                                aria-label="Ouverture après-midi"
                                            />
                                            <span aria-hidden="true">—</span>
                                            <input
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={h.heure_fermeture_apresmidi || ''}
                                                disabled={h.ferme}
                                                onChange={(e) =>
                                                    modifierChamp(
                                                        h.horaire_id,
                                                        'heure_fermeture_apresmidi',
                                                        e.target.value || null
                                                    )
                                                }
                                                aria-label="Fermeture après-midi"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="gh-aide">
                    <X size={14} aria-hidden="true" />
                    Laissez les champs vides si le service ne fonctionne que sur une plage
                    (ex: uniquement le matin).
                </div>
            </div>
        </div>
    )
}
