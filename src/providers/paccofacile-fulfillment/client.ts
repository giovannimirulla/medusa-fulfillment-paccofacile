import { PaccoFacileOptions } from "./service"
import { MedusaError } from "@medusajs/framework/utils"
import { QuoteRequest, ShippingRequest, AddressBookItem, Carrier, Account } from "./types"

/**
 * Client for interacting with PaccoFacile API.
 * Handles authentication, request formatting, and response parsing.
 */
export class PaccoFacileClient {
    options: PaccoFacileOptions

    constructor(options) {
        this.options = options
    }

    private async sendRequest(url: string, data?: RequestInit): Promise<any> {
        const env = this.options.environment || "live"
        return fetch(`https://paccofacile.tecnosogima.cloud/${env}/v1${url}`, {
            ...data,
            headers: {
                ...data?.headers,
                Accept: "application/json",
                "Account-Number": this.options.account_number,
                "Api-Key": this.options.api_key,
                Authorization: `Bearer ${this.options.api_token}`,
            },
        })
            .then((resp) => {
                if (!resp.ok) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_DATA,
                        `HTTP Error: ${resp.status} - ${resp.statusText}`
                    );
                }
    
                const contentType = resp.headers.get("content-type");
                if (!contentType?.includes("application/json")) {
                    return resp.text();
                }
    
                return resp.json();
            })
            .then((resp) => {
                if (typeof resp !== "string" && resp.errors?.length) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_DATA,
                        `An error occurred while sending a request to ShipStation: ${resp.errors.map((error) => error.message)}`
                    );
                }
    
                return resp;
            });
    }

    /**
     * Retrieves available carriers and their services from PaccoFacile.
     * @returns Promise resolving to array of carriers with service details
     */
    async getCarriers(): Promise<Carrier[]> {
        const response = await this.sendRequest("/service/carriers")
        if (response.data && response.data.length > 0) {
            return response.data;
        }
        return [];
    }

    /**
     * Retrieves the user's address book from PaccoFacile.
     * @returns Promise resolving to array of saved addresses
     */
    async getAddresses(): Promise<AddressBookItem[]> {
        const response = await this.sendRequest("/service/address-book");
        if (response.data && response.data.items && response.data.items.length > 0) {
            return response.data.items;
        }
        return [];
    }

    /**
     * Requests shipping quotes from PaccoFacile for given shipment details.
     * @param data - Quote request with parcels, addresses, and package content type
     * @returns Promise resolving to quote response with available services and pricing
     */
    async getQuotes(data: QuoteRequest): Promise<any> {
        return await this.sendRequest("/service/shipment/quote", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }

    /**
     * Creates a shipment in PaccoFacile system.
     * @param data - Shipping request with service, parcels, addresses, and additional info
     * @returns Promise resolving to shipment creation response with shipment_id
     */
    async createShipment(data: ShippingRequest): Promise<any> {
        const response = await this.sendRequest("/service/shipment/save", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response
    }

    /**
     * Purchases one or more shipments using account credit.
     * @param data - Purchase request with shipment IDs, billing type, date, and payment method
     * @param data.shipments - Array of shipment IDs to purchase
     * @param data.billing_type - 1: Receipt, 2: Invoice
     * @param data.billing_date - "1": Monthly, "2": Single
     * @param data.payment_method - "CREDIT": Pay with account credit
     * @returns Promise resolving to purchase confirmation
     */
   async buyShipment(data: { shipments: number[], billing_type: number, billing_date: string, payment_method: string }): Promise<any> {
        const response = await this.sendRequest("/service/shipment/buy", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response
    }

    /**
     * Retrieves account information for the authenticated user.
     * @returns Promise resolving to account details or null if not found
     */
    async getAccount(): Promise<Account | null> {
        const response = await this.sendRequest("/service/customers/account", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (response.data && response.data.customer) {
            return response.data.customer;
        }
        return null;
    }

    /**
     * Retrieves credit information for the authenticated user.
     * @returns Promise resolving to credit details or null if not found
     */
    async getCredit(): Promise<any | null> {
        const response = await this.sendRequest("/service/customers/credit", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (response.data) {
            return response.data;
        }
        return null;
    }

    /**
     * Retrieve shipment documents (labels, customs docs, etc.)
     * GET /service/shipment/document/{shipment_id}
     * Returns: { content: string (base64), format: string, label: string }
     */
    async getShipmentDocuments(shipmentId: number): Promise<any[]> {
        const response = await this.sendRequest(`/service/shipment/document/${shipmentId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        // API returns array of documents with content, format, label fields
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    }

}