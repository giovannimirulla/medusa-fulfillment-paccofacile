import Medusa from "@medusajs/js-sdk"

// Risolvi correttamente la baseUrl del backend quando l'admin è hostato su dominio separato.
// Ordine di priorità:
// 1. Variabile globale __BACKEND_URL__ (iniettata dal build Medusa Admin)
// 2. Env VITE_BACKEND_URL (per progetti che la impostano esplicitamente)
// 3. window.__BACKEND_URL__ (fallback runtime se definita via script)
// 4. process.env.MEDUSA_BACKEND_URL (fallback Node in dev plugin:develop)
// 5. Origin corrente (location.origin) come ultima risorsa
const resolvedBackendUrl = (typeof __BACKEND_URL__ !== 'undefined' && __BACKEND_URL__) ||
  import.meta.env.VITE_BACKEND_URL ||
  // @ts-ignore - possibilità di definire window.__BACKEND_URL__ via script inline
  (typeof window !== 'undefined' ? (window as any).__BACKEND_URL__ : undefined) ||
  (typeof process !== 'undefined' ? process.env.MEDUSA_BACKEND_URL : undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9000')

// Normalizza rimuovendo eventuale slash finale per consistenza nelle fetch
const baseUrl = resolvedBackendUrl.replace(/\/$/, '')

export const sdk = new Medusa({
  baseUrl,
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})