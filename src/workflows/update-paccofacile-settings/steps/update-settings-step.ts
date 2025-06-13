import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { UpdatePaccoFacileSettingsInput } from '..';
import PaccoFacileModuleService from '../../../modules/paccofacile/service';
import { PACCOFACILE_MODULE } from '../../../modules/paccofacile';

export const updateSettingsStep = createStep('update-settings-step', async (input: UpdatePaccoFacileSettingsInput, { container }) => {
  const SettingsModule: PaccoFacileModuleService = container.resolve(PACCOFACILE_MODULE);

  let _productSettings = await SettingsModule.retrievePaccoFacileSettings(input.name).catch(() => undefined);
    
  if (!_productSettings) return new StepResponse(await SettingsModule.createPaccoFacileSettings(input));

  return new StepResponse(await SettingsModule.updatePaccoFacileSettings(input));
});