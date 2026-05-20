import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Bootstrap CSS - DOIT etre importe AVANT notre charte pour qu'on
// puisse override les styles Bootstrap si necessaire
import 'bootstrap/dist/css/bootstrap.min.css'

// Nos styles : charte (tokens) puis index (reset + base typo)
import './styles/charte.css'
import './styles/responsive-tables.css'
import './index.css'

import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
