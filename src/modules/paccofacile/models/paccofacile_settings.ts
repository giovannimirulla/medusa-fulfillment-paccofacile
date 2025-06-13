// src/modules/custom-setting/models/custom-setting.ts
import { model } from "@medusajs/framework/utils"

export const PaccoFacileSettings = model.define("paccofacile_settings", {
  name: model.text().primaryKey(),
  value: model.text(),
})