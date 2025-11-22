import PaccoFacileModuleService from "./service"
import { ModuleExports } from "@medusajs/framework/types"

const service = PaccoFacileModuleService

export default service

/**
 * Module definition for PaccoFacile admin features.
 * Provides account and credit API access for admin UI.
 */
export const PACCOFACILE_MODULE = "paccofacile"
