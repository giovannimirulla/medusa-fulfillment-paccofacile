import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

/**
 * GET /admin/orders/:id/fulfillments/:fulfillment_id/documents
 * Retrieves documents (labels, invoices, customs docs) for a specific fulfillment
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: orderId, fulfillment_id: fulfillmentId } = req.params
  const { type } = req.query // Optional: filter by document type

  try {
    // Resolve Fulfillment Module
    const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT)
    
    // Get the fulfillment
    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(fulfillmentId, {
      relations: ["provider_id"],
    })

    if (!fulfillment) {
      return res.status(404).json({
        message: "Fulfillment not found"
      })
    }

    // Check if it's a PaccoFacile fulfillment
    if (!fulfillment.provider_id || !fulfillment.provider_id.includes("paccofacile")) {
      return res.status(400).json({
        message: "This fulfillment is not from PaccoFacile provider"
      })
    }

    // Resolve the PaccoFacile provider
    const providerService = req.scope.resolve(fulfillment.provider_id) as any

    if (!providerService || typeof providerService.retrieveDocuments !== "function") {
      return res.status(500).json({
        message: "Provider service not found or does not support document retrieval"
      })
    }

    // Retrieve documents from PaccoFacile
    const documents = await providerService.retrieveDocuments(
      fulfillment.data,
      type as string | undefined
    )

    return res.json({
      fulfillment_id: fulfillmentId,
      order_id: orderId,
      documents: documents.map((doc: any) => ({
        content: doc.content, // base64
        format: doc.format,   // pdf, png, etc.
        type: doc.label,      // LABEL_LDV, FATTURA_PRO_FORMA, etc.
      }))
    })

  } catch (error: any) {
    console.error("Failed to retrieve fulfillment documents:", error)
    return res.status(500).json({
      message: "Failed to retrieve documents",
      error: error.message
    })
  }
}
