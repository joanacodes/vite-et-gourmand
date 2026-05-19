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
    activiteRecente,
    commandesParMenu,
    caParMenu
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

// Nombre de commandes par menu (MongoDB) - exigence enonce p.9
routeur.get("/commandes-par-menu", estAdmin, commandesParMenu);

// Chiffre d'affaires par menu (PostgreSQL) avec filtres
routeur.get("/ca-par-menu", estAdmin, caParMenu);

export default routeur;
