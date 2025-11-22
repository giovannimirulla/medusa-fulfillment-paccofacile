import { MedusaService } from "@medusajs/framework/utils"
import { Account, Credit } from "./types"
import { PaccoFacileClient } from "./client"

export type PaccoFacileOptions = {
    api_key: string,
    api_token: string,
    account_number: string
}

/**
 * PaccoFacile Module Service
 * Provides admin API methods for account and credit information.
 * This is separate from the fulfillment provider service.
 */
class PaccoFacileModuleService extends MedusaService({}) {
    protected options_: PaccoFacileOptions
    protected client: PaccoFacileClient

    constructor({}, options: PaccoFacileOptions) {
        super(...arguments)
        this.options_ = options
        this.client = new PaccoFacileClient(options)
    }

    /**
     * Retrieves account information from PaccoFacile API.
     * @returns Promise resolving to account details
     * @throws Error if account not found
     */
    async getAccount(): Promise<Account> {
        const account = await this.client.getAccount()
        if (!account) {
            throw new Error("Account not found")
        }
        return account
    }

    /**
     * Retrieves credit information from PaccoFacile API.
     * @returns Promise resolving to credit details
     * @throws Error if credit not found
     */
    async getCredit(): Promise<Credit> {
        const credit = await this.client.getCredit()
        if (!credit) {
            throw new Error("Credit not found")
        }
        return credit
    }
}

export default PaccoFacileModuleService
