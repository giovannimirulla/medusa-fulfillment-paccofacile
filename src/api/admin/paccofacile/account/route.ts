import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Resolve the paccofacile module service (not fulfillment provider)
    const paccoFacileService = req.scope.resolve("paccofacile") as { getAccount: () => Promise<any> }
    const accountData = await paccoFacileService.getAccount()
    return res.json(accountData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch account",
      error: error.message
    })
  }
}
