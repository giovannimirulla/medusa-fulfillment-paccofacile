import { Module } from "@medusajs/framework/utils"
import PaccofacileSettingsModuleService from "./service"

export const PACCOFACILE_SETTINGS_MODULE = "paccofacile_settings"

export default Module(PACCOFACILE_SETTINGS_MODULE, {
  service: PaccofacileSettingsModuleService,
})
