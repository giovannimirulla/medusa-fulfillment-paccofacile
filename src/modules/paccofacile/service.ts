import { MedusaService } from "@medusajs/framework/utils"
import { Account, Address, Parcel, Credit } from "./types"
import { PaccoFacileClient } from "./client"
import { PaccoFacileSettings } from "./models/paccofacile_settings"

export type PaccoFacileOptions = {
    api_key: string,
    api_token: string,
    account_number: string
    backend_url?: string
}

class PaccoFacileModuleService extends MedusaService({PaccoFacileSettings}) {
    protected options_: PaccoFacileOptions
    protected client: PaccoFacileClient

    constructor({}, options: PaccoFacileOptions) {
        super(...arguments)
        this.options_ = options
        this.client = new PaccoFacileClient(options)
    }


    async getQuotes(item: Parcel, destination: Address, pickup: Address): Promise<any> {
        let triangulation: Address

        const addresses = await this.client.getAddresses()
        const triangulationAddress = addresses.find(
            (data) => data.address.category === "TRIANGULATION-DEFAULT"
        )?.address

        if (!pickup) {
            const sender_address = addresses.find(
                (data) => data.address.category === "DEPARTURE-DEFAULT"
            )?.address
            if (!sender_address) {
                throw new Error("Default sender address not found")
            }
            pickup = {
                iso_code: sender_address.locality.iso_code,
                postal_code: sender_address.locality.postal_code,
                city: sender_address.locality.city,
                StateOrProvinceCode: sender_address.locality.StateOrProvinceCode,
            }
        }

        if (triangulationAddress) {
            triangulation = {
                iso_code: triangulationAddress.locality.iso_code,
                postal_code: triangulationAddress.locality.postal_code,
                city: triangulationAddress.locality.city,
                StateOrProvinceCode: triangulationAddress.locality.StateOrProvinceCode,
            }
        } else {
            triangulation = pickup
        }



        const shipment_service = {
            parcels: [item],
            accessories: [],
            package_content_type: "GOODS",
        }

        const quoteRequest = {
            shipment_service,
            pickup,
            triangulation,
            destination,
        }

        const quoteResponse = await this.client.getQuote(quoteRequest)
        return quoteResponse
    }


    async getQuote(item: Parcel, destination: Address, service_id: number, pickup: Address): Promise<any> {
        const quotes = await this.getQuotes(item, destination, pickup)
        const services = quotes.data.services_available
        if (!services.length) {
            throw new Error("No shipping services available")
        }
        const selectedService = services.find((service) => service.service_id === service_id)
        if (!selectedService) {
            throw new Error("Selected service not found")
        }
        return selectedService
    }

    async getAccount(): Promise<Account> {
        const account = await this.client.getAccount()
        if (!account) {
            throw new Error("Account not found")
        }
        return account
    }

    async getCredit(): Promise<Credit> {
        const credit = await this.client.getCredit()
        if (!credit) {
            throw new Error("Credit not found")
        }
        return credit

    }

}

export default PaccoFacileModuleService