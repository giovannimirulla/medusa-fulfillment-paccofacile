// src/api/admin/pacco-facile/settings/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { retrievePaccoFacileSettingsWorkflow } from "../../../../workflows/retrieve-paccofacile-setting"
import { updatePaccoFacileSettingsWorkflow } from "../../../../workflows/update-paccofacile-settings"

import { z } from "zod"
import { PaccoFacileSettings } from "./validators"


type PaccoFacileSettingsType = z.infer<typeof PaccoFacileSettings>

export const POST = async (
  req: MedusaRequest<PaccoFacileSettingsType>,
  res: MedusaResponse
) => {
  const name = req.params.name;
  const { value } = req.validatedBody

  const { result } = await updatePaccoFacileSettingsWorkflow(req.scope).run({
    input: {
      name,
      value
    },
    throwOnError: false,
    logOnError: true,
  });

  res.json({
    settings: result,
  })

}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const name = req.params.name

  const { result } = await retrievePaccoFacileSettingsWorkflow(req.scope).run({
    input: { name },
    throwOnError: false,
    logOnError: true,
  });

  res.json(result);

}