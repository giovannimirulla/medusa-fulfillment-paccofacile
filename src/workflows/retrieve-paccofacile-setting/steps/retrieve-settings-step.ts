import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { GetPaccoFacileSettingsInput } from '..';
import PaccoFacileModuleService from '../../../modules/paccofacile/service';
import { PACCOFACILE_MODULE } from '../../../modules/paccofacile';

export const retrieveSettingsStep = createStep('retrieve-settings-step', async (input: GetPaccoFacileSettingsInput, { container }) => {
  const SettingsModule: PaccoFacileModuleService = container.resolve(PACCOFACILE_MODULE);

let _productSettings = await SettingsModule.retrievePaccoFacileSettings(input.name).catch(() => undefined);

  return new StepResponse(_productSettings);
});

