// Garde-fou d'accès. Redirige vers /connexion si pas connecté,
// et vers / si le role n'est pas dans la liste autorisée.

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { RoleUtilisateur } from '../types'

interface Props {
    children: ReactNode
    rolesAutorises: RoleUtilisateur[]
}

export default function RouteProtegee({ children, rolesAutorises }: Props) {
    const { utilisateur, chargement } = useAuth()
    const location = useLocation()

    if (chargement) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Vérification...</span>
                </div>
            </div>
        )
    }

    if (!utilisateur) {
        return <Navigate to="/connexion" state={{ retourApres: location.pathname }} replace />
    }

    if (!rolesAutorises.includes(utilisateur.role)) {
        // Pas le bon role -> retour accueil
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
