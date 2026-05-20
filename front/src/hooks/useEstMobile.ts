// ============================================================
// HOOK : useEstMobile
// ============================================================
// Detecte si on est en dessous d'un seuil de largeur d'ecran
// (par defaut 992px, le breakpoint Bootstrap "lg" / desktop).
// Utile pour adapter des composants qui ne sont pas configurables
// en CSS pur (par exemple les charts Recharts).
// ============================================================

import { useState, useEffect } from 'react'

export function useEstMobile(seuilPx = 992): boolean {
    const [estMobile, setEstMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < seuilPx : false
    )

    useEffect(() => {
        function gererResize() {
            setEstMobile(window.innerWidth < seuilPx)
        }
        window.addEventListener('resize', gererResize)
        return () => window.removeEventListener('resize', gererResize)
    }, [seuilPx])

    return estMobile
}
