import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { sdk } from "../lib/sdk"
import { useState } from "react"

interface PaccoFacileDocument {
  content: string // base64
  format: string  // pdf, png, etc.
  type: string    // LABEL_LDV, FATTURA_PRO_FORMA, etc.
}

interface DocumentsResponse {
  fulfillment_id: string
  order_id: string
  documents: PaccoFacileDocument[]
}

const OrderPaccoFacileDocumentsWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  // Find PaccoFacile fulfillments
  const paccoFacileFulfillments = order.fulfillments?.filter(
    (f) => f.provider_id?.includes("paccofacile")
  ) || []

  if (paccoFacileFulfillments.length === 0) {
    return null // Don't show widget if no PaccoFacile fulfillments
  }

  const downloadDocument = async (fulfillmentId: string, documentType?: string) => {
    setIsLoading(true)
    setDownloadingDoc(documentType || "all")
    
    try {
      const url = `/admin/orders/${order.id}/fulfillments/${fulfillmentId}/documents${documentType ? `?type=${documentType}` : ''}`
      
      const response = await sdk.client.fetch(url) as DocumentsResponse
      
      if (!response.documents || response.documents.length === 0) {
        toast.warning("No documents available", {
          description: "This shipment may not have been purchased yet."
        })
        return
      }

      // Download each document
      for (const doc of response.documents) {
        // Convert base64 to blob
        const byteCharacters = atob(doc.content)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: `application/${doc.format}` })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${doc.type}_${fulfillmentId}.${doc.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      toast.success("Documents downloaded", {
        description: `${response.documents.length} document(s) downloaded successfully`
      })
    } catch (error: any) {
      console.error("Failed to download documents:", error)
      toast.error("Failed to download documents", {
        description: error.message || "Please try again later"
      })
    } finally {
      setIsLoading(false)
      setDownloadingDoc(null)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "LABEL_LDV": "Shipping Label",
      "FATTURA_PRO_FORMA": "Pro Forma Invoice",
      "DOCUMENTAZIONE_DOGANALE": "Customs Documentation",
      "DICHIARAZIONE_LIBERA_ESPORTAZIONE": "Free Export Declaration",
      "MODELLO_CN23": "CN23 Form"
    }
    return labels[type] || type
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">PaccoFacile Documents</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Download shipping labels, invoices, and customs documents
          </Text>
        </div>
      </div>

      {paccoFacileFulfillments.map((fulfillment) => (
        <div key={fulfillment.id} className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Text size="small" weight="plus">
                Fulfillment #{fulfillment.id.slice(-8)}
              </Text>
              {fulfillment.shipped_at && (
                <Badge size="small" color="green">Shipped</Badge>
              )}
            </div>
            <Button
              variant="secondary"
              size="small"
              disabled={isLoading}
              isLoading={isLoading && downloadingDoc === "all"}
              onClick={() => downloadDocument(fulfillment.id)}
            >
              Download All
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {["LABEL_LDV", "FATTURA_PRO_FORMA", "DOCUMENTAZIONE_DOGANALE"].map((docType) => (
              <Button
                key={docType}
                variant="transparent"
                size="small"
                disabled={isLoading}
                isLoading={isLoading && downloadingDoc === docType}
                onClick={() => downloadDocument(fulfillment.id, docType)}
              >
                {getDocumentTypeLabel(docType)}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderPaccoFacileDocumentsWidget
