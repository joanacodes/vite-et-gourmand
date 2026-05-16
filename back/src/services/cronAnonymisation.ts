// ============================================================
// SERVICE CRON D'ANONYMISATION RGPD
//
// Conforme au RGPD article 17 (droit a l'oubli).
//
// Tourne tous les jours a 3h du matin et anonymise les comptes
// dont la date_suppression_demandee est anterieure a 30 jours,
// et qui ne sont pas encore anonymises.
//
// Ce qu'on conserve : utilisateur_id (FK des commandes pour
// l'historique comptable obligatoire 10 ans).
//
// Ce qu'on anonymise : nom, prenom, email, telephone, mot_de_passe
// + on marque est_anonymise = TRUE et date_suppression_effective = NOW().
// ============================================================

import cron from "node-cron";
import pool from "../config/postgres";

// ============================================================
// FONCTION D'ANONYMISATION
// Cherche les comptes a anonymiser et les met a jour.
// Exportee pour pouvoir l'appeler manuellement (test, ou cas urgent).
// ============================================================
export async function anonymiserComptesExpires(): Promise<number> {
    try {
        // On cherche les comptes dont la demande date de plus de 30 jours
        // et qui ne sont pas encore anonymises
        const resultat = await pool.query(
            `UPDATE utilisateur
             SET 
                nom = 'Utilisateur supprime',
                prenom = 'Anonyme',
                email = CONCAT('anonymise_', utilisateur_id, '@supprime.local'),
                telephone = NULL,
                mot_de_passe = '',
                actif = FALSE,
                est_anonymise = TRUE,
                date_suppression_effective = CURRENT_TIMESTAMP
             WHERE date_suppression_demandee IS NOT NULL
               AND date_suppression_demandee + INTERVAL '30 days' <= CURRENT_TIMESTAMP
               AND est_anonymise = FALSE
             RETURNING utilisateur_id`
        );

        const nombreAnonymises = resultat.rowCount || 0;

        if (nombreAnonymises > 0) {
            console.log(`🔒 [Cron RGPD] ${nombreAnonymises} compte(s) anonymise(s) :`, 
                resultat.rows.map(r => r.utilisateur_id));
        }

        return nombreAnonymises;
    } catch (erreur) {
        console.error("❌ [Cron RGPD] Erreur lors de l'anonymisation :", erreur);
        return 0;
    }
}

// ============================================================
// DEMARRAGE DU CRON
// A appeler une fois au demarrage du serveur (dans index.ts).
//
// Format cron : "0 3 * * *" = tous les jours a 3h du matin
//   - minute : 0
//   - heure : 3
//   - jour du mois : * (tous)
//   - mois : * (tous)
//   - jour de la semaine : * (tous)
//
// 3h du matin = creux d'activite, evite d'impacter les utilisateurs.
// ============================================================
export function demarrerCronAnonymisation() {
    cron.schedule("0 3 * * *", async () => {
        console.log("🔒 [Cron RGPD] Verification des comptes a anonymiser...");
        const nombre = await anonymiserComptesExpires();
        console.log(`🔒 [Cron RGPD] Termine. ${nombre} compte(s) traite(s).`);
    }, {
        timezone: "Europe/Paris"
    });

    console.log("✅ Cron RGPD demarre : anonymisation quotidienne a 3h du matin");
}
