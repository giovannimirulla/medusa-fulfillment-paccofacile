import { z } from "zod"

export const PaccoFacileQuoteRequest = z.object({
    item: 
        z.object({
            shipment_type: z.number().min(0, "Shipment type is required"),
            dim1: z.number().min(1, "Dimension is required"),
            dim2: z.number().min(1, "Dimension is required"),
            dim3: z.number().min(1, "Dimension is required"),
            weight: z.number().min(0, "Weight is required"),
        })
    ,
    destination: z.object({
        iso_code: z.string().min(1, "ISO code is required"),
        postal_code: z.string().min(1, "Postal code is required"),
        city: z.string().min(1, "City is required"),
        StateOrProvinceCode: z.string().min(1, "State or province code is required"),
    }),
    service_id: z.number().min(0, "Service ID is required"),
    pickup: z.object({
        iso_code: z.string().min(1, "ISO code is required"),
        postal_code: z.string().min(1, "Postal code is required"),
        city: z.string().min(1, "City is required"),
        StateOrProvinceCode: z.string().min(1, "State or province code is required"),
    }),
})
