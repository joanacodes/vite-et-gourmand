# Sécurité de l'application Vite & Gourmand

Document à intégrer à la documentation technique du projet.
Décrit les mesures de sécurité mises en place côté back-end, côté
front-end et au niveau de la base de données.

---

## 1. Authentification et gestion des sessions

### 1.1 Hashage des mots de passe

- Algorithme : **bcrypt** (cost factor 10)
- Aucun mot de passe n'est stocké en clair en base
- Vérification lors de la connexion via `bcrypt.compare()`

### 1.2 Politique de mot de passe

À l'inscription comme au changement, le mot de passe doit respecter :

- **10 caractères minimum**
- Au moins **1 majuscule**, **1 minuscule**, **1 chiffre**, **1 caractère spécial**
- Validation par expression régulière côté back ET côté front (double validation)

### 1.3 Sessions express

- Stockage des sessions dans MongoDB via `connect-mongo` (persistance même
  après redémarrage du serveur)
- Cookies de session signés avec un secret stocké en variable
  d'environnement (`SESSION_SECRET`)
- Durée de vie : 7 jours
- Cookies marqués :
  - `httpOnly: true` → inaccessibles en JavaScript (protection contre le vol
    par XSS)
  - `secure: true` en production → transmis uniquement via HTTPS
  - `sameSite: 'lax'` → protection partielle contre CSRF

### 1.4 Protection contre la force brute

- Limiteur de taux sur `/api/auth/connexion` : **5 tentatives par 15 minutes
  par IP** (via `express-rate-limit`)
- Limiteur sur `/api/auth/mot-de-passe-oublie` : 3 demandes / heure / IP
- Message de réponse identique en cas d'email inexistant ou mot de passe
  erroné (évite l'énumération des comptes)

---

## 2. Autorisation et contrôle d'accès

### 2.1 Système de rôles

Trois rôles définis dans la table `role` :
- `utilisateur` (client)
- `employe`
- `administrateur`

### 2.2 Middlewares de protection

Middlewares définis dans `back/src/middlewares/auth.ts` :

- `estConnecte` : vérifie qu'une session valide existe
- `estEmploye` : exige le rôle employé OU administrateur
- `estAdmin` : exige le rôle administrateur

Chaque route sensible déclare son middleware en amont. Exemple :

```typescript
routeur.post("/", estEmploye, creerPlat);
routeur.put("/", estAdmin, modifierParametres);
```

### 2.3 Vérifications d'autorisation par ressource

Pour les ressources personnelles (commandes, avis), un second niveau de
contrôle vérifie que l'utilisateur est bien propriétaire de la ressource
avant d'autoriser modification ou consultation.

---

## 3. Protection XSS (Cross-Site Scripting)

### 3.1 Côté back

- `helmet()` ajoute automatiquement :
  - `X-Content-Type-Options: nosniff` (empêche le MIME sniffing)
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `Content-Security-Policy` par défaut
  - `Strict-Transport-Security` (HTTPS forcé)
- En-tête `X-Powered-By: Express` désactivé (`app.disable("x-powered-by")`)
  pour ne pas révéler la stack technique

### 3.2 Côté front

- React échappe automatiquement toutes les valeurs interpolées en JSX
- Aucun usage de `dangerouslySetInnerHTML` dans le code de l'application
- Toute donnée saisie par un utilisateur (avis, description, commentaires)
  est affichée en tant que texte pur

### 3.3 Cookies

- `httpOnly: true` empêche un script malveillant de lire les cookies de
  session, même en cas d'injection JS réussie

---

## 4. Protection CSRF (Cross-Site Request Forgery)

Protection en deux couches.

### 4.1 SameSite lax

Le cookie de session est marqué `sameSite: 'lax'`. Les navigateurs modernes
refusent alors d'envoyer ce cookie sur les requêtes cross-origin
modifiantes (POST/PUT/DELETE), bloquant la majorité des attaques CSRF.

### 4.2 Token CSRF "double submit cookie"

Implémenté avec la bibliothèque `csrf-csrf` (`back/src/config/csrf.ts`) :

1. Au premier appel, le front demande un token via `GET /api/csrf-token`.
2. Le serveur dépose un cookie chiffré `vg.csrf` et renvoie un token jumeau.
3. Le front stocke ce token en mémoire et l'envoie dans le header
   `x-csrf-token` à chaque requête POST/PUT/PATCH/DELETE.
4. Le middleware `doubleCsrfProtection` vérifie que header et cookie
   correspondent. Sinon, réponse `403 { code: "CSRF_INVALIDE" }`.
5. Si le token a expiré, le front refetch automatiquement et retente la
   requête une fois (transparent pour l'utilisateur).

Les requêtes `GET`, `HEAD`, `OPTIONS` sont exemptées (pas d'effet de bord).

---

## 5. Protection contre les injections SQL

- 100 % des requêtes PostgreSQL utilisent **des requêtes paramétrées**
  (`$1, $2, ...`) via le driver `pg`
- **Aucune concaténation de chaîne** dans les requêtes SQL
- Exemple :

```typescript
// ❌ Vulnérable (jamais utilisé dans le projet)
const r = await pool.query(`SELECT * FROM menu WHERE titre = '${input}'`);

// ✅ Pattern utilisé partout dans le projet
const r = await pool.query("SELECT * FROM menu WHERE titre = $1", [input]);
```

- Côté MongoDB, utilisation de Mongoose avec schémas typés et casting
  automatique des paramètres (pas de risque d'injection NoSQL).

---

## 6. Protection contre les attaques par déni de service (DoS / DDoS)

### 6.1 Limitation de débit globale

`express-rate-limit` (`back/src/config/securite.ts`) applique :

| Route | Limite | Fenêtre |
|---|---|---|
| Global (toutes routes) | 100 requêtes | 1 minute / IP |
| `/api/auth/connexion` | 5 requêtes | 15 minutes / IP |
| `/api/auth/mot-de-passe-oublie` | 3 requêtes | 1 heure / IP |
| `/api/contact` | 5 requêtes | 1 heure / IP |

### 6.2 Limitation de la taille des requêtes

```typescript
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
```

Empêche un attaquant d'envoyer des requêtes massives pour saturer la mémoire.

### 6.3 Recommandation production

En production, déploiement recommandé **derrière Cloudflare ou un WAF**
(Web Application Firewall) qui gère les attaques DDoS au niveau réseau,
bien plus efficacement que le code applicatif.

---

## 7. Protection contre l'injection d'en-têtes email

Les sujets d'email contenant des données utilisateur (formulaire de contact,
notes admin) sont assainis par la fonction `assainirSujet()`
(`back/src/services/email.ts`) :

- Suppression de tous les caractères de retour à la ligne (`\r`, `\n`)
- Suppression des caractères de contrôle (C0/C1)
- Limitation à 200 caractères
- Trim des espaces

Cette protection complète celle déjà présente nativement dans nodemailer
(défense en profondeur).

---

## 8. CORS (Cross-Origin Resource Sharing)

```typescript
app.use(cors({
    origin: process.env.FRONT_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "x-csrf-token"],
}));
```

- L'origine du front est **explicitement whitelistée** via la variable
  d'environnement `FRONT_URL` (pas de wildcard `*`)
- Les credentials (cookies) sont autorisés uniquement pour cette origine
- Les en-têtes acceptés sont limités à `Content-Type` et `x-csrf-token`

---

## 9. Gestion des secrets

Aucun secret n'est commité dans le dépôt Git. Tous les secrets sont
externalisés dans le fichier `.env` (non versionné, présent dans
`.gitignore`) :

| Variable | Usage |
|---|---|
| `SESSION_SECRET` | Signature des cookies de session |
| `CSRF_SECRET` | Signature des cookies CSRF (fallback : `SESSION_SECRET`) |
| `DATABASE_URL` | Connexion PostgreSQL |
| `MONGO_URI` | Connexion MongoDB |
| `MAIL_USER` / `MAIL_PASSWORD` | Compte SMTP |

Un fichier `.env.example` documente les variables nécessaires sans
divulguer les valeurs réelles.

---

## 10. RGPD

- Cron quotidien d'anonymisation des comptes inactifs (>3 ans)
  via `back/src/services/cronAnonymisation.ts`
- Préférences de communication par email (newsletter, conseils, offres)
  configurables et respectées via `verifierPreferenceEmail()`
- Possibilité pour l'utilisateur de désactiver son compte depuis son profil
- Possibilité de droit à l'oubli via demande à l'administrateur

---

## 11. Audit des dépendances

Au moment de la livraison :

```bash
cd back && npm audit
# found 0 vulnerabilities

cd front && npm audit
# found 0 vulnerabilities
```

Les commandes `npm audit` doivent être relancées avant chaque déploiement.

---

## 12. Synthèse - Tableau des menaces couvertes

| Menace (OWASP Top 10) | Protection en place |
|---|---|
| A01 - Broken Access Control | Middlewares `estConnecte` / `estEmploye` / `estAdmin`, vérification de propriété par ressource |
| A02 - Cryptographic Failures | bcrypt cost 10, secrets en variables d'env, HTTPS en prod |
| A03 - Injection (SQL) | Requêtes paramétrées partout |
| A03 - Injection (XSS) | React escape automatique, helmet (CSP) |
| A03 - Injection (Email headers) | Fonction `assainirSujet` |
| A04 - Insecure Design | Politique mot de passe forte, rate limiting, anonymisation RGPD |
| A05 - Security Misconfiguration | helmet, X-Powered-By désactivé, CORS whitelisté |
| A07 - Identification & Auth Failures | Rate limit anti-brute force, sessions sécurisées |
| A08 - Software & Data Integrity Failures | `npm audit` régulier, lockfile commité |
| A09 - Security Logging | (à améliorer en V2 : logs structurés) |
| A10 - Server-Side Request Forgery | Aucune URL externe construite à partir d'input utilisateur |
| CSRF | sameSite=lax + tokens csrf-csrf (double submit cookie) |
| DDoS | express-rate-limit + body size limit |
| Clickjacking | helmet : X-Frame-Options: DENY |
| MIME sniffing | helmet : X-Content-Type-Options: nosniff |

---

## 13. Améliorations futures recommandées

- Mise en place de **logs de sécurité structurés** (tentatives de connexion
  échouées, accès refusés, requêtes CSRF rejetées) avec Winston ou Pino
- **WAF en production** (Cloudflare, AWS WAF)
- **Validation systématique des inputs** avec une bibliothèque comme `zod`
  ou `express-validator` pour réduire la surface d'erreur humaine
- **Tests de pénétration** avant mise en production (OWASP ZAP, Burp Suite)
- **Rotation périodique des secrets** (`SESSION_SECRET`, `CSRF_SECRET`)
- **Monitoring temps réel** des erreurs (Sentry, Datadog)
