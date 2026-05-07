// ============================================================
// ROUTES DES STATISTIQUES
// Toutes les routes sont reservees aux admins
// ============================================================

import { Router } from "express";
import { 
    dashboard, 
    menusPopulaires, 
    chiffreAffairesParMois, 
    clientsFideles,
    activiteRecente
} from "../controleurs/stats";
import { estAdmin } from "../middlewares/auth";

const routeur = Router();

// Tableau de bord general
routeur.get("/dashboard", estAdmin, dashboard);

// Top des menus consultes (MongoDB)
routeur.get("/menus-populaires", estAdmin, menusPopulaires);

// Chiffre d'affaires par mois (PostgreSQL)
routeur.get("/chiffre-affaires", estAdmin, chiffreAffairesParMois);

// Top clients fideles (PostgreSQL)
routeur.get("/clients-fideles", estAdmin, clientsFideles);

// Activite recente du site (MongoDB)
routeur.get("/activite-recente", estAdmin, activiteRecente);

export default routeur;
