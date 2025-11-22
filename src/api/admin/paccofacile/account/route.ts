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
    const providerService = req.scope.resolve("fp_paccofacile_paccofacile") as { getAccount: () => Promise<any> }
    const accountData = await providerService.getAccount()
    return res.json(accountData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch account",
      error: error.message
    })
  }
}
