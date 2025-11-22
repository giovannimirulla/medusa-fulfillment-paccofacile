import { model } from "@medusajs/framework/utils"

// Modello semplice per il setting PaccoFacile
// Campi minimi: id, auto_payment (boolean)
export const PaccofacileSetting = model.define(
  "paccofacile_setting",
  {
    id: model.id().primaryKey(),
    auto_payment: model.boolean(),
  }
)
