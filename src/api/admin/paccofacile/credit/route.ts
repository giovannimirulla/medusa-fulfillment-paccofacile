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
    
    const creditData = await providerService.getCredit()
    return res.json(creditData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credit",
      error: error.message
    })
  }
}
