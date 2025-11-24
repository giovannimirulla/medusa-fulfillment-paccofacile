import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type LocalityValidationRequest = {
  iso_code?: string
  search?: string
  postal_code?: string
}

type LocalityResponse = {
  cap: string
  locality: string
  StateOrProvinceCode: string
  iso_code: string
  latitude?: number
  longitude?: number
}

/**
 * POST endpoint to validate and search for localities using PaccoFacile API
 * Accessible from storefront at: /store/paccofacile/locality/validation
 */
export const POST = async (
  req: MedusaRequest<LocalityValidationRequest>,
  res: MedusaResponse
) => {
  const { iso_code = "IT", search, postal_code } = req.body || {}

  // Validate that at least one search parameter is provided
  if (!search && !postal_code) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Either 'search' or 'postal_code' parameter is required"
    )
  }

  try {
    // Get PaccoFacile configuration from environment
    const environment = process.env.PACCOFACILE_ENVIRONMENT || "live"
    const apiKey = process.env.PACCOFACILE_API_KEY
    const apiToken = process.env.PACCOFACILE_API_TOKEN
    const accountNumber = process.env.PACCOFACILE_ACCOUNT_NUMBER

    if (!apiKey || !apiToken || !accountNumber) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PaccoFacile credentials are not configured"
      )
    }

    // Call PaccoFacile locality validation API
    const paccofacileUrl = `https://paccofacile.tecnosogima.cloud/${environment}/v1/service/locality/validation`
    
    const response = await fetch(paccofacileUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Account-Number": accountNumber,
        "Api-Key": apiKey,
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        iso_code,
        search,
        postal_code,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PaccoFacile API error:", errorText)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to validate locality: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    
    // PaccoFacile returns: { header: {...}, data: { items: [...] } }
    // We need to extract the items array from the nested structure
    let localities: LocalityResponse[] = []
    
    if (Array.isArray(data)) {
      // Response is an array of objects with header/data structure
      localities = data.flatMap(item => item?.data?.items || [])
    } else if (data?.data?.items) {
      // Single response with header/data structure
      localities = data.data.items
    } else if (Array.isArray(data.items)) {
      // Direct items array
      localities = data.items
    } else {
      // Fallback: treat data as single locality
      localities = [data]
    }

    res.json({
      localities,
    })
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error
    }
    
    console.error("Error validating locality:", error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "An unexpected error occurred while validating locality"
    )
  }
}
