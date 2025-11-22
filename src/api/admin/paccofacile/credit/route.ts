import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Provider ID format: fp_{identifier}_{id}
    // identifier = "paccofacile" (from service.ts static identifier)
    // id = "paccofacile" (from medusa-config.ts)
    const providerService = req.scope.resolve("fp_paccofacile_paccofacile") as { getCredit: () => Promise<any> }
    const creditData = await providerService.getCredit()
    return res.json(creditData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credit",
      error: error.message
    })
  }
}
