// ============================================================
// MIDDLEWARES DE SECURITE
// Ces fonctions s'executent AVANT les controleurs pour verifier
// que l'utilisateur a le droit d'acceder a la route.
// ============================================================

import { Request, Response, NextFunction } from "express";

// ============================================================
// VERIFIE QUE L'UTILISATEUR EST CONNECTE
// A utiliser sur les routes qui necessitent une authentification
// ============================================================
export function estConnecte(req: Request, res: Response, next: NextFunction) {
    if (!req.session.utilisateur) {
        return res.status(401).json({ erreur: "Vous devez etre connecte pour acceder a cette ressource" });
    }
    next();
}

// ============================================================
// VERIFIE QUE L'UTILISATEUR EST UN UTILISATEUR (role "utilisateur")
// ============================================================
export function estUtilisateur(req: Request, res: Response, next: NextFunction) {
    if (!req.session.utilisateur || req.session.utilisateur.role !== "utilisateur") {
        return res.status(403).json({ erreur: "Acces reserve aux utilisateurs" });
    }
    next();
}

// ============================================================
// VERIFIE QUE L'UTILISATEUR EST UN EMPLOYE OU UN ADMIN
// Les admins peuvent faire tout ce que les employes peuvent faire
// ============================================================
export function estEmploye(req: Request, res: Response, next: NextFunction) {
    if (!req.session.utilisateur) {
        return res.status(401).json({ erreur: "Non connecte" });
    }

    const role = req.session.utilisateur.role;
    if (role !== "employe" && role !== "administrateur") {
        return res.status(403).json({ erreur: "Acces reserve aux employes et administrateurs" });
    }
    next();
}

// ============================================================
// VERIFIE QUE L'UTILISATEUR EST UN ADMIN
// ============================================================
export function estAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.utilisateur || req.session.utilisateur.role !== "administrateur") {
        return res.status(403).json({ erreur: "Acces reserve aux administrateurs" });
    }
    next();
}
