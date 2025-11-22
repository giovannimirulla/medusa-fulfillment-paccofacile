import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = true

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {


  // Process the items array
  const paccoFacileService = req.scope.resolve("paccofacile") as { getCredit: () => Promise<any> }
  // const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT)

  // //const paccoFacileService = await fulfillmentModuleService.retrieveFulfillment("paccofacile-paccofacile")

  // //console.log("req.scope.registrations.fulfillment", req.scope.registrations.fulfillment.re)
  // //console.log("paccoFacileService", paccoFacileService)
  // const fulfillments = await fulfillmentModuleService.listFulfillments()
  // console.log("fulfillments", fulfillments)

  

  try {
    //items: Parcel[], destination: Address, service_id: number, pickup: Address
    const creditData = await paccoFacileService.getCredit()
    return res.json(creditData)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credit",
      error: error.message
    })
  }
}
