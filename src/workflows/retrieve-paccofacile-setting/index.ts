import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk';
import { retrieveSettingsStep } from './steps/retrieve-settings-step';

export type GetPaccoFacileSettingsInput = {
    name: string;
};

export const retrievePaccoFacileSettingsWorkflow = createWorkflow('retrieve-paccofacile-settings', (input: GetPaccoFacileSettingsInput) => {
  const productSettings = retrieveSettingsStep(input);

  return new WorkflowResponse(productSettings);
});