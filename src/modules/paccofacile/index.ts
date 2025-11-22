import { Module } from "@medusajs/framework/utils"
import PaccoFacileModuleService from "./service"

export const PACCOFACILE_MODULE = "paccofacile"

export default Module(PACCOFACILE_MODULE, {
  service: PaccoFacileModuleService,
})
