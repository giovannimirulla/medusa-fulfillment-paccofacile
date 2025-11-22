import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Try different provider resolution names
    let providerService
    try {
      providerService = req.scope.resolve("pp_paccofacile_paccofacile")
    } catch {
      try {
        providerService = req.scope.resolve("pp_paccofacile")
      } catch {
        providerService = req.scope.resolve("fp_paccofacile")
      }
    }
    
    const accountData = await providerService.getAccount()
    return res.json(accountData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch account",
      error: error.message
    })
  }
}
