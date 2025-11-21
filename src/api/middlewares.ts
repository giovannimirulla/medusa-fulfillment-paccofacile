// src/api/middlewares.ts
import {
  validateAndTransformBody,
  defineMiddlewares,
  authenticate,
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
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
        validateAndTransformBody(PaccoFacileSettings),
      ],
    },
    {
      matcher: "/paccofacile/account",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
    {
      matcher: "/paccofacile/credit",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
    {
      matcher: "/paccofacile/settings/:name",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
  ],
})