import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Switch, useToggleState } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { sdk } from "../../../lib/sdk"
import { useQuery } from "@tanstack/react-query"

interface PaccoFacileAccount {
    customer_id: string
    firstname: string
    lastname: string
    contact: {
        email: string
        phone: string
    },
    account: {
        service: string
        company: string
    }
}

interface PaccoFacileCredit {
    cashback: {
        total: number
    }
    credit: {
        value: string
        currency: string
    }
}

const FulfillmentProvidersPage = () => {
    const [accountDetails, setAccountDetails] = useState<PaccoFacileAccount | null>(null)
    const [credit, setCredit] = useState<PaccoFacileCredit | null>(null)
    const [isAccountLoading, setIsAccountLoading] = useState(true)
    const [autoPayment, setAutoPayment] = useState(false)

    const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
        queryFn: () => sdk.admin.currency.list(),
        queryKey: ["currencies"],
    })

    // Format price with currency
    const formatPrice = (amount: number, currencyCode: string) => {
        const currency = currencies?.currencies.find(c => c.code.toLowerCase() === currencyCode.toLowerCase())
        if (!currency) return `${amount}`

        return `${currency.symbol}${amount}`
    }


    useEffect(() => {
        interface CustomSettingResponse {
            name: string
            value: string
        }
        // Fetch PaccoFacile account details
        const fetchAccountDetails = async () => {
            try {
                const response = await sdk.client.fetch(`/paccofacile/account`)
                const data = await response.json()
                setAccountDetails(data)
            } catch (error) {
                console.error("Failed to fetch PaccoFacile account details:", error)
            } finally {
                setIsAccountLoading(false)
            }
        }

        const fetchCredit = async () => {
            try {
                const response = await sdk.client.fetch(`/paccofacile/credit`)
                const data = await response.json()
                setCredit(data)
            } catch (error) {
                console.error("Failed to fetch PaccoFacile credit details:", error)
            }
        }

        const loadSetting = async (settingName: string): Promise<string | undefined> => {
            try {
                const res = await sdk.client.fetch(`/paccofacile/settings/${settingName}`)
            if (!res.ok) {
                throw new Error("Failed to fetch setting")
            }
            const data: CustomSettingResponse = await res.json()
            if (data && data.value) {
                return data.value
            }
            throw new Error("Setting not found")
            } catch (error: unknown) {
            console.error(`Failed to load setting ${settingName}:`, error)
            return undefined
            }
        }

        fetchAccountDetails()
        fetchCredit()
        loadSetting("autoPayment").then((settingValue) => {
            if (settingValue) {
                setAutoPayment(settingValue === "true")
            }
        }
        ).catch((error) => {
            console.error("Error loading setting:", error)
        }
        )
    }, [])



    interface SettingPayload {
        value: string
    }

    const saveSetting = async (settingName: string, settingValue: string): Promise<void> => {

        try {
            const payload: SettingPayload = {
                value: settingValue
            }

            await sdk.client.fetch(`/paccofacile/settings/${settingName}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ value: settingValue }),
            })
        } catch (error: unknown) {
            console.error(`Failed to save setting ${settingName}:`, error)
        }
    }

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <Heading>PaccoFacile
                    </Heading>
                    <Text className="text-ui-fg-subtle" size="small">
                        View your PaccoFacile account details and manage settings.
                    </Text>
                </div>
            </div>
            {isAccountLoading ? (
                <div className="flex items-center justify-center px-6 py-4">
                    <Text>Loading account details...</Text>
                </div>
            ) : (
                <>
                    {accountDetails && accountDetails.customer_id && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Customer ID
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.customer_id}
                        </Text>
                    </div>}
                    {accountDetails && accountDetails.firstname && accountDetails.lastname && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Name
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.firstname} {accountDetails.lastname}
                        </Text>
                    </div>}
                    {accountDetails && accountDetails.contact.email && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Email
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.contact.email}
                        </Text>
                    </div>}
                    {accountDetails && accountDetails.contact.phone && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Phone
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.contact.phone}
                        </Text>
                    </div>}
                    {accountDetails && accountDetails.account.service && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Serice
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.account.service}
                        </Text>
                    </div>}
                    {accountDetails && accountDetails.account.company && <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Company
                        </Text>
                        <Text size="small" leading="compact">
                            {accountDetails.account.company}
                        </Text>
                    </div>}
                    {credit && credit.credit && <div className="grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Credit
                        </Text>
                        <Text size="small" leading="compact">
                            {credit ? formatPrice(parseFloat(credit.credit.value), credit.credit.currency) : "N/A"}
                        </Text>
                    </div>}
                    {credit && credit.cashback && <div className="grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Cashback
                        </Text>
                        <Text size="small" leading="compact">
                            {credit ? credit.cashback.total : "N/A"}
                        </Text>
                    </div>}
                    <div className="grid grid-cols-2 items-center px-6 py-4">
                        <Text size="small" leading="compact" weight="plus">
                            Auto payment
                        </Text>
                        <Switch checked={autoPayment} onCheckedChange={(checked) => {
                            setAutoPayment(checked)
                            saveSetting("autoPayment", checked.toString())
                        }
                        } />
                    </div>
                </>
            )}
        </Container>
    )
}

export const config = defineRouteConfig({
    label: "PaccoFacile",
})

export default FulfillmentProvidersPage