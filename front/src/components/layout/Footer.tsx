// ============================================================
// FOOTER - Pied de page bleu marine
// ============================================================

import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer-principal">
            <div className="container py-5">
                <div className="row g-4">
                    {/* Colonne 1 : Branding */}
                    <div className="col-md-3">
                        <h3 className="footer-titre">Vite & Gourmand</h3>
                        <p className="footer-slogan mt-3">
                            Une cuisine d'exception, livrée chez vous.
                        </p>
                        <p className="footer-slogan">
                            Artisan traiteur depuis 1999.
                        </p>
                        <div className="d-flex align-items-start gap-2 mt-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="flex-shrink-0 mt-1"
                                aria-hidden="true"
                            >
                                <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="footer-adresse">
                                15 Rue des Remparts<br />
                                33000 Bordeaux, France
                            </span>
                        </div>
                    </div>

                    {/* Colonne 2 : Horaires */}
                    <div className="col-md-3">
                        <h4 className="footer-section-titre">HORAIRES</h4>
                        <ul className="footer-liste">
                            <li className="d-flex justify-content-between">
                                <span>Lundi - Vendredi</span>
                                <span>9h - 18h</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span>Samedi</span>
                                <span>9h - 14h</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span>Dimanche</span>
                                <span>Fermé</span>
                            </li>
                        </ul>
                    </div>

                    {/* Colonne 3 : Liens utiles */}
                    <div className="col-md-3">
                        <h4 className="footer-section-titre">LIENS UTILES</h4>
                        <ul className="footer-liste">
                            <li>
                                <Link to="/mentions-legales" className="footer-lien">
                                    Mentions légales
                                </Link>
                            </li>
                            <li>
                                <Link to="/cgv" className="footer-lien">
                                    Conditions Générales de Vente
                                </Link>
                            </li>
                            <li>
                                <Link to="/confidentialite" className="footer-lien">
                                    Politique de confidentialité
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="footer-lien">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Colonne 4 : Reseaux sociaux */}
                    <div className="col-md-3">
                        <h4 className="footer-section-titre">SUIVEZ-NOUS</h4>
                        <div className="d-flex gap-3 mt-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-rs-icone"
                                aria-label="Facebook"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                </svg>
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-rs-icone"
                                aria-label="Instagram"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-rs-icone"
                                aria-label="LinkedIn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="footer-copyright mt-4 pt-4 d-flex justify-content-between flex-wrap">
                    <span>&copy; 2026 Vite & Gourmand. Tous droits réservés.</span>
                    <span>Designé avec passion à Bordeaux.</span>
                </div>
            </div>
        </footer>
    )
}
