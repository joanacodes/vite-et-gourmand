// ============================================================
// SERVICE API - Wrapper fetch pour appeler le back-end
//
// Centralise les appels HTTP vers /api/* avec :
// - Gestion uniforme des erreurs
// - Inclusion automatique des cookies (credentials: 'include')
// - Headers Content-Type par defaut
// - Token CSRF automatique pour POST/PUT/PATCH/DELETE
// - Retry une fois si le token CSRF a expire (refetch + retry)
//
// Usage :
//   const data = await api.get<MenuType[]>('/api/menus')
//   await api.post('/api/auth/connexion', { email, motDePasse })
// ============================================================

// Type pour les erreurs API (format renvoye par notre back-end)
export interface ApiError extends Error {
  statut: number
  message: string
  code?: string
}

// ============================================================
// GESTION DU TOKEN CSRF
// ============================================================
// Le token est recupere une fois au demarrage (premiere requete
// mutante), stocke en memoire, et envoye dans le header
// x-csrf-token. Si le serveur retourne 403 CSRF_INVALIDE, on
// refetch et on retente la requete une fois.
// ============================================================

let tokenCsrf: string | null = null
let promesseChargementToken: Promise<string> | null = null

async function recupererTokenCsrf(forcer = false): Promise<string> {
  // Cache en memoire : on ne refait pas la requete inutilement
  if (tokenCsrf && !forcer) return tokenCsrf

  // Si une requete de token est deja en cours, on la reutilise
  // (evite plusieurs GET /api/csrf-token en parallele au demarrage)
  if (promesseChargementToken && !forcer) return promesseChargementToken

  promesseChargementToken = (async () => {
    const reponse = await fetch('/api/csrf-token', {
      credentials: 'include',
    })
    if (!reponse.ok) {
      throw new Error('Impossible de recuperer le token CSRF')
    }
    const data = await reponse.json()
    tokenCsrf = data.csrfToken
    return tokenCsrf as string
  })()

  try {
    const token = await promesseChargementToken
    return token
  } finally {
    promesseChargementToken = null
  }
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
    erreur.code = donnees?.code
    throw erreur
  }

  return donnees as T
}

// Options communes a toutes les requetes
const optionsBase: RequestInit = {
  // Important : envoie les cookies de session avec chaque requete
  credentials: 'include',
}

const headersJson: Record<string, string> = {
  'Content-Type': 'application/json',
}

// Methodes a effet de bord qui necessitent un token CSRF
const METHODES_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Coeur du fetch : ajoute le token CSRF si necessaire et retry une fois
// si la session CSRF a expire (le serveur a redemarre par exemple).
async function appelerApi<T>(
  url: string,
  options: RequestInit & { method: string },
  body?: unknown,
): Promise<T> {
  async function executer(token: string | null): Promise<Response> {
    const headers: Record<string, string> = { ...headersJson }
    if (token) headers['x-csrf-token'] = token

    return fetch(url, {
      ...optionsBase,
      ...options,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  const methodeUpper = options.method.toUpperCase()
  const besoinCsrf = METHODES_MUTANTES.has(methodeUpper)

  // Premier essai
  const token = besoinCsrf ? await recupererTokenCsrf() : null
  let reponse = await executer(token)

  // Retry unique si le token CSRF a expire/etait invalide
  if (reponse.status === 403 && besoinCsrf) {
    let body403: any = null
    try {
      // On clone car .json() consomme le body et on en aura besoin
      body403 = await reponse.clone().json()
    } catch {
      // ignore
    }
    if (body403?.code === 'CSRF_INVALIDE') {
      const nouveauToken = await recupererTokenCsrf(true)
      reponse = await executer(nouveauToken)
    }
  }

  return gererReponse<T>(reponse)
}

// ============================================================
// METHODES HTTP
// ============================================================

export const api = {
  /**
   * Requete GET (pas de CSRF necessaire)
   * @example const menus = await api.get<Menu[]>('/api/menus')
   */
  async get<T>(url: string): Promise<T> {
    const reponse = await fetch(url, {
      ...optionsBase,
      method: 'GET',
    })
    return gererReponse<T>(reponse)
  },

  /**
   * Requete POST avec CSRF
   * @example await api.post('/api/auth/connexion', { email, motDePasse })
   */
  async post<T>(url: string, body?: unknown): Promise<T> {
    return appelerApi<T>(url, { method: 'POST' }, body)
  },

  /**
   * Requete PUT avec CSRF
   */
  async put<T>(url: string, body?: unknown): Promise<T> {
    return appelerApi<T>(url, { method: 'PUT' }, body)
  },

  /**
   * Requete PATCH avec CSRF
   */
  async patch<T>(url: string, body?: unknown): Promise<T> {
    return appelerApi<T>(url, { method: 'PATCH' }, body)
  },

  /**
   * Requete DELETE avec CSRF
   */
  async delete<T>(url: string): Promise<T> {
    return appelerApi<T>(url, { method: 'DELETE' })
  },
}
