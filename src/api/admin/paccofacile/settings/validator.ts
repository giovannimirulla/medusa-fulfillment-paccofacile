import { z } from "zod"

export const PostPaccofacileSettings = z.object({
  auto_payment: z.boolean(),
})

export type PostPaccofacileSettingsType = z.infer<typeof PostPaccofacileSettings>
