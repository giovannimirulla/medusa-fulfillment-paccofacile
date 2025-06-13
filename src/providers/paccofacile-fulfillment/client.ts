import { PaccoFacileOptions } from "./service"
import { MedusaError } from "@medusajs/framework/utils"
import { QuoteRequest, ShippingRequest, AddressBookItem, Carrier, Account } from "./types"

export class PaccoFacileClient {
    options: PaccoFacileOptions

    constructor(options) {
        this.options = options
    }

    private async sendRequest(url: string, data?: RequestInit): Promise<any> {
        console.log("sendRequest", url, data)
        console.log("paccofacile options", this.options)
        return fetch(`https://paccofacile.tecnosogima.cloud/sandbox/v1${url}`, {
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
                    console.error(`HTTP Error: ${resp.status} - ${resp.statusText}`);
                    console.error("Response body:", resp);
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

    async getCarriers(): Promise<Carrier[]> {
        const response = await this.sendRequest("/service/carriers")
        if (response.data && response.data.length > 0) {
            return response.data;
        }
        return [];
    }

    async getAddresses(): Promise<AddressBookItem[]> {
        const response = await this.sendRequest("/service/address-book");
        if (response.data && response.data.items && response.data.items.length > 0) {
            return response.data.items;
        }
        return [];
    }

    async getQuotes(data: QuoteRequest): Promise<any> {
        return await this.sendRequest("/service/shipment/quote", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }

    async createShipment(data: ShippingRequest): Promise<any> {
        const response = await this.sendRequest("/service/shipment/save", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
        console.log("createShipment response", response)
        return response
    }

    //service/customers/account
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

}