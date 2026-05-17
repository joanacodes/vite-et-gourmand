// ============================================================
// SERVICE API - Wrapper fetch pour appeler le back-end
//
// Centralise les appels HTTP vers /api/* avec :
// - Gestion uniforme des erreurs
// - Inclusion automatique des cookies (credentials: 'include' pour les sessions)
// - Headers Content-Type par defaut pour POST/PUT
// - Typage TypeScript de la reponse
//
// Usage :
//   const data = await api.get<MenuType[]>('/api/menus')
//   await api.post('/api/auth/connexion', { email, motDePasse })
// ============================================================

// Type pour les erreurs API (format renvoye par notre back-end)
export interface ApiError extends Error {
  statut: number
  message: string
}

// Fonction helper qui throw une ApiError si la reponse n'est pas OK
async function gererReponse<T>(reponse: Response): Promise<T> {
  // Si la reponse est 204 (No Content) ou body vide, on retourne undefined
  if (reponse.status === 204) {
    return undefined as T
  }

  // On essaie de parser le JSON (meme en cas d'erreur, le back renvoie { erreur: "..." })
  let donnees: any
  try {
    donnees = await reponse.json()
  } catch {
    donnees = null
  }

  // Si statut HTTP en erreur (4xx, 5xx), on throw avec le message du back
  if (!reponse.ok) {
    const erreur = new Error(
      donnees?.erreur || `Erreur ${reponse.status}: ${reponse.statusText}`
    ) as ApiError
    erreur.statut = reponse.status
    erreur.message = donnees?.erreur || reponse.statusText
    throw erreur
  }

  return donnees as T
}

// Options communes a toutes les requetes
const optionsParDefaut: RequestInit = {
  // Important : envoie les cookies de session avec chaque requete
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
}

// ============================================================
// METHODES HTTP
// ============================================================

export const api = {
  /**
   * Requete GET
   * @example const menus = await api.get<Menu[]>('/api/menus')
   */
  async get<T>(url: string): Promise<T> {
    const reponse = await fetch(url, {
      ...optionsParDefaut,
      method: 'GET',
    })
    return gererReponse<T>(reponse)
  },

  /**
   * Requete POST
   * @example await api.post('/api/auth/connexion', { email, motDePasse })
   */
  async post<T>(url: string, body?: unknown): Promise<T> {
    const reponse = await fetch(url, {
      ...optionsParDefaut,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    return gererReponse<T>(reponse)
  },

  /**
   * Requete PUT
   */
  async put<T>(url: string, body?: unknown): Promise<T> {
    const reponse = await fetch(url, {
      ...optionsParDefaut,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
    return gererReponse<T>(reponse)
  },

  /**
   * Requete DELETE
   */
  async delete<T>(url: string): Promise<T> {
    const reponse = await fetch(url, {
      ...optionsParDefaut,
      method: 'DELETE',
    })
    return gererReponse<T>(reponse)
  },
}
