import {
    createWorkflow,
    WorkflowResponse,
  } from '@medusajs/framework/workflows-sdk';
  import { updateSettingsStep } from './steps/update-settings-step';
  
  export type UpdatePaccoFacileSettingsInput = {
    name: string;
    value: string;
  };
  
  export const updatePaccoFacileSettingsWorkflow = createWorkflow(
    'update-paccofacile-settings',
    (input: UpdatePaccoFacileSettingsInput) => {
      const productSettings = updateSettingsStep(input);
  
      return new WorkflowResponse(productSettings);
    }
  );