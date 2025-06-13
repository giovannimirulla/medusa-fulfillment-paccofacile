import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id, methodId } = req.params
  const { data } = req.body as { data: any }
  
  if (!id || !methodId || !data) {
    return res.status(400).json({
      message: "Missing required parameters: order ID, shipping method ID, or data"
    })
  }

  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    // Update the shipping method with the new data
    const updatedShippingMethod = await orderModuleService.updateOrderShippingMethods({
      id: methodId,
      data: data
    })
    
    return res.json({
      success: true,
      shipping_method: updatedShippingMethod
    })
  } catch (error) {
    console.error("Error updating shipping method data:", error)
    return res.status(500).json({
      message: "An error occurred while updating the shipping method data",
      error: error.message
    })
  }
}