import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { PACCOFACILE_SETTINGS_MODULE } from "../modules/paccofacile-setting"
import PaccofacileSettingsModuleService from "../modules/paccofacile-setting/service"

export type SetupPaccofacileSettingsInput = {
  auto_payment: boolean
}

const savePaccofacileSettingsStep = createStep(
  "save-paccofacile-settings-step",
  async (input: SetupPaccofacileSettingsInput, { container }) => {
    const service: PaccofacileSettingsModuleService = container.resolve(PACCOFACILE_SETTINGS_MODULE)
    const success = await service.updateSettings(input.auto_payment)
    return new StepResponse(success)
  }
)

const setupPaccofacileSettingsWorkflow = createWorkflow(
  "setup-paccofacile-settings",
  (input: SetupPaccofacileSettingsInput) => {
    const success = savePaccofacileSettingsStep(input)
    return new WorkflowResponse({ success, input })
  }
)

export default setupPaccofacileSettingsWorkflow
