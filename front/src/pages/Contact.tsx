// ============================================================
// PAGE CONTACT
//
// Formulaire de contact accessible a tous (visiteurs comme
// utilisateurs connectes). Envoie un mail a Julie & Jose.
//
// Endpoint back : POST /api/contact
// Body attendu : { nom, email, sujet, message }
// ============================================================

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import './Contact.css'

export default function Contact() {
    const { utilisateur } = useAuth()

    // ===== ETATS DU FORMULAIRE =====
    const [nom, setNom] = useState('')
    const [email, setEmail] = useState('')
    const [sujet, setSujet] = useState('')
    const [message, setMessage] = useState('')

    // ===== ETATS D'INTERFACE =====
    const [chargement, setChargement] = useState(false)
    const [succes, setSucces] = useState(false)
    const [erreur, setErreur] = useState<string | null>(null)

    // ===== AUTO-REMPLISSAGE SI L'UTILISATEUR EST CONNECTE =====
    useEffect(() => {
        if (utilisateur) {
            setNom(`${utilisateur.prenom} ${utilisateur.nom}`)
            setEmail(utilisateur.email)
        }
    }, [utilisateur])

    // ===== VALIDATION COTE FRONT =====
    function validerFormulaire(): string | null {
        if (!nom.trim() || !email.trim() || !sujet.trim() || !message.trim()) {
            return 'Tous les champs sont obligatoires.'
        }
        if (nom.length > 100) {
            return 'Le nom est trop long (100 caractères maximum).'
        }
        if (sujet.length > 200) {
            return 'Le sujet est trop long (200 caractères maximum).'
        }
        if (message.length > 5000) {
            return 'Le message est trop long (5000 caractères maximum).'
        }
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!regexEmail.test(email)) {
            return "Le format de l'adresse email n'est pas valide."
        }
        return null
    }

    // ===== SOUMISSION =====
    async function soumettre(e: FormEvent) {
        e.preventDefault()
        setErreur(null)

        const messageErreur = validerFormulaire()
        if (messageErreur) {
            setErreur(messageErreur)
            return
        }

        setChargement(true)

        try {
            await api.post('/api/contact', { nom, email, sujet, message })
            setSucces(true)
            // On vide le sujet et le message, mais on garde nom/email
            // (utile si l'utilisateur veut renvoyer un autre message)
            setSujet('')
            setMessage('')
        } catch (err: any) {
            setErreur(err?.message || "Une erreur est survenue. Réessayez plus tard.")
        } finally {
            setChargement(false)
        }
    }

    return (
        <main className="page-contact">
            {/* ===== HERO ===== */}
            <section className="contact-hero">
                <div className="container">
                    <h1 className="titre-serif contact-hero-titre">
                        Contactez-nous
                    </h1>
                    <p className="contact-hero-soustitre">
                        Une question, un événement à organiser, un devis sur mesure ?
                        Julie et José vous répondent sous 48h.
                    </p>
                </div>
            </section>

            {/* ===== CORPS ===== */}
            <section className="contact-corps">
                <div className="container">
                    <div className="row g-4">

                        {/* ----- COLONNE FORMULAIRE ----- */}
                        <div className="col-lg-7">
                            <div className="contact-carte">
                                <h2 className="titre-serif contact-titre-carte">
                                    Envoyez-nous un message
                                </h2>

                                {succes ? (
                                    // ===== ETAT SUCCES =====
                                    <div className="contact-succes" role="status" aria-live="polite">
                                        <div className="contact-succes-icone" aria-hidden="true">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <path d="m9 11 3 3L22 4" />
                                            </svg>
                                        </div>
                                        <h3 className="titre-serif">Message envoyé !</h3>
                                        <p className="text-muted">
                                            Merci pour votre message. Julie ou José vous répondra
                                            dans les plus brefs délais à l'adresse <strong>{email}</strong>.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary mt-3"
                                            onClick={() => setSucces(false)}
                                        >
                                            Envoyer un autre message
                                        </button>
                                    </div>
                                ) : (
                                    // ===== ETAT FORMULAIRE =====
                                    <form onSubmit={soumettre} noValidate>

                                        {/* Erreur globale */}
                                        {erreur && (
                                            <div className="alert alert-danger" role="alert">
                                                {erreur}
                                            </div>
                                        )}

                                        {/* Nom */}
                                        <div className="mb-3">
                                            <label htmlFor="nom" className="form-label fw-medium">
                                                Nom complet <span className="text-danger" aria-hidden="true">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="nom"
                                                className="form-control"
                                                placeholder="Jean Dupont"
                                                value={nom}
                                                onChange={(e) => setNom(e.target.value)}
                                                required
                                                maxLength={100}
                                                autoComplete="name"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label fw-medium">
                                                Adresse email <span className="text-danger" aria-hidden="true">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="form-control"
                                                placeholder="jean.dupont@exemple.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                            />
                                            <div className="form-text">
                                                Nous vous répondrons à cette adresse.
                                            </div>
                                        </div>

                                        {/* Sujet */}
                                        <div className="mb-3">
                                            <label htmlFor="sujet" className="form-label fw-medium">
                                                Sujet <span className="text-danger" aria-hidden="true">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="sujet"
                                                className="form-control"
                                                placeholder="Demande de devis, question sur un menu..."
                                                value={sujet}
                                                onChange={(e) => setSujet(e.target.value)}
                                                required
                                                maxLength={200}
                                            />
                                        </div>

                                        {/* Message */}
                                        <div className="mb-4">
                                            <label htmlFor="message" className="form-label fw-medium">
                                                Votre message <span className="text-danger" aria-hidden="true">*</span>
                                            </label>
                                            <textarea
                                                id="message"
                                                className="form-control"
                                                placeholder="Décrivez votre projet, votre événement, vos questions..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                required
                                                rows={6}
                                                maxLength={5000}
                                            />
                                            <div className="form-text">
                                                {message.length} / 5000 caractères
                                            </div>
                                        </div>

                                        {/* Bouton submit */}
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100 py-2"
                                            disabled={chargement}
                                        >
                                            {chargement ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2" aria-hidden="true">
                                                        <path d="m22 2-7 20-4-9-9-4Z" />
                                                        <path d="M22 2 11 13" />
                                                    </svg>
                                                    Envoyer le message
                                                </>
                                            )}
                                        </button>

                                        <p className="text-muted small mt-3 mb-0 text-center">
                                            En envoyant ce message, vous acceptez que vos données soient
                                            traitées pour répondre à votre demande, conformément à notre{' '}
                                            <Link to="/confidentialite">politique de confidentialité</Link>.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* ----- COLONNE INFOS ----- */}
                        <div className="col-lg-5">
                            <div className="contact-carte contact-carte-infos">
                                <h2 className="titre-serif contact-titre-carte">
                                    Nos coordonnées
                                </h2>

                                {/* Adresse */}
                                <div className="contact-info-bloc">
                                    <div className="contact-info-icone" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="contact-info-titre">Adresse</h3>
                                        <p className="contact-info-texte">
                                            12 rue des Gourmets<br />
                                            33000 Bordeaux<br />
                                            France
                                        </p>
                                    </div>
                                </div>

                                {/* Téléphone */}
                                <div className="contact-info-bloc">
                                    <div className="contact-info-icone" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="contact-info-titre">Téléphone</h3>
                                        <p className="contact-info-texte">
                                            <a href="tel:+33556000000">05 56 00 00 00</a>
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="contact-info-bloc">
                                    <div className="contact-info-icone" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="16" x="2" y="4" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="contact-info-titre">Email</h3>
                                        <p className="contact-info-texte">
                                            <a href="mailto:contact@vite-et-gourmand.fr">
                                                contact@vite-et-gourmand.fr
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Horaires */}
                                <div className="contact-info-bloc">
                                    <div className="contact-info-icone" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="contact-info-titre">Horaires d'ouverture</h3>
                                        <ul className="contact-horaires">
                                            <li><span>Lundi - Vendredi</span><span>9h - 19h</span></li>
                                            <li><span>Samedi</span><span>10h - 18h</span></li>
                                            <li><span>Dimanche</span><span>Fermé</span></li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Délai de réponse */}
                                <div className="contact-encadre-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-1">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                    <p className="mb-0">
                                        <strong>Délai de réponse :</strong> nous répondons à toutes
                                        les demandes sous 48h ouvrées.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </main>
    )
}
