import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Connexion from './pages/auth/Connexion'
import Inscription from './pages/auth/Inscription'
import MotDePasseOublie from './pages/auth/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/auth/ReinitialiserMotDePasse'

// Pages provisoires inline. On les extraira dans src/pages/ au fur et a mesure.

function Accueil() {
    return (
        <main className="container py-5">
            <h1 className="text-center mb-4">Bienvenue chez Vite & Gourmand</h1>
            <p className="text-center lead">
                Une cuisine d'exception, livrée chez vous.
            </p>
            <p className="text-center text-muted">
                Le site est en cours de construction. 🍽️
            </p>
        </main>
    )
}

function Menus() {
    return (
        <main className="container py-5">
            <h1>Nos menus</h1>
            <p>Page en cours de construction.</p>
        </main>
    )
}

function Contact() {
    return (
        <main className="container py-5">
            <h1>Contact</h1>
            <p>Page en cours de construction.</p>
        </main>
    )
}

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

    // Pendant le chargement initial de la session, on affiche un spinner
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
