import { MedusaError } from "@medusajs/framework/utils"
import { Account, Credit } from "./types"

export type PaccoFacileOptions = {
    api_key: string,
    api_token: string,
    account_number: string
}

/**
 * Client for PaccoFacile Admin API calls.
 * Used by the paccofacile module service for admin UI features.
 */
export class PaccoFacileClient {
    options: PaccoFacileOptions

    constructor(options: PaccoFacileOptions) {
        this.options = options
    }

    private async sendRequest(url: string, data?: RequestInit): Promise<any> {
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
                        `An error occurred: ${resp.errors.map((error) => error.message)}`
                    );
                }
    
                return resp;
            });
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
    async getCredit(): Promise<Credit | null> {
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
}
