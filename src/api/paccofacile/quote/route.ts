import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { PaccoFacileQuoteRequest } from "./validators"
import { Modules } from "@medusajs/framework/utils"

// Type for the request body
type PaccoFacileQuoteType = z.infer<typeof PaccoFacileQuoteRequest>

export const POST = async (
  req: MedusaRequest<PaccoFacileQuoteType>,
  res: MedusaResponse
) => {

  // Access the validated body
  const { item, destination, service_id, pickup } = req.validatedBody

  // Process the items array
  const paccoFacileService = req.scope.resolve("paccofacile") as { getQuote: (item: any, destination: any, service_id: number, pickup: any) => Promise<any> }
  // const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT)

  // //const paccoFacileService = await fulfillmentModuleService.retrieveFulfillment("paccofacile-paccofacile")

  // //console.log("req.scope.registrations.fulfillment", req.scope.registrations.fulfillment.re)
  // //console.log("paccoFacileService", paccoFacileService)
  // const fulfillments = await fulfillmentModuleService.listFulfillments()
  // console.log("fulfillments", fulfillments)

  

  try {
    //items: Parcel[], destination: Address, service_id: number, pickup: Address
    const quoteData = await paccoFacileService.getQuote(item, destination, service_id, pickup)
    return res.json({ quote: quoteData })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch quote",
      error: error.message
    })
  }
}
