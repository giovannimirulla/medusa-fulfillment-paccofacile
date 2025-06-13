import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

type Product = {
    length: number; // Lunghezza in cm
    width: number;  // Larghezza in cm
    height: number; // Altezza in cm
    weight: number; // Peso in kg
};


// Helper function to format dates
const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};


const FulfillmentDataWidget = ({
    data: originalOrder,
}: DetailWidgetProps<AdminOrder>) => {
    const [loading, setLoading] = useState(true)
    const [quoteLoading, setQuoteLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [quoteData, setQuoteData] = useState<any | null>(null)

    const shippingMethod = originalOrder?.shipping_methods?.[0].data


    const updateShippingMethodData = async (data: any) => {
        if (!shippingMethod) {
            console.error("shippingMethod is null");
            return;
        }
        try {
            const requestBody = {
                data: data,
            };

            await fetch(
                `/admin/orders/${originalOrder.id}/shipping-methods/${shippingMethod.id}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                }
            );
        } catch (error) {
            console.error("Error updating shipping method data:", error);
            setError("An error occurred while updating the shipping method data");
        }
    }


    const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
        queryFn: () => sdk.admin.currency.list(),
        queryKey: ["currencies"],
    })

    //   const updateShippingMethodMutation = useMutation({
    //     mutationFn: async (params) => {


    //         const actionId = shippingMethod.actions?.find(
    //             action => action.name === "shipping_method"
    //           )?.id

    //           if (!actionId) {
    //             throw new Error("No action ID found for shipping method")
    //           }

    //       return await sdk.admin.exchange.updateOutboundShipping(
    //         data.id,
    //         actionId,
    //         {
    //           data: params.newData
    //         }
    //       )
    //     },
    //     onSuccess: () => {
    //       // Invalidate and refetch the order query to get updated data
    //       queryClient.invalidateQueries([["order", data.id]])
    //       setIsEditing(false)
    //     }
    //   })

    // Format price with currency
    const formatPrice = (amount: number, currencyCode: string) => {
        const currency = currencies?.currencies.find(c => c.code.toLowerCase() === currencyCode.toLowerCase())
        if (!currency) return `${amount}`

        return `${currency.symbol}${amount}`
    }


    const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
        queryFn: () => sdk.admin.stockLocation.list(),
        queryKey: [["stock-locations"]],
    })

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

    const fetchQuote = async () => {
        setQuoteLoading(true)
        setError(null)


        const items: Product[] = originalOrder.items.reduce((final, item) => {
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

        const service_id = shippingMethod?.service_id

        const destination = {
            iso_code: originalOrder?.shipping_address?.country_code,
            postal_code: originalOrder?.shipping_address?.postal_code,
            city: originalOrder?.shipping_address?.city,
            StateOrProvinceCode: originalOrder?.shipping_address?.province,
        }

        const pickup = {
            iso_code: locationsData?.stock_locations?.[0]?.address?.country_code ?? '',
            postal_code: locationsData?.stock_locations?.[0]?.address?.postal_code ?? '',
            city: locationsData?.stock_locations?.[0]?.address?.city ?? '',
            StateOrProvinceCode: locationsData?.stock_locations?.[0]?.address?.province ?? '',
        }


        try {
            const response = await fetch("/paccofacile/quote", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item: item,
                    destination: destination,
                    service_id: service_id,
                    pickup: pickup,
                }),
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch quote: ${response.statusText}`)
            }

            const data = await response.json()

            updateShippingMethodData(data.quote)

            setQuoteData(data.quote)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError(String(err))
            }
        } finally {
            setQuoteLoading(false)
        }
    }

    //call fetchQuote function when both locations and currencies are loaded
    useEffect(() => {
        setLoading(isLoadingLocations || isLoadingCurrencies || quoteLoading)
        if (!isLoadingLocations && !isLoadingCurrencies && quoteLoading && originalOrder.fulfillment_status === "not_fulfilled") {
            fetchQuote()
        }
        if (originalOrder.fulfillment_status !== "not_fulfilled") {
            setQuoteData(null)
            setError(null)
            setLoading(false)
            setQuoteLoading(true)
        }
    }, [isLoadingLocations, isLoadingCurrencies, quoteLoading])


    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <Heading level="h2">Fulfillment Details</Heading>
                </div>
            </div>

            {/* Mostra lo stato di caricamento */}
            {loading && (
                <div className="px-6 py-4">
                    <Text size="small" className="text-ui-fg-subtle">
                        Loading...
                    </Text>
                </div>
            )}

            {/* Mostra eventuali errori */}
            {error && (
                <div className="px-6 py-4">
                    <Text size="small" className="text-ui-fg-error">
                        Error: {error}
                    </Text>
                </div>
            )}

            {/* Mostra i dettagli solo se non ci sono errori e non è in caricamento */}
            {!loading && !error && (
                <>
                    <div
                        className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
                    >
                        <div className="flex items-center gap-x-4">
                            <img
                                src={(shippingMethod as any)?.image_url || ""}
                                alt={typeof shippingMethod?.name === 'string' ? shippingMethod.name : "Image"}
                                className="w-24 h-24 object-contain"
                            />
                            <div>
                                <Text
                                    size="small"
                                    leading="compact"
                                    weight="plus"
                                    className="text-ui-fg-base"
                                >
                                    {quoteData?.name
                                        ? String(quoteData.carrier)
                                        : String((shippingMethod?.quote as any)?.carrier || "")}
                                </Text>
                                {(quoteData?.carrier || (shippingMethod as { service_name?: string })?.service_name) && (
                                    <div className="flex items-center gap-x-1">
                                        <Text size="small">{quoteData?.name || (shippingMethod?.quote as any)?.name}</Text>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-x-4">
                            <div className="flex items-center justify-end">
                                <Text size="small">
                                    {(() => {
                                        const waitingTime = (quoteData?.pickup_date as any)?.waiting_time || ((shippingMethod?.quote as any)?.pickup_date as any)?.waiting_time;
                                        const deliveryDays = (quoteData?.delivery_date as any)?.delivery_days || ((shippingMethod?.quote as any)?.delivery_date as any)?.delivery_days;
                                        if (!waitingTime || typeof deliveryDays !== "number") return "N/A";
                                        const minutesFromWaiting =
                                            waitingTime.days * 24 * 60 +
                                            waitingTime.hours * 60 +
                                            waitingTime.minutes;
                                        const minutesFromDelivery = deliveryDays * 24 * 60;
                                        const totalMinutes = minutesFromWaiting + minutesFromDelivery;
                                        const roundedDays = Math.round(totalMinutes / (24 * 60));

                                        return `${roundedDays} days`;
                                    })()}
                                </Text>
                            </div>

                            <div className="flex items-center justify-end">
                                <Text size="small">
                                    {quoteData?.price_service
                                        ? formatPrice(((quoteData?.price_service as { amount: number; currency: string })?.amount) || 0, ((quoteData?.price_service as { amount: number; currency: string })?.currency) || '')
                                        : formatPrice((((shippingMethod?.quote as any)?.price_service as { amount: number; currency: string })?.amount) || 0, (((shippingMethod?.quote as any)?.price_service as { amount: number; currency: string })?.currency) || '')
                                    }
                                </Text>
                            </div>
                        </div>
                    </div>
                    <div className="text-ui-fg-subtle flex flex-col gap-y-2 px-6 py-4">
                        <div className="grid grid-cols-2 items-center">
                            <Text size="small" leading="compact">
                                Delivery Date
                            </Text>
                            <div className="text-right">
                                <Text size="small" leading="compact">
                                    {quoteData?.delivery_date ? (
                                        formatDate((quoteData?.delivery_date as { first_delivery_date?: string })
                                            ?.first_delivery_date)
                                    ) : formatDate(
                                        ((shippingMethod?.quote as any)?.delivery_date as { first_delivery_date?: string })
                                            ?.first_delivery_date
                                    )}
                                </Text>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 items-center">
                            <Text
                                className="text-ui-fg-subtle text-semibold"
                                size="small"
                                leading="compact"
                                weight="plus"
                            >
                                Pickup Date
                            </Text>
                            <div className="text-right">
                                <Text
                                    className="text-ui-fg-subtle text-bold"
                                    size="small"
                                    leading="compact"
                                    weight="plus"
                                >
                                    {quoteData?.pickup_date ? (
                                        formatDate((quoteData?.pickup_date as { first_date?: string })
                                            ?.first_date)
                                    ) : formatDate(
                                        ((shippingMethod?.quote as any)?.pickup_date as { first_date?: string })
                                            ?.first_date
                                    )}
                                </Text>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Container>
    );
};

export const config = defineWidgetConfig({
    zone: "order.details.after",
})

export default FulfillmentDataWidget
