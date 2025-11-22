// src/api/middlewares.ts
import {
  validateAndTransformBody,
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"
import { PaccoFacileQuoteRequest } from "./paccofacile/quote/validators"
import { PostPaccofacileSettings } from "./admin/paccofacile/settings/validator"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/paccofacile/quote",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PaccoFacileQuoteRequest),
      ],
    },
    // Admin settings unified endpoint
    {
      matcher: "/admin/paccofacile/settings",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
    {
      matcher: "/admin/paccofacile/settings",
      method: "POST",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
        validateAndTransformBody(PostPaccofacileSettings),
      ],
    },
    {
      matcher: "/admin/paccofacile/account",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
    {
      matcher: "/admin/paccofacile/credit",
      method: "GET",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], { allowUnregistered: false }),
      ],
    },
  ],
})