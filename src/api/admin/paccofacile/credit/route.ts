import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Access the provider service directly from container
    const providerService = req.scope.resolve("pp_paccofacile") as { getCredit: () => Promise<any> }
    const creditData = await providerService.getCredit()
    return res.json(creditData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credit",
      error: error.message
    })
  }
}
