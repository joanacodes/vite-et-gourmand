// Page parametres admin.
// Edition reelle : les valeurs sont stockees en MongoDB et lues
// par le front. Les valeurs par defaut sont retournees si la cle
// n'a jamais ete ecrite.

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
    Save,
    Settings,
    MapPin,
    Truck,
    Mail,
    Phone,
    Clock,
    Lock,
    AlertCircle,
} from 'lucide-react'
import { api } from '../../../services/api'
import './Parametres.css'

interface Parametres {
    entreprise_adresse: string
    entreprise_telephone: string
    entreprise_email: string
    reservation_delai_minimum_jours: number
    reservation_acompte_pourcentage: number
    reservation_tva_pourcentage: number
    reservation_reduction_grand_groupe_pourcentage: number
    reservation_reduction_grand_groupe_seuil: number
    livraison_forfait_base_euros: number
    livraison_prix_par_km_euros: number
    livraison_latitude_traiteur: number
    livraison_longitude_traiteur: number
}

export default function Parametres() {
    const [parametres, setParametres] = useState<Parametres | null>(null)
    const [chargement, setChargement] = useState(true)
    const [enregistrement, setEnregistrement] = useState(false)
    const [erreur, setErreur] = useState<string | null>(null)
    const [messageOk, setMessageOk] = useState<string | null>(null)

    // Champs qui ont ete modifies par rapport au chargement initial
    const [valeursOriginales, setValeursOriginales] = useState<Parametres | null>(null)

    useEffect(() => {
        async function charger() {
            try {
                setChargement(true)
                setErreur(null)
                const data = await api.get<{ parametres: Parametres }>('/api/parametres')
                setParametres(data.parametres)
                setValeursOriginales(data.parametres)
            } catch (err: any) {
                setErreur(err?.message || 'Impossible de charger les parametres.')
            } finally {
                setChargement(false)
            }
        }
        charger()
    }, [])

    function modifier<K extends keyof Parametres>(cle: K, valeur: Parametres[K]) {
        if (!parametres) return
        setParametres({ ...parametres, [cle]: valeur })
    }

    // Detecte si au moins un champ a change
    const aDesModifs =
        parametres &&
        valeursOriginales &&
        JSON.stringify(parametres) !== JSON.stringify(valeursOriginales)

    async function sauvegarder(e: FormEvent) {
        e.preventDefault()
        if (!parametres || !aDesModifs) return
        try {
            setEnregistrement(true)
            setErreur(null)
            const data = await api.put<{ parametres: Parametres }>('/api/parametres', {
                parametres,
            })
            setParametres(data.parametres)
            setValeursOriginales(data.parametres)
            setMessageOk('Paramètres enregistrés avec succès')
            setTimeout(() => setMessageOk(null), 3500)
        } catch (err: any) {
            setErreur(err?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setEnregistrement(false)
        }
    }

    if (chargement || !parametres) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={sauvegarder} className="parametres">
            <header className="p-entete">
                <div>
                    <h1 className="titre-serif p-titre">Paramètres</h1>
                    <p className="p-sous-titre">Configuration générale de Vite &amp; Gourmand</p>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!aDesModifs || enregistrement}
                >
                    <Save size={16} className="me-2" />
                    {enregistrement
                        ? 'Enregistrement…'
                        : aDesModifs
                          ? 'Enregistrer'
                          : 'Tout est sauvegardé'}
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

            <div className="p-info-bandeau" role="status">
                <AlertCircle size={16} aria-hidden="true" />
                <span>
                    Ces paramètres sont utilisés à l'échelle du site (calcul livraison, conditions,
                    pied de page, etc.). Modifiez avec prudence.
                </span>
            </div>

            {/* Coordonnees */}
            <section className="p-carte">
                <h2 className="titre-serif p-carte-titre">
                    <Settings size={18} aria-hidden="true" />
                    Coordonnées de l'entreprise
                </h2>
                <div className="row g-3">
                    <div className="col-12">
                        <label htmlFor="p-adresse" className="form-label fw-medium">
                            <MapPin size={14} aria-hidden="true" className="me-1" />
                            Adresse postale
                        </label>
                        <input
                            id="p-adresse"
                            type="text"
                            className="form-control"
                            value={parametres.entreprise_adresse}
                            onChange={(e) => modifier('entreprise_adresse', e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-tel" className="form-label fw-medium">
                            <Phone size={14} aria-hidden="true" className="me-1" />
                            Téléphone
                        </label>
                        <input
                            id="p-tel"
                            type="tel"
                            className="form-control"
                            value={parametres.entreprise_telephone}
                            onChange={(e) => modifier('entreprise_telephone', e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-email" className="form-label fw-medium">
                            <Mail size={14} aria-hidden="true" className="me-1" />
                            Email de contact
                        </label>
                        <input
                            id="p-email"
                            type="email"
                            className="form-control"
                            value={parametres.entreprise_email}
                            onChange={(e) => modifier('entreprise_email', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Politique de reservation */}
            <section className="p-carte">
                <h2 className="titre-serif p-carte-titre">
                    <Clock size={18} aria-hidden="true" />
                    Politique de réservation
                </h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="p-delai" className="form-label fw-medium">
                            Délai minimum avant prestation (jours)
                        </label>
                        <input
                            id="p-delai"
                            type="number"
                            min="1"
                            max="90"
                            className="form-control"
                            value={parametres.reservation_delai_minimum_jours}
                            onChange={(e) =>
                                modifier('reservation_delai_minimum_jours', parseInt(e.target.value) || 0)
                            }
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-acompte" className="form-label fw-medium">
                            Acompte requis (%)
                        </label>
                        <input
                            id="p-acompte"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="form-control"
                            value={parametres.reservation_acompte_pourcentage}
                            onChange={(e) =>
                                modifier('reservation_acompte_pourcentage', parseInt(e.target.value) || 0)
                            }
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-tva" className="form-label fw-medium">
                            TVA appliquée (%)
                        </label>
                        <input
                            id="p-tva"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="form-control"
                            value={parametres.reservation_tva_pourcentage}
                            onChange={(e) =>
                                modifier('reservation_tva_pourcentage', parseFloat(e.target.value) || 0)
                            }
                        />
                        <div className="form-text">
                            Incluse dans le prix TTC affiché au client
                        </div>
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="p-reduc" className="form-label fw-medium">
                            Réduction grand groupe (%)
                        </label>
                        <input
                            id="p-reduc"
                            type="number"
                            min="0"
                            max="100"
                            className="form-control"
                            value={parametres.reservation_reduction_grand_groupe_pourcentage}
                            onChange={(e) =>
                                modifier(
                                    'reservation_reduction_grand_groupe_pourcentage',
                                    parseInt(e.target.value) || 0
                                )
                            }
                        />
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="p-seuil" className="form-label fw-medium">
                            Seuil personnes (min +)
                        </label>
                        <input
                            id="p-seuil"
                            type="number"
                            min="0"
                            className="form-control"
                            value={parametres.reservation_reduction_grand_groupe_seuil}
                            onChange={(e) =>
                                modifier(
                                    'reservation_reduction_grand_groupe_seuil',
                                    parseInt(e.target.value) || 0
                                )
                            }
                        />
                        <div className="form-text">
                            Au-delà du minimum du menu
                        </div>
                    </div>
                </div>
            </section>

            {/* Livraison */}
            <section className="p-carte">
                <h2 className="titre-serif p-carte-titre">
                    <Truck size={18} aria-hidden="true" />
                    Tarification de la livraison
                </h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="p-forfait" className="form-label fw-medium">
                            Forfait de base (€)
                        </label>
                        <div className="input-group">
                            <input
                                id="p-forfait"
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                value={parametres.livraison_forfait_base_euros}
                                onChange={(e) =>
                                    modifier(
                                        'livraison_forfait_base_euros',
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                            />
                            <span className="input-group-text">€</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-km" className="form-label fw-medium">
                            Tarif kilométrique (€/km)
                        </label>
                        <div className="input-group">
                            <input
                                id="p-km"
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                value={parametres.livraison_prix_par_km_euros}
                                onChange={(e) =>
                                    modifier(
                                        'livraison_prix_par_km_euros',
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                            />
                            <span className="input-group-text">€/km</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-lat" className="form-label fw-medium">
                            Latitude du traiteur
                        </label>
                        <input
                            id="p-lat"
                            type="number"
                            step="0.000001"
                            className="form-control"
                            value={parametres.livraison_latitude_traiteur}
                            onChange={(e) =>
                                modifier(
                                    'livraison_latitude_traiteur',
                                    parseFloat(e.target.value) || 0
                                )
                            }
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="p-lng" className="form-label fw-medium">
                            Longitude du traiteur
                        </label>
                        <input
                            id="p-lng"
                            type="number"
                            step="0.000001"
                            className="form-control"
                            value={parametres.livraison_longitude_traiteur}
                            onChange={(e) =>
                                modifier(
                                    'livraison_longitude_traiteur',
                                    parseFloat(e.target.value) || 0
                                )
                            }
                        />
                        <div className="form-text">
                            Point de référence pour le calcul de distance (Haversine)
                        </div>
                    </div>
                </div>
            </section>

            {/* Securite (lecture seule, choix architecture) */}
            <section className="p-carte">
                <h2 className="titre-serif p-carte-titre">
                    <Lock size={18} aria-hidden="true" />
                    Sécurité et comptes (lecture seule)
                </h2>
                <p className="text-muted small">
                    Ces paramètres sont définis dans le code pour des raisons de sécurité.
                </p>
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="p-info-label-fixe">Politique de mot de passe</div>
                        <div className="p-info-valeur-fixe">
                            10 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-info-label-fixe">Hashage</div>
                        <div className="p-info-valeur-fixe">bcrypt (cost 10)</div>
                    </div>
                </div>
            </section>

            {/* Bouton sauvegarde en bas */}
            <div className="p-bas-actions">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!aDesModifs || enregistrement}
                >
                    <Save size={16} className="me-2" />
                    {enregistrement
                        ? 'Enregistrement…'
                        : aDesModifs
                          ? 'Enregistrer les modifications'
                          : 'Tout est sauvegardé'}
                </button>
            </div>
        </form>
    )
}
