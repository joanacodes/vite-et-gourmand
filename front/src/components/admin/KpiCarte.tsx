// Carte KPI pour le tableau de bord admin (ou employe plus tard).
// Affiche un icone colore, une valeur, un label et eventuellement
// une variation en %.

import type { ReactNode } from 'react'

interface Props {
    icone: ReactNode
    valeur: string | number
    label: string
    variation?: {
        valeur: number   // ex: 12 pour +12%
        suffixe?: string // ex: "vs mois dernier"
    }
    couleurIcone?: 'bordeaux' | 'sauge' | 'bleu' | 'or'
}

export default function KpiCarte({
    icone,
    valeur,
    label,
    variation,
    couleurIcone = 'bordeaux',
}: Props) {
    const variationPositive = variation && variation.valeur >= 0

    return (
        <div className="kpi-carte">
            <div className={`kpi-carte-icone kpi-carte-icone--${couleurIcone}`} aria-hidden="true">
                {icone}
            </div>
            <div className="kpi-carte-corps">
                <div className="kpi-carte-valeur">{valeur}</div>
                <div className="kpi-carte-label">{label}</div>
                {variation && (
                    <div
                        className={`kpi-carte-variation ${
                            variationPositive
                                ? 'kpi-carte-variation--positive'
                                : 'kpi-carte-variation--negative'
                        }`}
                    >
                        <span aria-hidden="true">{variationPositive ? '↑' : '↓'}</span>
                        <span>
                            {variationPositive ? '+' : ''}
                            {variation.valeur}%
                        </span>
                        {variation.suffixe && (
                            <span className="kpi-carte-variation-suffixe">
                                {variation.suffixe}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
