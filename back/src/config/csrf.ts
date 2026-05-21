// ============================================================
// CONFIGURATION CSRF
// ============================================================
// Protection contre les attaques Cross-Site Request Forgery.
//
// Strategie : "double submit cookie" via csrf-csrf.
// - Le serveur envoie un cookie HttpOnly contenant un secret signe.
// - Le front recupere le token via GET /api/csrf-token, le stocke
//   en memoire, et l'envoie dans un header x-csrf-token a chaque
//   requete modifiante (POST/PUT/PATCH/DELETE).
// - Le middleware csrf valide que header + cookie correspondent.
//
// On ne protege QUE les routes a effet de bord. Les GET et la route
// /api/csrf-token elle-meme sont automatiquement ignorees.
//
// Note : cette protection complete sameSite=lax (deja en place).
// Combinees, elles offrent une protection robuste meme sur des
// navigateurs anciens qui ne supportent pas sameSite.
// ============================================================

import { doubleCsrf } from "csrf-csrf";

// On a besoin d'un identifiant stable entre les requetes pour qu'un
// token genere sur la requete A reste valide sur la requete B.
//
// On NE PEUT PAS utiliser req.sessionID : avec saveUninitialized=false,
// la session n'est creee que quand on ecrit dedans (apres connexion).
// Pour les visiteurs anonymes (qui veulent justement se connecter),
// le sessionID change a chaque requete -> CSRF invalide en boucle.
//
// Solution : on utilise une chaine fixe comme identifiant. Cela ne
// reduit PAS la securite car le double-submit cookie compare le
// header au cookie : un attaquant ne peut pas lire le cookie d'une
// autre origine (sameSite + httpOnly), donc ne peut pas forger un
// header valide. L'identifiant ne sert qu'a "lier" le token au
// cookie cote serveur.
const recupererIdSession = (_req: any): string => {
    return "vg-csrf";
};

// Le secret signe les cookies CSRF. Il doit etre stable entre
// les redemarrages mais different en prod. On reutilise SESSION_SECRET
// pour ne pas multiplier les variables d'env.
const recupererSecret = (): string => {
    const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error(
            "CSRF_SECRET ou SESSION_SECRET doit etre defini dans .env",
        );
    }
    return secret;
};

export const {
    generateCsrfToken,
    doubleCsrfProtection,
    invalidCsrfTokenError,
} = doubleCsrf({
    getSecret: recupererSecret,
    getSessionIdentifier: recupererIdSession,
    cookieName: process.env.NODE_ENV === "production"
        ? "__Host-vg.csrf"
        : "vg.csrf",
    cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    },
    // GET/HEAD/OPTIONS ne sont jamais protegees (pas d'effet de bord)
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    // Le front envoie le token dans ce header
    getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
});
