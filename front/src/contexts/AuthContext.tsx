// ============================================================
// CONTEXT AUTH - Gestion de la session utilisateur
//
// Centralise :
// - L'utilisateur actuellement connecte (ou null)
// - Les fonctions connexion/deconnexion/rafraichir
// - L'etat de chargement initial (le temps de verifier la session)
//
// Usage dans un composant :
//   const { utilisateur, connecter, deconnecter } = useAuth()
// ============================================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import type { Utilisateur } from '../types'

interface AuthContextType {
  utilisateur: Utilisateur | null
  chargement: boolean
  connecter: (email: string, motDePasse: string) => Promise<void>
  deconnecter: () => Promise<void>
  rafraichirProfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(true)

  // Au demarrage, on verifie si l'utilisateur a deja une session active
  // (cookie de session valide cote back)
  useEffect(() => {
    verifierSession()
  }, [])

  async function verifierSession() {
    try {
      // L'endpoint /api/auth/moi (ou /api/utilisateurs/profil) renvoie
      // l'utilisateur connecte si la session est valide, sinon une 401
      const data = await api.get<{ utilisateur: Utilisateur }>('/api/utilisateurs/profil')
      setUtilisateur(data.utilisateur)
    } catch {
      // Pas de session valide, on reste sur utilisateur = null
      setUtilisateur(null)
    } finally {
      setChargement(false)
    }
  }

  async function connecter(email: string, motDePasse: string) {
    // POST /api/auth/connexion
    // Le back-end cree une session et renvoie un cookie de session
    await api.post('/api/auth/connexion', { email, motDePasse })
    // Puis on recupere le profil complet
    await rafraichirProfil()
  }

  async function deconnecter() {
    try {
      await api.post('/api/auth/deconnexion')
    } finally {
      // Meme si la requete echoue, on vide l'utilisateur cote front
      setUtilisateur(null)
    }
  }

  async function rafraichirProfil() {
    const data = await api.get<{ utilisateur: Utilisateur }>('/api/utilisateurs/profil')
    setUtilisateur(data.utilisateur)
  }

  return (
    <AuthContext.Provider
      value={{ utilisateur, chargement, connecter, deconnecter, rafraichirProfil }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook custom pour utiliser le context plus facilement
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit etre utilise a l\'interieur d\'un AuthProvider')
  }
  return context
}
