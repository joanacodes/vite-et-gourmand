// ============================================================
// PAGE AUTH - Layout split-screen pour les pages d'authentification
//
// Reutilise pour : Connexion, Inscription, Mot de passe oublie,
// Reinitialisation.
//
// Structure :
// - Cote gauche (50%) : image bordeaux avec contenu personnalisable
//   (temoignages, slider features, etapes 1-2-3, etc.)
// - Cote droit (50%) : formulaire dans une carte blanche sur fond creme
//
// Sur mobile : empile (image en haut, formulaire en bas)
// ============================================================

import { ReactNode } from 'react'
import './PageAuth.css'

interface PageAuthProps {
    /** Contenu de la moitie gauche (image + overlay texte) */
    cotegauche: ReactNode
    /** Contenu de la moitie droite (carte avec formulaire) */
    cotedroit: ReactNode
}

export default function PageAuth({ cotegauche, cotedroit }: PageAuthProps) {
    return (
        <div className="page-auth">
            {/* Moitie gauche - bordeaux avec contenu */}
            <div className="page-auth-gauche">
                {cotegauche}
            </div>

            {/* Moitie droite - formulaire */}
            <div className="page-auth-droite">
                {cotedroit}
            </div>
        </div>
    )
}
