import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import { PaccoFacileClient } from "./client"
import {
    FulfillmentOption,
    CreateShippingOptionDTO,
    CalculateShippingOptionPriceDTO,
    CalculatedShippingOptionPrice,
    Logger
} from "@medusajs/framework/types"
import { Address, DetailedAddress, ShippingRequest, Product } from "./types"

import { retrievePaccoFacileSettingsWorkflow } from "../../workflows/retrieve-paccofacile-setting"

function calculatePackageDimensions(products: Product[]): { length: number; width: number; height: number; weight: number } {
    // Ordina i prodotti per volume decrescente
    products.sort((a, b) => (b.length * b.width * b.height) - (a.length * a.width * a.height));

    let totalWeight = 0;
    let length = 0;
    let width = 0;
    let height = 0;

    for (const product of products) {
        totalWeight += product.weight;

        // Aggiorna la lunghezza come la massima lunghezza
        length = Math.max(length, product.length);

        // Somma le larghezze (affiancamento)
        width += product.width;

        // Altezza come la massima altezza per simulare l'impilamento compatto
        height = Math.max(height, product.height);
    }

    // Calcola il peso volumetrico (formula comune: L x W x H / 5000)
    const volumetricWeight = (length * width * height) / 5000;

    // Il peso finale è il maggiore tra peso effettivo e peso volumetrico
    const finalWeight = Math.max(totalWeight, volumetricWeight);

    return { length, width, height, weight: parseFloat(finalWeight.toFixed(2)) };
}


export type PaccoFacileOptions = {
    api_key: string,
    api_token: string,
    account_number: string
    backend_url?: string
}

class PaccoFacileProviderService extends AbstractFulfillmentProviderService {
    static identifier = "paccofacile"
    protected options_: PaccoFacileOptions
    protected client: PaccoFacileClient
    protected logger_: Logger


    constructor(
        { logger },
        options: PaccoFacileOptions
    ) {
        super()
        this.options_ = options
        this.client = new PaccoFacileClient(options)
        this.logger_ = logger
    }

    /**
     * Retrieves available fulfillment options from PaccoFacile carriers.
     * @returns Promise resolving to array of fulfillment options with carrier and service details
     */
    async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
        const data = await this.client.getCarriers()

        //add id and name to the carriers
        const fulfillmentOptions: FulfillmentOption[] = data.map(carrier => ({
            id: `${carrier.service_id}__${carrier.carrier_id}`, // Creazione dell'id
            name: `${carrier.carrier_name} - ${carrier.service_name}`, // Nome del carrier
            service_id: carrier.service_id, // Altri campi possono essere aggiunti se necessario
            carrier_id: carrier.carrier_id, // Altri campi possono essere aggiunti se necessario
            dove: carrier.dove, // Altri campi possono essere aggiunti se necessario
            carrier_name: carrier.carrier_name, // Altri campi possono essere aggiunti se necessario
            service_name: carrier.service_name, // Altri campi possono essere aggiunti se necessario
            carrier_ship_time: carrier.carrier_ship_time,
            pickup_type: carrier.pickup_type,
            to_consolid: carrier.to_consolid,
            image_url: carrier.image_url,
            box_type: carrier.box_type,
        }))

        return fulfillmentOptions
    }

    /**
     * Resolves pickup, triangulation, and destination addresses for a shipment.
     * Uses default addresses from PaccoFacile account or context-provided location.
     * @param context - Context containing from_location, shipping_address, and customer info
     * @returns Promise resolving to pickup, triangulation, and destination addresses
     */
    async getAddresses(context: any): Promise<{ pickup: DetailedAddress; triangulation: DetailedAddress; destination: DetailedAddress }> {
        let pickup: DetailedAddress
        let triangulation: DetailedAddress

        const addresses = await this.client.getAddresses()

        const triangulationAddress = addresses.find(
            (data) => data.address.category === "TRIANGULATION-DEFAULT"
        )?.address

        const account = await this.client.getAccount()

        if (context.from_location?.address) {
            pickup = {
                iso_code: context.from_location?.address?.country_code || "",
                postal_code: context.from_location?.address?.postal_code || "",
                city: context.from_location?.address?.city || "",
                StateOrProvinceCode: context.from_location?.address?.province || "",
                header_name: context.from_location?.name || ((account?.first_name && account?.last_name) ? account.first_name + " " + account.last_name : ""),
                address: context.from_location?.address?.address_1 || "",
                building_number: context.from_location?.address?.address_2 || "",
                phone: context.from_location?.address?.phone || account?.contact.telephone || "",
                email: account?.contact?.email || "",
                note: context.from_location?.note || "",
            }
        } else {
            const sender_address = addresses.find(
                (data) => data.address.category === "DEPARTURE-DEFAULT"
            )?.address
            if (!sender_address) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Default sender address not found"
                )
            }
            pickup = {
                iso_code: sender_address.locality.iso_code,
                postal_code: sender_address.locality.postal_code,
                city: sender_address.locality.city,
                StateOrProvinceCode: sender_address.locality.StateOrProvinceCode,
                header_name: sender_address.name || account?.first_name + " " + account?.last_name,
                address: sender_address.locality.address,
                building_number: sender_address.locality.building_number,
                phone: sender_address.phone || account?.contact.telephone || "",
                email: sender_address.email || account?.contact.email || "",
                note: "",
            }
        }

        if (triangulationAddress) {
            triangulation = {
                iso_code: triangulationAddress.locality.iso_code,
                postal_code: triangulationAddress.locality.postal_code,
                city: triangulationAddress.locality.city,
                StateOrProvinceCode: triangulationAddress.locality.StateOrProvinceCode,
                header_name: triangulationAddress.name,
                address: triangulationAddress.locality.address,
                building_number: triangulationAddress.locality.building_number,
                phone: triangulationAddress.phone,
                email: triangulationAddress.email,
                note: "",
            }
        } else {
            triangulation = pickup
        }

        if (!context.shipping_address) {
            throw new Error("Shipping address is required")
        }
        const destination: DetailedAddress = {
            iso_code: context.shipping_address.country_code ?? "",
            postal_code: context.shipping_address.postal_code ?? "",
            city: context.shipping_address.city ?? "",
            StateOrProvinceCode: context.shipping_address.province ?? "",
            header_name: context.shipping_address.first_name + " " + context.shipping_address.last_name,
            address: context.shipping_address.address_1,
            building_number: context.shipping_address.address_2,
            phone: context.shipping_address.phone,
            email: context.customer?.email || "",
            note: context.shipping_address.note,
        }

        return { pickup, triangulation, destination }

    }

    /**
     * Determines if shipping price can be calculated for the given data.
     * @param data - Shipping option creation data
     * @returns Promise resolving to true (always calculable for PaccoFacile)
     */
    async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
        return true
    }

    private async getQuotes(context: any): Promise<any> {

        const { pickup, triangulation, destination } = await this.getAddresses(context)

        //detailed address to address
        const pickupAddress: Address = {
            iso_code: pickup.iso_code,
            postal_code: pickup.postal_code,
            city: pickup.city,
            StateOrProvinceCode: pickup.StateOrProvinceCode,
        }
        const triangulationAddress: Address = {
            iso_code: triangulation.iso_code,
            postal_code: triangulation.postal_code,
            city: triangulation.city,
            StateOrProvinceCode: triangulation.StateOrProvinceCode,
        }
        const destinationAddress: Address = {
            iso_code: destination.iso_code,
            postal_code: destination.postal_code,
            city: destination.city,
            StateOrProvinceCode: destination.StateOrProvinceCode,
        }

        const items: Product[] = context.items.reduce((final, item) => {
            final.push(
                ...Array.from({ length: item.quantity }, () => ({
                    // @ts-ignore
                    length: item.variant.length || 0,
                    // @ts-ignore
                    height: item.variant.height || 0,
                    // @ts-ignore
                    width: item.variant.width || 0,
                    // @ts-ignore
                    weight: item.variant.weight / 1000,
                }))
            )
            return final
        }, [] as Product[])


        const packageInfo = calculatePackageDimensions(items);
        const item = {
            shipment_type: 1,
            // @ts-ignore
            dim1: packageInfo.length,
            // @ts-ignore
            dim2: packageInfo.width,
            // @ts-ignore
            dim3: packageInfo.height,
            // @ts-ignore
            weight: packageInfo.weight,
        }

        const shipment_service = {
            parcels: [item],
            accessories: [],
            package_content_type: "GOODS",
        }

        const quotesRequest = {
            shipment_service,
            pickup: pickupAddress,
            triangulation: triangulationAddress,
            destination: destinationAddress,
        }

        const quotesResponse = await this.client.getQuotes(quotesRequest)
        return quotesResponse
    }

    private async getQuote(context: any, service_id: number): Promise<any> {
        const quotes = await this.getQuotes(context)
        const services = quotes.data.services_available
        if (!services.length) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No shipping services available"
            )
        }
        const selectedService = services.find((service) => service.service_id === service_id)
        if (!selectedService) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Selected service not found"
            )
        }
        return selectedService
    }

    /**
     * Calculates shipping price for the selected service option.
     * @param optionData - Contains service_id for the selected carrier service
     * @param data - Additional shipping data
     * @param context - Cart/order context with items and addresses
     * @returns Promise resolving to calculated price and tax inclusivity
     */
    async calculatePrice(
        optionData: CalculateShippingOptionPriceDTO["optionData"],
        data: CalculateShippingOptionPriceDTO["data"],
        context: CalculateShippingOptionPriceDTO["context"]
    ): Promise<CalculatedShippingOptionPrice> {
        const { service_id } = optionData as {
            service_id: number
        }

        //         {
        //     "header": {
        //         "status": "SUCCESS",
        //         "notification": {
        //             "code": 0,
        //             "messages": "Success"
        //         }
        //     },
        //     "data": {
        //         "services_available": [
        //             {
        //                 "price_service": {
        //                     "amount": "88.75",
        //                     "currency": "EUR",
        //                     "taxable_amount": "72.75",
        //                     "vat_amount": "16.00"
        //                 },
        //                 "price_total": {
        //                     "amount": "88.75",
        //                     "currency": "EUR",
        //                     "vat_amount": "16.00",
        //                     "taxable_amount": 72.75
        //                 },
        //                 "service_id": 2,
        //                 "name": "PACCHI",
        //                 "carrier": "SDA",
        //                 "available_for_private_individuals": 1,
        //                 "customes_required": 0,
        //                 "tax": {
        //                     "tax_name": "IVA_INCLUSA",
        //                     "tax_rate": 22,
        //                     "title": "IVA",
        //                     "description": "IVA (22 %)",
        //                     "inversione": 0,
        //                     "is_cliente_exp_imp": 0
        //                 },
        //                 "pickup_date": {
        //                     "first_day": "Lunedì",
        //                     "first_giorno": "24",
        //                     "first_mese": "Mar",
        //                     "first_date": "2025-03-24",
        //                     "waiting_time": {
        //                         "days": 2,
        //                         "hours": 17,
        //                         "minutes": 32
        //                     },
        //                     "first_date_range": "AM"
        //                 },
        //                 "delivery_date": {
        //                     "delivery_days": 2,
        //                     "first_delivery_date": "2025-03-26"
        //                 },
        //                 "accessories": [],
        //                 "favorite": 0
        //             },
        //             {
        //                 "price_service": {
        //                     "amount": "105.40",
        //                     "currency": "EUR",
        //                     "taxable_amount": "86.39",
        //                     "vat_amount": "19.01"
        //                 },
        //                 "price_total": {
        //                     "amount": "105.40",
        //                     "currency": "EUR",
        //                     "vat_amount": "19.01",
        //                     "taxable_amount": 86.39
        //                 },
        //                 "service_id": 108,
        //                 "name": "EXPRESS",
        //                 "carrier": "GLS",
        //                 "available_for_private_individuals": 1,
        //                 "customes_required": 0,
        //                 "tax": {
        //                     "tax_name": "IVA_INCLUSA",
        //                     "tax_rate": 22,
        //                     "title": "IVA",
        //                     "description": "IVA (22 %)",
        //                     "inversione": 0,
        //                     "is_cliente_exp_imp": 0
        //                 },
        //                 "pickup_date": {
        //                     "first_day": "Lunedì",
        //                     "first_giorno": "24",
        //                     "first_mese": "Mar",
        //                     "first_date": "2025-03-24",
        //                     "waiting_time": {
        //                         "days": 2,
        //                         "hours": 17,
        //                         "minutes": 32
        //                     },
        //                     "first_date_range": "AM"
        //                 },
        //                 "delivery_date": {
        //                     "delivery_days": 2,
        //                     "first_delivery_date": "2025-03-26"
        //                 },
        //                 "accessories": [],
        //                 "favorite": 0
        //             }
        //         ],
        //         "info_regole_sconti": [],
        //         "info_voluminoso": []
        //     }
        // }

        const quote = await this.getQuote(context, service_id)


        const isTaxInclusive = quote.tax?.tax_name === "IVA_INCLUSA";

        //  calculated_amount and is_calculated_price_tax_inclusive
        return {
            calculated_amount: parseFloat(quote.price_total.amount),
            is_calculated_price_tax_inclusive: isTaxInclusive,
        }

    }

    /**
     * Validates fulfillment data and enriches it with quote, addresses, and service details.
     * @param optionData - Contains service_id for the selected carrier service
     * @param data - Additional validation data
     * @param context - Cart/order context with items and addresses
     * @returns Promise resolving to validated data with quote, pickup, triangulation, and destination
     */
    async validateFulfillmentData(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<any> {
        const { service_id } = optionData as {
            service_id: number
        }
        const { pickup, triangulation, destination } = await this.getAddresses(context)

        //        "pickup" : {
        //  "header_name" : "John Doe" ,
        //  "address" : "Street address...",
        //  "building_number" : "12" ,
        //  "phone" : "1234565",
        // "email" : "email@example.com",
        //  "note" : "Lorem Ipsum"
        // } ,






        // console.log("OptionData", optionData)

        // OptionData {
        //     id: '92__7',
        //     dove: 1,
        //     name: 'POSTE ITALIANE - CRONO',
        //     box_type: 'CRONO',
        //     image_url: 'https://d3lc5axmv1xq7g.cloudfront.net/assets/images/loghi_corrieri/POSTE ITALIANE.png',
        //     carrier_id: 7,
        //     service_id: 92,
        //     pickup_type: 1,
        //     to_consolid: 0,
        //     carrier_name: 'POSTE ITALIANE',
        //     service_name: 'CRONO',
        //     carrier_ship_time: '4 giorni'
        //   }

        // console.log("Data", data)

        // // Data {}

        // console.log("Context", context)

        const quote = await this.getQuote(context, service_id)
        // console.log("Quote", quote)

        // Context {
        //     id: 'cart_01JQ2E81ZZA0A5DF4EF167GYZM',
        //     currency_code: 'eur',
        //     subtotal: 20,
        //     item_total: 10,
        //     total: 20,
        //     item_subtotal: 10,
        //     shipping_subtotal: 10,
        //     region_id: 'reg_01JPMGJ9CBF74D1DNKGYPANHGQ',
        //     metadata: null,
        //     completed_at: null,
        //     sales_channel_id: 'sc_01JPMGJ7M9C0VV47EXGK2Q9TKT',
        //     customer_id: 'cus_01JQ2E9QA9Y37D3ECN5G6XVSK3',
        //     items: [
        //       {
        //         id: 'cali_01JQ2E83ATPEEG55AJW035EJ45',
        //         title: 'L',
        //         subtitle: 'Medusa Sweatshirt',
        //         thumbnail: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
        //         quantity: 1,
        //         variant_id: 'variant_01JPMGJ9HWS9D9EQN844VH3X6N',
        //         product_id: 'prod_01JPMGJ9GD221VK9XVP56S0E29',
        //         product_title: 'Medusa Sweatshirt',
        //         product_description: 'Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.',
        //         product_subtitle: null,
        //         product_type: null,
        //         product_type_id: null,
        //         product_collection: null,
        //         product_handle: 'sweatshirt',
        //         variant_sku: 'SWEATSHIRT-L',
        //         variant_barcode: null,
        //         variant_title: 'L',
        //         variant_option_values: null,
        //         requires_shipping: true,
        //         is_discountable: true,
        //         is_tax_inclusive: false,
        //         is_custom_price: false,
        //         metadata: {},
        //         cart_id: 'cart_01JQ2E81ZZA0A5DF4EF167GYZM',
        //         raw_compare_at_unit_price: null,
        //         raw_unit_price: [Object],
        //         created_at: '2025-03-23T21:23:54.843Z',
        //         updated_at: '2025-03-23T21:23:54.843Z',
        //         deleted_at: null,
        //         adjustments: [],
        //         tax_lines: [],
        //         compare_at_unit_price: null,
        //         unit_price: 10,
        //         subtotal: 10,
        //         total: 10,
        //         original_total: 10,
        //         discount_total: 0,
        //         discount_subtotal: 0,
        //         discount_tax_total: 0,
        //         tax_total: 0,
        //         original_tax_total: 0,
        //         raw_subtotal: [Object],
        //         raw_total: [Object],
        //         raw_original_total: [Object],
        //         raw_discount_total: [Object],
        //         raw_discount_subtotal: [Object],
        //         raw_discount_tax_total: [Object],
        //         raw_tax_total: [Object],
        //         raw_original_tax_total: [Object],
        //         product: [Object],
        //         variant: [Object]
        //       }
        //     ],
        //     shipping_address: {
        //       id: 'caaddr_01JQ2E9QATDJ6FK8Y6M524QKG7',
        //       customer_id: null,
        //       company: '',
        //       first_name: 'Agata',
        //       last_name: 'Rosselli',
        //       address_1: 'Via Gian Battista Nicolosi 197',
        //       address_2: '',
        //       city: 'Paternò',
        //       country_code: 'it',
        //       province: 'CT',
        //       postal_code: '95047',
        //       phone: '',
        //       metadata: null,
        //       created_at: '2025-03-23T21:24:48.090Z',
        //       updated_at: '2025-03-23T21:24:48.090Z',
        //       deleted_at: null
        //     },
        //     shipping_methods: [
        //       {
        //         id: 'casm_01JQ5BBJMTB7897B2XV6JG2DTJ',
        //         name: 'Express Shipping',
        //         description: null,
        //         is_tax_inclusive: false,
        //         shipping_option_id: 'so_01JPMGJ9EF1TQN2K0YQP0QPCJ9',
        //         data: {},
        //         metadata: null,
        //         cart_id: 'cart_01JQ2E81ZZA0A5DF4EF167GYZM',
        //         raw_amount: [Object],
        //         created_at: '2025-03-25T00:31:06.394Z',
        //         updated_at: '2025-03-25T00:31:06.394Z',
        //         deleted_at: null,
        //         tax_lines: [],
        //         adjustments: [],
        //         amount: 10,
        //         subtotal: 10,
        //         total: 10,
        //         original_total: 10,
        //         discount_total: 0,
        //         discount_subtotal: 0,
        //         discount_tax_total: 0,
        //         tax_total: 0,
        //         original_tax_total: 0,
        //         raw_subtotal: [Object],
        //         raw_total: [Object],
        //         raw_original_total: [Object],
        //         raw_discount_total: [Object],
        //         raw_discount_subtotal: [Object],
        //         raw_discount_tax_total: [Object],
        //         raw_tax_total: [Object],
        //         raw_original_tax_total: [Object]
        //       }
        //     ],
        //     region: {
        //       id: 'reg_01JPMGJ9CBF74D1DNKGYPANHGQ',
        //       name: 'Europe',
        //       currency_code: 'eur',
        //       automatic_taxes: true,
        //       metadata: null,
        //       created_at: '2025-03-18T11:35:03.823Z',
        //       updated_at: '2025-03-18T11:35:03.823Z',
        //       deleted_at: null
        //     },
        //     customer: {
        //       id: 'cus_01JQ2E9QA9Y37D3ECN5G6XVSK3',
        //       company_name: null,
        //       first_name: null,
        //       last_name: null,
        //       email: 'giova1918@hotmail.it',
        //       phone: null,
        //       has_account: false,
        //       metadata: null,
        //       created_by: null,
        //       created_at: '2025-03-23T21:24:48.075Z',
        //       updated_at: '2025-03-23T21:24:48.075Z',
        //       deleted_at: null,
        //       groups: []
        //     },
        //     promotions: [],
        //     from_location: {
        //       id: 'sloc_01JPMGJ9D55Z67KCZ8Y77T42VJ',
        //       name: 'European Warehouse',
        //       address: {
        //         id: 'laddr_01JPMGJ9D5KPVK90NHM80FFA8A',
        //         address_1: 'Via Immacolata 31',
        //         address_2: '',
        //         company: '',
        //         city: 'Catania',
        //         country_code: 'it',
        //         phone: '',
        //         province: 'CT',
        //         postal_code: '95123',
        //         metadata: null,
        //         created_at: '2025-03-18T11:35:03.845Z',
        //         updated_at: '2025-03-21T22:25:11.225Z',
        //         deleted_at: null
        //       },
        //       fulfillment_sets: [ [Object] ]
        //     }
        //   }

        return {
            ...optionData,
            quote,
            pickup,
            triangulation,
            destination,
        };
    }

    /**
     * Creates a shipment with PaccoFacile and optionally purchases it if autopayment is enabled.
     * @param data - Validated fulfillment data with quote, addresses, and service details
     * @param items - Fulfillment items to be shipped
     * @param order - Order context (optional)
     * @param fulfillment - Fulfillment record with scope and metadata
     * @returns Promise resolving to fulfillment data with paccofacile_shipment_id
     */
    async createFulfillment(
        data: object,
        items: object[],
        order: object | undefined,
        fulfillment: Record<string, unknown>
    ): Promise<any> {




        // {
        //     "shipment_service": {
        //       "pickup_date": "2021-10-29",
        //       "pickup_range": "AM",
        //       "service_id": 102,
        //       "parcels": [
        //         {
        //           "shipment_type": 1,
        //           "weight": 20,
        //           "dim1": 10,
        //           "dim2": 10,
        //           "dim3": 10,
        //           "accessory_assurance_amount": {
        //             "amount": 91,
        //             "currency": "EUR"
        //           }
        //         },
        //         {
        //           "shipment_type": 1,
        //           "weight": 20,
        //           "dim1": 10,
        //           "dim2": 10,
        //           "dim3": 10,
        //           "accessory_assurance_amount": {
        //             "amount": 7.5,
        //             "currency": "EUR"
        //           }
        //         }
        //       ],
        //       "accessories": [
        //         {
        //           "service_id": 7,
        //           "amount_total": {
        //             "amount": 98.50,
        //             "currency": "EUR"
        //           }
        //         }
        //       ],
        //       "package_content_type": "GOODS"
        //     },
        //     "pickup": {
        //       "iso_code": "IT",
        //       "postal_code": "04011",
        //       "city": "aprilia",
        //       "header_name": "John Doe",
        //       "address": "Street address...",
        //       "building_number": "12",
        //       "StateOrProvinceCode": "LT",
        //       "phone": "1234565",
        //       "email": "email@example.com",
        //       "note": "Lorem Ipsum"
        //     },
        //     "destination": {
        //       "iso_code": "CH",
        //       "postal_code": "1237",
        //       "city": "Avully",
        //       "header_name": "John Doe",
        //       "address": "Street address...",
        //       "building_number": "13",
        //       "StateOrProvinceCode": "CH",
        //       "phone": "343",
        //       "email": "email@example.com",
        //       "note": "Lorem Ipsum"
        //     },
        //     "triangulation": {
        //       "iso_code": "IT",
        //       "postal_code": "00165",
        //       "city": "roma",
        //       "header_name": "John Doe",
        //       "address": "Street address...",
        //       "km_number": "13",
        //       "StateOrProvinceCode": "RM",
        //       "phone": "1234",
        //       "email": "email@example.com",
        //       "note": "Lorem Ipsum"
        //     },
        //     "additional_information": {
        //       "reference": "",
        //       "note": "",
        //       "content": ""
        //     },
        // Data {
        // id: '92_7',
        // tax: {
        //     title: 'IVA',
        //     tax_name: 'IVA_INCLUSA',
        //     tax_rate: 22,
        //     inversione: 0,
        //     description: 'IVA (22 %)',
        //     is_cliente_exp_imp: 0
        // },
        // dove: 1,
        // name: 'POSTE ITALIANE - CRONO',
        // carrier: 'POSTE ITALIANE',
        // box_type: 'CRONO',
        // favorite: 0,
        // image_url: 'https://d3lc5axmv1xq7g.cloudfront.net/assets/images/loghi_corrieri/POSTE ITALIANE.png',
        // carrier_id: 7,
        // service_id: 92,
        // accessories: [],
        // pickup_date: {
        //     first_day: 'Giovedì',
        //     first_date: '2025-03-27',
        //     first_mese: 'Mar',
        //     first_giorno: '27',
        //     waiting_time: { days: 0, hours: 15, minutes: 38 },
        //     first_date_range: 'AM'
        // },
        // pickup_type: 1,
        // price_total: {
        //     amount: '7.43',
        //     currency: 'EUR',
        //     vat_amount: '1.34',
        //     taxable_amount: 6.09
        // },
        // to_consolid: 0,
        // carrier_name: 'POSTE ITALIANE',
        // service_name: 'CRONO',
        // delivery_date: { delivery_days: 4, first_delivery_date: '2025-04-02' },
        // price_service: {
        //     amount: '7.43',
        //     currency: 'EUR',
        //     vat_amount: '1.34',
        //     taxable_amount: '6.09'
        // },
        // carrier_ship_time: '4 giorni',
        // customes_required: 0,
        // available_for_private_individuals: 1
        // }


        // Items [
        //     FulfillmentItem {
        //       title: 'L',
        //       sku: 'SWEATSHIRT-L',
        //       barcode: '',
        //       line_item_id: 'ordli_01JQ1R1MTG5PA9Z7ADZHGJD9GS',
        //       inventory_item_id: 'iitem_01JPMGJ9JMCC3JXAXRBNNZ2WR7',
        //       fulfillment_id: 'ful_01JQ572XJJ18M12WM03YB9FVBT',
        //       fulfillment: Fulfillment {
        //         location_id: 'sloc_01JPMGJ9D55Z67KCZ8Y77T42VJ',
        //         packed_at: 2025-03-24T23:16:28.363Z,
        //         shipped_at: null,
        //         marked_shipped_by: null,
        //         created_by: null,
        //         delivered_at: null,
        //         canceled_at: null,
        //         data: [Object],
        //         requires_shipping: true,
        //         provider: [(FulfillmentProvider)],
        //         shipping_option_id: 'so_01JPX9MZGBNJKE6EXCMTDZ55YM',
        //         delivery_address: [FulfillmentAddress],
        //         metadata: null,
        //         created_at: 2025-03-24T23:16:28.371Z,
        //         updated_at: 2025-03-24T23:16:28.371Z,
        //         deleted_at: null,
        //         items: [Collection<FulfillmentItem>],
        //         labels: [Collection<FulfillmentLabel>],
        //         provider_id: 'paccofacile_paccofacile',
        //         id: 'ful_01JQ572XJJ18M12WM03YB9FVBT',
        //         delivery_address_id: 'fuladdr_01JQ572XJJV988DJDEFHW63YRS'
        //       },
        //       raw_quantity: { value: '1', precision: 20 },
        //       created_at: 2025-03-24T23:16:28.371Z,
        //       updated_at: 2025-03-24T23:16:28.371Z,
        //       deleted_at: null,
        //       id: 'fulit_01JQ572XJHFMJTT92VPCQA9HFZ'
        //     }
        //   ]


        // Order {
        //     id: 'order_01JQ1R1MTFX2EDW4PG2N9V2MF4',
        //     status: 'pending',
        //     region_id: 'reg_01JPMGJ9CBF74D1DNKGYPANHGQ',
        //     currency_code: 'eur',
        //     items: [
        //       {
        //         id: 'ordli_01JQ1R1MTG5PA9Z7ADZHGJD9GS',
        //         title: 'L',
        //         subtitle: 'Medusa Sweatshirt',
        //         thumbnail: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
        //         variant_id: 'variant_01JPMGJ9HWS9D9EQN844VH3X6N',
        //         product_id: 'prod_01JPMGJ9GD221VK9XVP56S0E29',
        //         product_title: 'Medusa Sweatshirt',
        //         product_description: 'Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.',
        //         product_subtitle: null,
        //         product_type: null,
        //         product_type_id: null,
        //         product_collection: null,
        //         product_handle: 'sweatshirt',
        //         variant_sku: 'SWEATSHIRT-L',
        //         variant_barcode: null,
        //         variant_title: 'L',
        //         variant_option_values: null,
        //         requires_shipping: true,
        //         is_discountable: true,
        //         is_tax_inclusive: false,
        //         is_custom_price: false,
        //         metadata: {},
        //         raw_compare_at_unit_price: null,
        //         raw_unit_price: [Object],
        //         created_at: '2025-03-23T14:55:54.704Z',
        //         updated_at: '2025-03-23T14:55:54.704Z',
        //         deleted_at: null,
        //         compare_at_unit_price: null,
        //         unit_price: 10,
        //         quantity: 1,
        //         raw_quantity: [Object],
        //         detail: [Object],
        //         variant: [Object]
        //       }
        //     ],
        //     shipping_address: {
        //       customer_id: null,
        //       company: '',
        //       first_name: 'Giovanni',
        //       last_name: 'Mirulla',
        //       address_1: 'Via Immacolata, 31',
        //       address_2: '',
        //       city: 'Catania',
        //       country_code: 'it',
        //       province: 'CT',
        //       postal_code: '95123',
        //       phone: '',
        //       metadata: null,
        //       created_at: '2025-03-23T14:55:19.727Z',
        //       updated_at: '2025-03-23T14:55:19.727Z',
        //       deleted_at: null
        //     },
        //     shipping_methods: [
        //       {
        //         id: 'ordsm_01JQ1R1MTFJ48N0PSNYCQJW811',
        //         shipping_option_id: 'so_01JPX9MZGBNJKE6EXCMTDZ55YM',
        //         data: [Object]
        //       }
        //     ]
        //   }

        // Fulfillment {
        //     location_id: 'sloc_01JPMGJ9D55Z67KCZ8Y77T42VJ',
        //     packed_at: 2025-03-24T23:16:28.363Z,
        //     shipped_at: null,
        //     marked_shipped_by: null,
        //     created_by: null,
        //     delivered_at: null,
        //     canceled_at: null,
        //     requires_shipping: true,
        //     provider: (FulfillmentProvider) { id: 'paccofacile_paccofacile' },
        //     shipping_option_id: 'so_01JPX9MZGBNJKE6EXCMTDZ55YM',
        //     shipping_option: undefined,
        //     delivery_address: FulfillmentAddress {
        //       company: '',
        //       first_name: 'Giovanni',
        //       last_name: 'Mirulla',
        //       address_1: 'Via Immacolata, 31',
        //       address_2: '',
        //       city: 'Catania',
        //       country_code: 'it',
        //       province: 'CT',
        //       postal_code: '95123',
        //       phone: '',
        //       metadata: null,
        //       created_at: 2025-03-23T14:55:19.727Z,
        //       updated_at: 2025-03-23T14:55:19.727Z,
        //       deleted_at: null,
        //       id: 'fuladdr_01JQ572XJJV988DJDEFHW63YRS'
        //     },
        //     metadata: null,
        //     created_at: 2025-03-24T23:16:28.371Z,
        //     updated_at: 2025-03-24T23:16:28.371Z,
        //     deleted_at: null,
        //     labels: Collection<FulfillmentLabel> { initialized: true, dirty: false },
        //     id: 'ful_01JQ572XJJ18M12WM03YB9FVBT',
        //     delivery_address_id: 'fuladdr_01JQ572XJJV988DJDEFHW63YRS'
        //   }

        const parcels: Product[] = ((order as any)?.items || []).reduce((final, item) => {
            final.push(
                ...Array.from({ length: item.quantity }, () => ({
                    // @ts-ignore
                    length: item.variant.length || 0,
                    // @ts-ignore
                    height: item.variant.height || 0,
                    // @ts-ignore
                    width: item.variant.width || 0,
                    // @ts-ignore
                    weight: item.variant.weight / 1000,
                }))
            )
            return final
        }, [] as Product[])


        const packageInfo = calculatePackageDimensions(parcels);
        const item = {
            shipment_type: 1,
            // @ts-ignore
            dim1: packageInfo.length,
            // @ts-ignore
            dim2: packageInfo.width,
            // @ts-ignore
            dim3: packageInfo.height,
            // @ts-ignore
            weight: packageInfo.weight,


        }


        const shippingRequest: ShippingRequest = {
            shipment_service: {
                pickup_date: (data as any).quote.pickup_date.first_date,
                pickup_range: (data as any).quote.pickup_date.first_date_range,
                service_id: (data as any).quote.service_id,
                parcels: [item],
                accessories: [],
                package_content_type: "GOODS"
            },
            pickup: (data as any).pickup,
            triangulation: (data as any).triangulation,
            destination: (data as any).destination,
            additional_information: {
                reference: "",
                note: "",
                content: "",
            },

        }

        this.logger_.info(`[PaccoFacile] Creating shipment with service_id: ${(data as any).quote.service_id}`)

        let responseShipment;
        try {
            responseShipment = await this.client.createShipment(shippingRequest);
        } catch (error) {
            this.logger_.error(`[PaccoFacile] Error creating shipment: ${error && (error as any).message ? (error as any).message : "unknown error"}`)
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Error creating shipment: ${error && (error as any).message ? (error as any).message : "unknown error"}`
            )
        }




        //get autopayment setting
        const autopayment = await this.getSetting("autoPayment", fulfillment.scope)
        this.logger_.info(`[PaccoFacile] Autopayment setting retrieved: ${autopayment?.value}`)

        // Check if autopayment is enabled and shipment was created successfully
        if (autopayment && autopayment.value === "true" && responseShipment && responseShipment.data && responseShipment.data.shipment && responseShipment.data.shipment.shipment_id) {
            this.logger_.info(`[PaccoFacile] Autopayment is enabled, attempting to purchase shipment: ${responseShipment.data.shipment.shipment_id}`)
            try {
                const buyResponse = await this.client.buyShipment({
                    shipments: [responseShipment.data.shipment.shipment_id],
                    billing_type: 2,
                    billing_date: "1",
                    payment_method: "CREDIT",
                })
                this.logger_.info(`[PaccoFacile] Shipment purchased successfully: ${responseShipment.data.shipment.shipment_id}`)
            } catch (error) {
                this.logger_.error(`[PaccoFacile] Error purchasing shipment: ${error && (error as any).message ? (error as any).message : "unknown error"}`)
                // Don't throw error to prevent fulfillment creation from failing
            }
        } else {
            this.logger_.info(`[PaccoFacile] Autopayment not executed - Autopayment enabled: ${autopayment?.value === "true"}, Shipment created: ${!!responseShipment?.data?.shipment?.shipment_id}`)
        }




        return {
            data: {
                ...(fulfillment.data as object || {}),
                ...(responseShipment?.data?.shipment?.shipment_id
                    ? { paccofacile_shipment_id: responseShipment.data.shipment.shipment_id }
                    : {}),
            },
        }






    }

    /**
     * Retrieves a specific setting value from the PaccoFacile module.
     * @param name - Setting name to retrieve
     * @param scope - Workflow execution scope
     * @returns Promise resolving to setting object with name and value
     */
    async getSetting(name: string, scope: any) {
        const { result } = await retrievePaccoFacileSettingsWorkflow(scope).run({
            input: { name },
            throwOnError: false,
            logOnError: true,
        })
        return result
    }

    /**
     * Legacy method required by base class. Returns empty array.
     * Use retrieveDocuments instead for actual document retrieval.
     * @param data - Fulfillment data
     * @returns Empty array
     */
    async getShipmentDocuments(data: any): Promise<never[]> {
        // This method signature requires Promise<never[]> from base class
        // Use retrieveDocuments instead for actual document retrieval
        return []
    }

    /**
     * Retrieves shipment documents (labels, customs docs) from PaccoFacile.
     * @param fulfillmentData - Must contain paccofacile_shipment_id
     * @param documentType - Optional filter: LABEL_LDV, DOCUMENTAZIONE_DOGANALE, 
     *                       DICHIARAZIONE_LIBERA_ESPORTAZIONE, FATTURA_PRO_FORMA, MODELLO_CN23
     * @returns Promise resolving to array of documents with content (base64), format, and label
     * @throws MedusaError if shipment_id is missing or retrieval fails
     */
    async retrieveDocuments(
        fulfillmentData: any,
        documentType: any
    ): Promise<any> {
        const shipmentId = fulfillmentData?.paccofacile_shipment_id
        if (!shipmentId) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Missing paccofacile_shipment_id in fulfillment data. Ensure the fulfillment was created successfully."
            )
        }

        try {
            const documents = await this.client.getShipmentDocuments(shipmentId)
            
            // Filter by documentType if specified
            // documentType can be: LABEL_LDV, DOCUMENTAZIONE_DOGANALE, DICHIARAZIONE_LIBERA_ESPORTAZIONE, 
            // FATTURA_PRO_FORMA, MODELLO_CN23
            if (documentType) {
                const filtered = documents.filter(doc => doc.label === documentType)
                return filtered.length > 0 ? filtered : documents
            }
            
            return documents
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to retrieve documents for shipment ${shipmentId}: ${error && (error as any).message ? (error as any).message : "unknown error"}`
            )
        }
    }

    /**
     * Cancels a fulfillment logically in Medusa. 
     * Note: PaccoFacile API does not currently provide a remote cancellation endpoint,
     * so this performs a local cancel only. Manual follow-up may be required.
     * @param fulfillmentData - Fulfillment data, may contain paccofacile_shipment_id
     * @returns Promise resolving to updated fulfillment data with canceled_at timestamp
     * @throws MedusaError if cancellation fails
     */
    async cancelFulfillment(
        fulfillmentData: Record<string, unknown>
    ): Promise<{ data: Record<string, unknown> }> {
        try {
            const shipmentId = (fulfillmentData as any)?.paccofacile_shipment_id
            return {
                data: {
                    ...fulfillmentData,
                    paccofacile_shipment_id: shipmentId,
                    canceled_at: new Date().toISOString(),
                    cancel_reason: "canceled via Medusa",
                },
            }
        } catch (e) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to cancel fulfillment: ${e && (e as any).message ? (e as any).message : "unknown error"}`
            )
        }
    }
}

export default PaccoFacileProviderService