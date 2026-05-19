// Placeholder en attendant qu'on code les vraies pages.
// A remplacer au fur et a mesure des etapes du plan.

import { Construction } from 'lucide-react'

interface Props {
    titre: string
    description?: string
}

export default function PagePlaceholder({ titre, description }: Props) {
    return (
        <div>
            <h1 className="titre-serif" style={{ color: 'var(--color-bordeaux)', fontSize: '2rem' }}>
                {titre}
            </h1>
            {description && (
                <p style={{ color: 'var(--color-gris-texte)' }}>{description}</p>
            )}

            <div
                style={{
                    background: 'var(--color-blanc)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3xl)',
                    textAlign: 'center',
                    marginTop: 'var(--space-xl)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                <Construction size={48} style={{ color: 'var(--color-bordeaux)', marginBottom: 16 }} />
                <h2 style={{ color: 'var(--color-anthracite)', fontSize: '1.25rem', marginBottom: 8 }}>
                    Page en construction
                </h2>
                <p style={{ color: 'var(--color-gris-texte)', margin: 0 }}>
                    Cette section sera disponible très prochainement.
                </p>
            </div>
        </div>
    )
}
