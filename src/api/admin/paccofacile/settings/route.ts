import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PostPaccofacileSettingsType } from "./validator"
import getPaccofacileSettingsWorkflow from "../../../../workflows/get-paccofacile-settings"
import setupPaccofacileSettingsWorkflow from "../../../../workflows/setup-paccofacile-settings"

export const AUTHENTICATE = true

// GET /admin/paccofacile/settings
export const GET = async (req: MedusaRequest, res: MedusaResponse<{ auto_payment: boolean }>) => {
  try {
    const { result, errors } = await getPaccofacileSettingsWorkflow().run({ input: {} })
    if (errors?.length) {
      return res.status(500).json({ auto_payment: false })
    }
    return res.json({ auto_payment: result?.auto_payment ?? false })
  } catch (e) {
    req.scope.resolve("logger").error("Error fetching PaccoFacile settings", e)
    return res.status(500).json({ auto_payment: false })
  }
}

// POST /admin/paccofacile/settings
// La validazione del corpo è ora gestita nel middleware con validateAndTransformBody.
export const POST = async (req: MedusaRequest, res: MedusaResponse<{ success: boolean; input: PostPaccofacileSettingsType; errors?: unknown }>) => {
  try {
    const input = req.validatedBody as PostPaccofacileSettingsType
    const { result, errors } = await setupPaccofacileSettingsWorkflow(req.scope).run({ input })
    if (errors?.length) {
      return res.status(400).json({ success: false, input, errors })
    }
    return res.json({ success: !!result?.success, input })
  } catch (e) {
    req.scope.resolve("logger").error("Error saving PaccoFacile settings", e)
    return res.status(500).json({ success: false, input: req.body as any, errors: ["Internal Server Error"] })
  }
}
