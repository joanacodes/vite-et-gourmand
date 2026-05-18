// ============================================================
// CARTE MENU - Card individuelle dans la grille
// ============================================================

import { Link } from 'react-router-dom'
import type { Menu } from '../../types'
import './CarteMenu.css'

interface CarteMenuProps {
    menu: Menu
}

export default function CarteMenu({ menu }: CarteMenuProps) {
    const urlImage = menu.image_principale?.url || null

    return (
        <article className="carte-menu">
            <div className="carte-menu-image">
                {urlImage ? (
                    <img
                        src={urlImage}
                        alt={menu.image_principale?.legende || menu.titre}
                        loading="lazy"
                    />
                ) : (
                    <div className="carte-menu-image-placeholder" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 11h18l-2 9H5l-2-9Z" />
                            <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                        </svg>
                    </div>
                )}

                {/* Badge theme en haut a gauche */}
                {menu.theme && (
                    <span className="carte-menu-badge-theme">
                        {menu.theme}
                    </span>
                )}

                {/* Badge stock si faible */}
                {menu.quantite_restante > 0 && menu.quantite_restante <= 5 && (
                    <span className="carte-menu-badge-stock">
                        Plus que {menu.quantite_restante}
                    </span>
                )}
            </div>

            <div className="carte-menu-contenu">
                <h3 className="carte-menu-titre">{menu.titre}</h3>
                <p className="carte-menu-description">{menu.description}</p>

                <div className="carte-menu-tags">
                    <span className="carte-menu-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Min. {menu.nombre_personnes_minimum} pers.
                    </span>
                </div>

                <div className="carte-menu-footer">
                    <div className="carte-menu-prix">
                        <span className="carte-menu-prix-valeur">
                            {Math.round(Number(menu.prix_par_personne))}€
                        </span>
                        <span className="carte-menu-prix-unite">/pers.</span>
                    </div>
                    <Link to={`/menu/${menu.menu_id}`} className="carte-menu-lien">
                        Voir le menu →
                    </Link>
                </div>
            </div>
        </article>
    )
}
