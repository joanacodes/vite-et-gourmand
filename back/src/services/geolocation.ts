// ============================================================
// SERVICE DE GEOLOCALISATION
//
// Calcule la distance entre l'adresse du traiteur (Vite & Gourmand)
// et une adresse de livraison.
//
// Geocoding : OpenStreetMap Nominatim (gratuit, pas de cle API)
//   - Documentation : https://nominatim.org/release-docs/develop/api/Search/
//   - Politique d'usage : max 1 req/seconde, User-Agent obligatoire
//
// Calcul de distance : formule de Haversine (a vol d'oiseau)
//   - Prend en compte la courbure de la Terre
//   - Precision suffisante pour notre cas d'usage (livraison locale)
//
// Note : pour des distances routieres reelles, il faudrait utiliser
// un service comme OpenRouteService (cle API gratuite + quota).
// Pour un projet local de livraison sur Bordeaux, Haversine convient.
// ============================================================

// Coordonnees fixes du traiteur (15 Rue des Remparts, 33000 Bordeaux)
// Geocodees une fois pour toutes (evite un appel API a chaque calcul)
const TRAITEUR_LATITUDE = 44.8378;
const TRAITEUR_LONGITUDE = -0.5792;

// Rayon moyen de la Terre en kilometres (utilise dans Haversine)
const RAYON_TERRE_KM = 6371;

// URL de base de l'API Nominatim
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

// User-Agent identifiant l'application (requis par Nominatim)
const USER_AGENT = "Vite&Gourmand/1.0 (contact@vite-et-gourmand.fr)";

// ============================================================
// Type pour les coordonnees GPS
// ============================================================
export interface Coordonnees {
    latitude: number;
    longitude: number;
}

// ============================================================
// GEOCODER UNE ADRESSE
// Transforme une adresse texte en coordonnees GPS via Nominatim.
//
// @param adresse : adresse complete (ex: "45 Avenue Berthelot, 33300 Bordeaux")
// @returns Coordonnees ou null si l'adresse n'a pas pu etre geocodee
// ============================================================
export async function geocoderAdresse(adresse: string): Promise<Coordonnees | null> {
    try {
        // Construction de l'URL avec encodage des parametres
        const params = new URLSearchParams({
            q: adresse,
            format: "json",
            limit: "1",
            // Limiter a la France pour ameliorer la precision
            countrycodes: "fr",
        });

        const url = `${NOMINATIM_BASE_URL}?${params.toString()}`;

        // Appel a l'API avec User-Agent (obligatoire pour Nominatim)
        const reponse = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (!reponse.ok) {
            console.error(`Erreur Nominatim : HTTP ${reponse.status}`);
            return null;
        }

        const donnees = await reponse.json();

        // Si aucun resultat trouve, on retourne null
        if (!Array.isArray(donnees) || donnees.length === 0) {
            console.warn(`Aucune coordonnee trouvee pour l'adresse : ${adresse}`);
            return null;
        }

        // Conversion des lat/lon (Nominatim retourne des strings)
        const resultat = donnees[0];
        return {
            latitude: parseFloat(resultat.lat),
            longitude: parseFloat(resultat.lon),
        };
    } catch (erreur) {
        console.error("Erreur lors du geocoding :", erreur);
        return null;
    }
}

// ============================================================
// FORMULE DE HAVERSINE
// Calcule la distance "a vol d'oiseau" entre 2 points GPS,
// en tenant compte de la courbure de la Terre.
//
// @returns distance en kilometres (arrondie a 2 decimales)
// ============================================================
export function distanceHaversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    // Conversion des degres en radians
    const toRadians = (degres: number) => (degres * Math.PI) / 180;

    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    // Formule de Haversine
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = RAYON_TERRE_KM * c;

    // Arrondi a 2 decimales
    return Math.round(distance * 100) / 100;
}

// ============================================================
// CALCULER LA DISTANCE DEPUIS LE TRAITEUR
// Fonction de haut niveau qui combine geocoding + Haversine.
//
// @param adresseLivraison : adresse complete du client
// @returns distance en km, ou null si l'adresse n'a pas pu etre geocodee
// ============================================================
export async function calculerDistanceDepuisTraiteur(
    adresseLivraison: string,
): Promise<number | null> {
    // Geocoding de l'adresse de livraison
    const coordsLivraison = await geocoderAdresse(adresseLivraison);

    if (!coordsLivraison) {
        return null;
    }

    // Calcul de la distance via Haversine
    const distance = distanceHaversine(
        TRAITEUR_LATITUDE,
        TRAITEUR_LONGITUDE,
        coordsLivraison.latitude,
        coordsLivraison.longitude,
    );

    return distance;
}
