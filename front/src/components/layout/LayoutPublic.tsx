// Wrapper qui empaquete Navbar + page + Footer.
// Utilise pour toutes les routes "grand public".

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function LayoutPublic() {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    )
}
