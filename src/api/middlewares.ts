// src/api/middlewares.ts
import {
  validateAndTransformBody,
  defineMiddlewares,
} from "@medusajs/framework/http"
import { PaccoFacileQuoteRequest } from "./paccofacile/quote/validators"
import { PaccoFacileSettings } from "./paccofacile/settings/[name]/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/paccofacile/quote",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PaccoFacileQuoteRequest),
      ],
    },
    {
      matcher: "/paccofacile/settings/:name",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PaccoFacileSettings),
      ],
    },
  ],
})