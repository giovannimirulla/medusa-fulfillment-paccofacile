import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Resolve the paccofacile module service (not fulfillment provider)
    const paccoFacileService = req.scope.resolve("paccofacile") as { getCredit: () => Promise<any> }
    const creditData = await paccoFacileService.getCredit()
    return res.json(creditData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credit",
      error: error.message
    })
  }
}
