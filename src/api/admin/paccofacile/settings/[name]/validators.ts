// src/api/admin/pacco-facile/validators.ts
import { z } from "zod"

export const PaccoFacileSettings = z.object({
  value: z.string()
})