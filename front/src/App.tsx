import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Connexion from './pages/auth/Connexion'
import Inscription from './pages/auth/Inscription'
import MotDePasseOublie from './pages/auth/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/auth/ReinitialiserMotDePasse'
import Menus from './pages/Menus'
import DetailMenu from './pages/DetailMenu'
import Accueil from './pages/Accueil'
import Contact from './pages/Contact'
import Commande from './pages/Commande'

// Pages provisoires inline (a extraire au fur et a mesure)

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
        <>
            <Navbar />

            <Routes>
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
            </Routes>

            <Footer />
        </>
    )
}

export default App
