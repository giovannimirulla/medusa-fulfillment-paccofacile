import { MedusaService } from "@medusajs/framework/utils"
import { PaccofacileSetting } from "./models/setting"

// Service per gestione setting PaccoFacile (solo auto_payment per ora)
export class PaccofacileSettingsModuleService extends MedusaService({
  PaccofacileSetting,
}) {
  async updateSettings(auto_payment: boolean): Promise<boolean> {
    const existing = await this.listPaccofacileSettings()
    if (existing.length) {
      const updated = await this.updatePaccofacileSettings({
        id: existing[0].id,
        auto_payment,
      })
      return !!updated
    }
    const created = await this.createPaccofacileSettings({ auto_payment })
    return !!created
  }

  async getSettings(): Promise<{ auto_payment: boolean } | null> {
    const existing = await this.listPaccofacileSettings()
    if (existing.length) {
      return { auto_payment: !!existing[0].auto_payment }
    }
    return null
  }
}

export default PaccofacileSettingsModuleService
