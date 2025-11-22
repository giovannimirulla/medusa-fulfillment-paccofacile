import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { PACCOFACILE_SETTINGS_MODULE } from "../modules/paccofacile-setting"
import PaccofacileSettingsModuleService from "../modules/paccofacile-setting/service"

const getPaccofacileSettingsStep = createStep(
  "get-paccofacile-settings-step",
  async (_input, { container }) => {
    const service: PaccofacileSettingsModuleService = container.resolve(PACCOFACILE_SETTINGS_MODULE)
    const settings = await service.getSettings()
    return new StepResponse(settings)
  }
)

const getPaccofacileSettingsWorkflow = createWorkflow("get-paccofacile-settings", () => {
  const settings = getPaccofacileSettingsStep()
  return new WorkflowResponse(settings)
})

export default getPaccofacileSettingsWorkflow
