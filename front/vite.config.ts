import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuration du serveur de developpement
  server: {
    port: 5173,
    
    // PROXY : redirige tous les appels /api/* vers le back-end (port 3000)
    // 
    // Sans ce proxy, le front (sur 5173) et le back (sur 3000) seraient
    // sur des origines differentes, ce qui declencherait des erreurs CORS
    // a chaque appel API.
    //
    // Avec le proxy, le front peut faire fetch('/api/menus') sans probleme,
    // Vite redirige la requete vers http://localhost:3000/api/menus.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Important : conserver les cookies de session entre front et back
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
