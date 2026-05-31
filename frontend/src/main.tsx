import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import './i18n';
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SystemProvider } from './context/SystemContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModalProvider } from './components/shared/ModalProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "389686748462-nh36uj8ht8go4unb9607sclhgl1plb7r.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <SystemProvider>
            <WishlistProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </WishlistProvider>
          </SystemProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
