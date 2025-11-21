import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})

// Helper to construct full URLs for custom API endpoints
export const getBackendUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`
}