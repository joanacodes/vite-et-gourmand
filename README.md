# 🍽️ Vite & Gourmand

Application web pour le traiteur **Vite & Gourmand**, basé à Bordeaux depuis 25 ans.

> Projet réalisé dans le cadre de l'ECF du **Titre Professionnel Développeur Web et Web Mobile** (Studi).

---

## 📋 Description

Vite & Gourmand est une entreprise tenue par Julie et José qui propose des prestations de traiteur pour tout type d'événement (Noël, Pâques, repas classiques…).

Cette application web permet :
- 👀 Aux visiteurs de **consulter les menus** disponibles
- 🛒 Aux utilisateurs inscrits de **commander** des menus
- 👨‍🍳 Aux employés de **gérer les commandes** et les menus
- 🛡️ À l'administrateur de **piloter l'activité** (statistiques, gestion des employés)

---

## 🛠️ Stack technique

### Front-end
- React + Vite
- TypeScript
- Bootstrap

### Back-end
- Node.js + Express
- TypeScript
- PostgreSQL (driver `pg` natif)
- MongoDB (Mongoose pour les statistiques)
- bcrypt + express-session (authentification)
- Nodemailer (envoi d'emails)

### Déploiement
- Front : **Netlify**
- Back + PostgreSQL : **Render**
- MongoDB : **MongoDB Atlas**

---

## 🚀 Installation locale

### Prérequis
- Node.js (v18 ou supérieure)
- PostgreSQL (v15 ou supérieure)
- Un compte MongoDB Atlas (gratuit)
- Git

### 1. Cloner le projet
```bash
git clone https://github.com/TON-USERNAME/vite-et-gourmand.git
cd vite-et-gourmand
```

### 2. Configurer la base de données PostgreSQL
- Créer une base `vite_et_gourmand` via pgAdmin
- Exécuter les scripts SQL dans cet ordre :
  - `sql/creation.sql` (création des tables)
  - `sql/donnees.sql` (jeu de données de test)

### 3. Configurer le back-end
```bash
cd back
npm install
cp .env.example .env
# Remplir le fichier .env avec tes propres valeurs
npm run dev
```

### 4. Configurer le front-end
```bash
cd front
npm install
npm run dev
```

### 5. Accéder à l'application
- Front : `http://localhost:5173`
- API back : `http://localhost:3000`

---

## 👥 Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@vite-et-gourmand.fr` | `Admin1234!` |
| Employé | `employe@vite-et-gourmand.fr` | `Employe1234!` |
| Utilisateur | `utilisateur@test.fr` | `User1234!` |

---

## 📂 Structure du projet

```
vite-et-gourmand/
├── back/             # Serveur Node.js + Express
├── front/            # Application React
├── sql/              # Scripts SQL (création + données)
├── documentation/    # Documentation PDF
├── maquettes/        # Exports des maquettes
└── README.md
```

---

## 🌳 Workflow Git

- `main` → branche de production (déployée)
- `dev` → branche de développement
- `feature/*` → branches de fonctionnalités

Chaque fonctionnalité est développée sur une branche `feature/*`, puis mergée dans `dev` après tests, puis dans `main` pour le déploiement.

---

## 📝 Auteure

Réalisé dans le cadre de la formation **Studi - TP Développeur Web et Web Mobile**.
