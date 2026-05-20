// ============================================================
// CONTROLEUR DES PARAMETRES
// GET /api/parametres : lecture publique (utilise par le front
//   pour afficher les bonnes valeurs)
// PUT /api/parametres : modification (admin uniquement)
// ============================================================

import { Request, Response } from "express";
import { Parametre, PARAMETRES_DEFAUTS } from "../modeles/parametre";

export async function listerParametres(_req: Request, res: Response) {
    try {
        // On recupere tous les parametres en BDD
        const enregistres = await Parametre.find().lean();

        // On construit un objet { cle: valeur } en mergeant avec les defauts
        const resultat: Record<string, any> = { ...PARAMETRES_DEFAUTS };
        enregistres.forEach((p) => {
            resultat[p.cle] = p.valeur;
        });

        res.json({ parametres: resultat });
    } catch (erreur) {
        console.error("Erreur listage parametres :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}

export async function modifierParametres(req: Request, res: Response) {
    try {
        const { parametres } = req.body;

        if (!parametres || typeof parametres !== "object") {
            return res.status(400).json({
                erreur: "Le champ 'parametres' (objet cle/valeur) est obligatoire",
            });
        }

        // Pour chaque cle envoyee, on upsert (insert ou update)
        const operations = Object.entries(parametres).map(([cle, valeur]) => ({
            updateOne: {
                filter: { cle },
                update: {
                    $set: {
                        cle,
                        valeur,
                        dateModification: new Date(),
                    },
                },
                upsert: true,
            },
        }));

        if (operations.length > 0) {
            await Parametre.bulkWrite(operations);
        }

        // On renvoie les parametres a jour
        const enregistres = await Parametre.find().lean();
        const resultat: Record<string, any> = { ...PARAMETRES_DEFAUTS };
        enregistres.forEach((p) => {
            resultat[p.cle] = p.valeur;
        });

        res.json({
            message: "Parametres mis a jour",
            parametres: resultat,
        });
    } catch (erreur) {
        console.error("Erreur modification parametres :", erreur);
        res.status(500).json({ erreur: "Erreur serveur" });
    }
}
