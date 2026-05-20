// ============================================================
// HOOK : useInfiniteList
// ============================================================
// Permet de "reveler" progressivement une liste deja chargee en
// memoire, par paquets de N elements, au fur et a mesure que
// l'utilisateur scrolle.
//
// Pas de pagination cote back : on charge tout d'un coup et on
// limite simplement l'affichage. Quand on s'approche du bas de
// page, on incremente la "fenetre" visible.
//
// Avantage : pas de modif back, transitions douces, et le filtrage
// reste instantane (on filtre la liste complete, puis on prend les
// N premiers).
// ============================================================

import { useState, useEffect, useRef } from 'react'

const TAILLE_PAQUET = 20
// Distance en pixels avant le bas de la liste a partir de laquelle
// on charge le paquet suivant. Augmenter si la liste est lente a rendre.
const SEUIL_DECLENCHEMENT = 200

export function useInfiniteList<T>(items: T[]) {
    const [nbVisibles, setNbVisibles] = useState(TAILLE_PAQUET)
    const sentinelleRef = useRef<HTMLDivElement | null>(null)

    // A chaque fois que la liste change (filtres notamment), on reset
    // a un paquet pour repartir du debut sans laisser plus visible
    // que de matieres.
    useEffect(() => {
        setNbVisibles(TAILLE_PAQUET)
    }, [items])

    // Observer qui declenche le chargement quand la sentinelle (un div
    // en bas de la liste) entre dans le viewport.
    useEffect(() => {
        const sentinelle = sentinelleRef.current
        if (!sentinelle) return

        const observer = new IntersectionObserver(
            (entrees) => {
                if (entrees[0].isIntersecting) {
                    setNbVisibles((n) => Math.min(n + TAILLE_PAQUET, items.length))
                }
            },
            { rootMargin: `${SEUIL_DECLENCHEMENT}px` }
        )

        observer.observe(sentinelle)
        return () => observer.disconnect()
    }, [items.length])

    const itemsVisibles = items.slice(0, nbVisibles)
    const restant = Math.max(0, items.length - nbVisibles)

    return {
        itemsVisibles,
        sentinelleRef,
        restant,
        total: items.length,
        aPlus: restant > 0,
    }
}
