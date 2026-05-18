// ============================================================
// FILTRES MENUS - Section des filtres dynamiques
// Filtre cote front (instantane, sans rechargement)
// ============================================================

import './FiltresMenus.css'

// Types pour les filtres
export interface FiltresState {
    recherche: string
    theme: string | null      // null = tous (utilise le libelle "Mariage", "Noel"...)
    prixMax: number | null
    personnesMin: number | null
    tri: 'recents' | 'prix-asc' | 'prix-desc' | 'nom-asc'
}

// Themes disponibles (libelles tels qu'en BDD, sans accent)
const themes = [
    { valeur: null, libelle: 'Tous les menus' },
    { valeur: 'Classique', libelle: 'Classique' },
    { valeur: 'Noel', libelle: 'Noel' },
    { valeur: 'Paques', libelle: 'Paques' },
    { valeur: 'Evenement', libelle: 'Evenement' },
    { valeur: 'Mariage', libelle: 'Mariage' },
    { valeur: 'Anniversaire', libelle: 'Anniversaire' },
]

const optionsPrix = [
    { valeur: null, libelle: 'Tous les prix' },
    { valeur: 50, libelle: 'Jusqu\'a 50 €' },
    { valeur: 75, libelle: 'Jusqu\'a 75 €' },
    { valeur: 100, libelle: 'Jusqu\'a 100 €' },
]

const optionsPersonnes = [
    { valeur: null, libelle: 'Tous les groupes' },
    { valeur: 4, libelle: '4+ personnes' },
    { valeur: 8, libelle: '8+ personnes' },
    { valeur: 15, libelle: '15+ personnes' },
    { valeur: 20, libelle: '20+ personnes' },
]

const optionsTri = [
    { valeur: 'recents', libelle: 'Plus recents' },
    { valeur: 'prix-asc', libelle: 'Prix croissant' },
    { valeur: 'prix-desc', libelle: 'Prix decroissant' },
    { valeur: 'nom-asc', libelle: 'Ordre alphabetique' },
]

interface FiltresMenusProps {
    filtres: FiltresState
    onChange: (nouveaux: FiltresState) => void
    onReinitialiser: () => void
}

export default function FiltresMenus({ filtres, onChange, onReinitialiser }: FiltresMenusProps) {
    function modifier<K extends keyof FiltresState>(cle: K, valeur: FiltresState[K]) {
        onChange({ ...filtres, [cle]: valeur })
    }

    return (
        <div className="filtres-menus">
            {/* Ligne 1 : Recherche + dropdowns + reinitialiser */}
            <div className="filtres-menus-ligne">
                <div className="filtres-menus-recherche">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="search"
                        placeholder="Rechercher un menu..."
                        value={filtres.recherche}
                        onChange={(e) => modifier('recherche', e.target.value)}
                        aria-label="Rechercher un menu"
                    />
                </div>

                <select
                    className="filtres-menus-select"
                    value={filtres.prixMax || ''}
                    onChange={(e) => modifier('prixMax', e.target.value ? Number(e.target.value) : null)}
                    aria-label="Filtrer par prix maximum"
                >
                    {optionsPrix.map((opt) => (
                        <option key={String(opt.valeur)} value={opt.valeur || ''}>
                            {opt.libelle}
                        </option>
                    ))}
                </select>

                <select
                    className="filtres-menus-select"
                    value={filtres.personnesMin || ''}
                    onChange={(e) => modifier('personnesMin', e.target.value ? Number(e.target.value) : null)}
                    aria-label="Filtrer par nombre de personnes minimum"
                >
                    {optionsPersonnes.map((opt) => (
                        <option key={String(opt.valeur)} value={opt.valeur || ''}>
                            {opt.libelle}
                        </option>
                    ))}
                </select>

                <select
                    className="filtres-menus-select"
                    value={filtres.tri}
                    onChange={(e) => modifier('tri', e.target.value as FiltresState['tri'])}
                    aria-label="Trier les menus"
                >
                    {optionsTri.map((opt) => (
                        <option key={opt.valeur} value={opt.valeur}>
                            Trier par : {opt.libelle}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={onReinitialiser}
                    className="filtres-menus-reinit"
                    aria-label="Reinitialiser tous les filtres"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                    Reinitialiser
                </button>
            </div>

            {/* Ligne 2 : Chips de themes */}
            <div className="filtres-menus-chips" role="group" aria-label="Filtrer par theme">
                {themes.map((t) => (
                    <button
                        key={String(t.valeur)}
                        type="button"
                        onClick={() => modifier('theme', t.valeur)}
                        className={`filtres-menus-chip ${filtres.theme === t.valeur ? 'active' : ''}`}
                        aria-pressed={filtres.theme === t.valeur}
                    >
                        {t.libelle}
                    </button>
                ))}
            </div>
        </div>
    )
}
