import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Access the provider service directly from container
    const providerService = req.scope.resolve("pp_paccofacile") as { getAccount: () => Promise<any> }
    const accountData = await providerService.getAccount()
    return res.json(accountData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch account",
      error: error.message
    })
  }
}
