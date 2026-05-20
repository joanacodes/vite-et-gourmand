import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import LayoutPublic from './components/layout/LayoutPublic'
import LayoutPro from './components/layout/LayoutPro'
import RouteProtegee from './components/RouteProtegee'

import Accueil from './pages/Accueil'
import Menus from './pages/Menus'
import DetailMenu from './pages/DetailMenu'
import Commande from './pages/Commande'
import Contact from './pages/Contact'
import Connexion from './pages/auth/Connexion'
import Inscription from './pages/auth/Inscription'
import MotDePasseOublie from './pages/auth/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/auth/ReinitialiserMotDePasse'

import PagePlaceholder from './pages/pro/PagePlaceholder'
import DashboardAdmin from './pages/pro/admin/Dashboard'
import ListeMenus from './pages/pro/admin/ListeMenus'
import FormulaireMenu from './pages/pro/admin/FormulaireMenu'
import GestionUtilisateurs from './pages/pro/admin/GestionUtilisateurs'
import GestionCommandes from './pages/pro/GestionCommandes'
import DetailCommande from './pages/pro/DetailCommande'
import GestionPlats from './pages/pro/GestionPlats'
import GestionHoraires from './pages/pro/GestionHoraires'
import ModerationAvis from './pages/pro/ModerationAvis'

function PageIntrouvable() {
    return (
        <main className="container py-5 text-center">
            <h1>404</h1>
            <p>Cette page n'existe pas.</p>
        </main>
    )
}

function App() {
    const { chargement } = useAuth()

    if (chargement) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border" style={{ color: 'var(--color-bordeaux)' }} role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        )
    }

    return (
        <Routes>
            {/* ===== ROUTES PUBLIQUES (Navbar + Footer) ===== */}
            <Route element={<LayoutPublic />}>
                <Route path="/" element={<Accueil />} />
                <Route path="/menus" element={<Menus />} />
                <Route path="/menu/:id" element={<DetailMenu />} />
                <Route path="/commande/:id" element={<Commande />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/inscription" element={<Inscription />} />
                <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
                <Route path="*" element={<PageIntrouvable />} />
            </Route>

            {/* ===== ESPACE EMPLOYE ===== */}
            <Route
                path="/employe"
                element={
                    <RouteProtegee rolesAutorises={['employe', 'administrateur']}>
                        <LayoutPro espace="employe" />
                    </RouteProtegee>
                }
            >
                <Route index element={<PagePlaceholder titre="Tableau de bord" description="Vue d'ensemble de votre activité" />} />
                <Route path="commandes" element={<GestionCommandes racine="/employe" />} />
                <Route path="commandes/:numero" element={<DetailCommande racine="/employe" />} />
                <Route path="menus" element={<ListeMenus racine="/employe" />} />
                <Route path="menus/nouveau" element={<FormulaireMenu racine="/employe" mode="creation" />} />
                <Route path="menus/:id" element={<FormulaireMenu racine="/employe" mode="edition" />} />
                <Route path="plats" element={<GestionPlats racine="/employe" />} />
                <Route path="horaires" element={<GestionHoraires racine="/employe" />} />
                <Route path="avis" element={<ModerationAvis racine="/employe" />} />
            </Route>

            {/* ===== ESPACE ADMIN ===== */}
            <Route
                path="/admin"
                element={
                    <RouteProtegee rolesAutorises={['administrateur']}>
                        <LayoutPro espace="admin" />
                    </RouteProtegee>
                }
            >
                <Route index element={<DashboardAdmin />} />
                <Route path="menus" element={<ListeMenus racine="/admin" />} />
                <Route path="menus/nouveau" element={<FormulaireMenu racine="/admin" mode="creation" />} />
                <Route path="menus/:id" element={<FormulaireMenu racine="/admin" mode="edition" />} />
                <Route path="plats" element={<GestionPlats racine="/admin" />} />
                <Route path="commandes" element={<GestionCommandes racine="/admin" />} />
                <Route path="commandes/:numero" element={<DetailCommande racine="/admin" />} />
                <Route path="utilisateurs" element={<GestionUtilisateurs />} />
                <Route path="avis" element={<ModerationAvis racine="/admin" />} />
                <Route path="horaires" element={<GestionHoraires racine="/admin" />} />
                <Route path="statistiques" element={<PagePlaceholder titre="Statistiques" />} />
                <Route path="parametres" element={<PagePlaceholder titre="Paramètres" />} />
            </Route>
        </Routes>
    )
}

export default App
