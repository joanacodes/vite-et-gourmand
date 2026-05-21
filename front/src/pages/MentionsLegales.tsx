// ============================================================
// PAGE LEGALE - Vite & Gourmand
// ============================================================
// Page publique regroupant en 3 sections :
// 1. Mentions legales (identification de l'editeur, hebergement)
// 2. Conditions Generales de Vente (CGV)
// 3. Politique de confidentialite (RGPD)
//
// Les coordonnees de l'entreprise (adresse, email, telephone)
// sont chargees dynamiquement depuis l'API parametres.
// ============================================================

import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './MentionsLegales.css'

interface Parametres {
    entreprise_adresse: string
    entreprise_telephone: string
    entreprise_email: string
}

export default function MentionsLegales() {
    const [params, setParams] = useState<Parametres>({
        entreprise_adresse: '12 cours Pasteur, 33000 Bordeaux, France',
        entreprise_telephone: '+33 5 56 12 34 56',
        entreprise_email: 'contact@vite-et-gourmand.fr',
    })

    useEffect(() => {
        api.get<{ parametres: Parametres }>('/api/parametres')
            .then((data) => setParams(data.parametres))
            .catch(() => {
                // Si l'API echoue, on garde les valeurs par defaut
            })
    }, [])

    const dateMaj = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <main className="legal-page">
            <div className="legal-container">
                <h1 className="legal-titre">Informations légales</h1>
                <p className="legal-maj">Dernière mise à jour : {dateMaj}</p>

                {/* Sommaire */}
                <nav className="legal-sommaire" aria-label="Sommaire">
                    <h2 className="legal-sommaire-titre">Sommaire</h2>
                    <ol>
                        <li>
                            <a href="#mentions">Mentions légales</a>
                        </li>
                        <li>
                            <a href="#cgv">Conditions Générales de Vente</a>
                        </li>
                        <li>
                            <a href="#confidentialite">
                                Politique de confidentialité (RGPD)
                            </a>
                        </li>
                    </ol>
                </nav>

                {/* ===== MENTIONS LEGALES ===== */}
                <section id="mentions" className="legal-section">
                    <h2 className="legal-section-titre">1. Mentions légales</h2>

                    <h3>Éditeur du site</h3>
                    <p>
                        Le site <strong>Vite &amp; Gourmand</strong> est édité par la
                        société Vite &amp; Gourmand, SARL au capital de 10 000 €.
                    </p>
                    <ul className="legal-liste-info">
                        <li>
                            <strong>Siège social :</strong> {params.entreprise_adresse}
                        </li>
                        <li>
                            <strong>Téléphone :</strong> {params.entreprise_telephone}
                        </li>
                        <li>
                            <strong>Email :</strong> {params.entreprise_email}
                        </li>
                        <li>
                            <strong>SIRET :</strong> 123 456 789 00012
                        </li>
                        <li>
                            <strong>RCS :</strong> Bordeaux B 123 456 789
                        </li>
                        <li>
                            <strong>TVA intracommunautaire :</strong> FR12 123456789
                        </li>
                        <li>
                            <strong>Directeur de la publication :</strong> Julie &amp;
                            José Lambert
                        </li>
                    </ul>

                    <h3>Hébergement</h3>
                    <p>
                        Le site est hébergé par un prestataire d'hébergement web
                        professionnel. Les coordonnées précises de l'hébergeur peuvent
                        être obtenues sur simple demande à l'adresse{' '}
                        {params.entreprise_email}.
                    </p>

                    <h3>Propriété intellectuelle</h3>
                    <p>
                        L'ensemble du contenu de ce site (textes, images, photographies,
                        logos, charte graphique, structure) est la propriété exclusive
                        de Vite &amp; Gourmand. Toute reproduction, représentation,
                        modification ou exploitation, totale ou partielle, sans accord
                        écrit préalable est strictement interdite et constitue une
                        contrefaçon sanctionnée par les articles L.335-2 et suivants
                        du Code de la propriété intellectuelle.
                    </p>

                    <h3>Crédits photos</h3>
                    <p>
                        Les photographies de plats et de menus utilisées sur ce site
                        proviennent de la banque d'images Unsplash (libre de droits)
                        ou ont été réalisées spécialement pour Vite &amp; Gourmand.
                    </p>
                </section>

                {/* ===== CGV ===== */}
                <section id="cgv" className="legal-section">
                    <h2 className="legal-section-titre">
                        2. Conditions Générales de Vente
                    </h2>

                    <h3>Article 1 - Objet</h3>
                    <p>
                        Les présentes conditions générales de vente régissent les
                        relations contractuelles entre Vite &amp; Gourmand et toute
                        personne physique ou morale (le "Client") effectuant une
                        commande de prestation de traiteur via le site
                        vite-et-gourmand.fr.
                    </p>

                    <h3>Article 2 - Commandes et délais</h3>
                    <p>
                        Toute commande doit être effectuée au minimum <strong>7 jours
                        avant la date de prestation</strong>. Le nombre minimum de
                        convives varie selon le menu sélectionné. La validation de la
                        commande est conditionnée à l'acceptation expresse de Vite
                        &amp; Gourmand dans un délai de 48 heures.
                    </p>

                    <h3>Article 3 - Prix et paiement</h3>
                    <p>
                        Les prix sont indiqués en euros TTC, TVA française à 20 %
                        applicable. Un acompte de <strong>30 %</strong> est demandé
                        à la confirmation de la commande. Le solde est payable au
                        plus tard le jour de la prestation. Les modes de paiement
                        acceptés sont : virement bancaire, carte bancaire, chèque.
                    </p>

                    <h3>Article 4 - Réductions</h3>
                    <p>
                        Une réduction de <strong>10 %</strong> est appliquée
                        automatiquement à partir de 5 menus commandés simultanément.
                    </p>

                    <h3>Article 5 - Livraison</h3>
                    <p>
                        La livraison est effectuée sur le lieu indiqué par le Client
                        lors de la commande. Un forfait de base de 5 € s'applique,
                        augmenté de 0,59 € par kilomètre au-delà du périmètre du
                        siège social. Le matériel de service (plats, contenants
                        thermiques) reste la propriété de Vite &amp; Gourmand et
                        doit être restitué dans les 48 heures suivant la prestation.
                    </p>

                    <h3>Article 6 - Annulation</h3>
                    <p>
                        Toute annulation à l'initiative du Client doit être notifiée
                        par écrit. Les modalités de remboursement sont les suivantes :
                    </p>
                    <ul>
                        <li>Plus de 14 jours avant la prestation : remboursement intégral de l'acompte</li>
                        <li>Entre 7 et 14 jours : 50 % de l'acompte remboursé</li>
                        <li>Moins de 7 jours : acompte non remboursable</li>
                    </ul>

                    <h3>Article 7 - Responsabilité</h3>
                    <p>
                        Vite &amp; Gourmand respecte la réglementation sanitaire en
                        vigueur (HACCP). Le Client est tenu d'informer Vite &amp;
                        Gourmand de toute allergie alimentaire au moment de la
                        commande. La responsabilité de Vite &amp; Gourmand ne saurait
                        être engagée en cas de non-déclaration d'allergie.
                    </p>

                    <h3>Article 8 - Droit applicable</h3>
                    <p>
                        Les présentes CGV sont soumises au droit français. Tout
                        litige relèvera de la compétence exclusive des tribunaux de
                        Bordeaux.
                    </p>
                </section>

                {/* ===== POLITIQUE DE CONFIDENTIALITE ===== */}
                <section id="confidentialite" className="legal-section">
                    <h2 className="legal-section-titre">
                        3. Politique de confidentialité (RGPD)
                    </h2>

                    <p>
                        Vite &amp; Gourmand attache une grande importance à la
                        protection de vos données personnelles et s'engage à les
                        traiter conformément au Règlement Général sur la Protection
                        des Données (RGPD) et à la loi Informatique et Libertés.
                    </p>

                    <h3>Données collectées</h3>
                    <p>
                        Lors de votre inscription ou commande, nous collectons :
                    </p>
                    <ul>
                        <li>Nom, prénom</li>
                        <li>Adresse e-mail</li>
                        <li>Numéro de téléphone</li>
                        <li>Adresse de livraison</li>
                        <li>Historique de commandes</li>
                        <li>Préférences alimentaires (allergies, régimes)</li>
                    </ul>

                    <h3>Finalités</h3>
                    <p>
                        Vos données sont utilisées exclusivement pour :
                    </p>
                    <ul>
                        <li>Le traitement de vos commandes et la livraison</li>
                        <li>La gestion de votre compte client</li>
                        <li>L'envoi de communications liées à vos commandes</li>
                        <li>
                            L'envoi de newsletters (uniquement si vous y avez consenti)
                        </li>
                        <li>Le respect des obligations légales et fiscales</li>
                    </ul>

                    <h3>Base légale</h3>
                    <p>
                        Le traitement de vos données repose sur l'exécution du contrat
                        (commandes), votre consentement explicite (newsletters) et le
                        respect d'obligations légales (facturation).
                    </p>

                    <h3>Durée de conservation</h3>
                    <p>
                        Vos données de compte sont conservées tant que vous êtes
                        client actif. Les comptes inactifs depuis plus de{' '}
                        <strong>3 ans sont anonymisés automatiquement</strong> chaque
                        nuit à 3h du matin. Les données comptables (factures) sont
                        conservées 10 ans conformément aux obligations légales.
                    </p>

                    <h3>Destinataires</h3>
                    <p>
                        Vos données ne sont jamais cédées ni revendues à des tiers.
                        Elles sont accessibles uniquement aux employés autorisés de
                        Vite &amp; Gourmand et, le cas échéant, à nos prestataires
                        techniques (hébergement, envoi d'emails) qui sont eux-mêmes
                        liés par des engagements de confidentialité.
                    </p>

                    <h3>Vos droits</h3>
                    <p>
                        Conformément au RGPD, vous disposez des droits suivants sur
                        vos données :
                    </p>
                    <ul>
                        <li>
                            <strong>Droit d'accès</strong> : consulter les données que
                            nous détenons sur vous
                        </li>
                        <li>
                            <strong>Droit de rectification</strong> : corriger les
                            informations erronées
                        </li>
                        <li>
                            <strong>Droit à l'effacement</strong> : demander la
                            suppression de vos données ("droit à l'oubli")
                        </li>
                        <li>
                            <strong>Droit à la portabilité</strong> : récupérer vos
                            données dans un format réutilisable
                        </li>
                        <li>
                            <strong>Droit d'opposition</strong> : refuser certains
                            traitements
                        </li>
                        <li>
                            <strong>Droit de retrait du consentement</strong> à tout
                            moment (newsletters notamment)
                        </li>
                    </ul>
                    <p>
                        Pour exercer ces droits, contactez-nous à l'adresse{' '}
                        <a href={`mailto:${params.entreprise_email}`}>
                            {params.entreprise_email}
                        </a>
                        . Nous nous engageons à répondre dans un délai maximum d'un
                        mois.
                    </p>
                    <p>
                        En cas de litige non résolu, vous avez le droit d'introduire
                        une réclamation auprès de la Commission Nationale de
                        l'Informatique et des Libertés (CNIL) :{' '}
                        <a
                            href="https://www.cnil.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            www.cnil.fr
                        </a>
                        .
                    </p>

                    <h3>Cookies</h3>
                    <p>
                        Le site utilise uniquement des cookies <strong>strictement
                        nécessaires</strong> à son fonctionnement (session utilisateur,
                        sécurité CSRF). Aucun cookie publicitaire ou de traçage tiers
                        n'est utilisé. Aucun consentement n'est donc nécessaire pour
                        ces cookies essentiels.
                    </p>

                    <h3>Sécurité</h3>
                    <p>
                        Toutes vos données sont protégées par des mesures techniques
                        et organisationnelles appropriées : chiffrement des mots de
                        passe (bcrypt), connexion HTTPS, sessions sécurisées,
                        protection contre les injections SQL et les attaques CSRF,
                        hébergement professionnel européen.
                    </p>
                </section>

                <p className="legal-retour">
                    <a href="#top">↑ Retour en haut</a>
                </p>
            </div>
        </main>
    )
}
