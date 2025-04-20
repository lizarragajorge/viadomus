"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Transaction, DocuSignEnvelopeResult } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"

export default function EsignPage({ params }: { params: { transactionId: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [documentType, setDocumentType] = useState("purchase_agreement")
  const [envelopeResult, setEnvelopeResult] = useState<DocuSignEnvelopeResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const searchParams = useSearchParams()
  const envelopeId = searchParams.get("envelope_id")
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("transactions").select("*").eq("id", params.transactionId).single()

        if (error) throw error
        setTransaction(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load transaction data",
          variant: "destructive",
        })
        console.error("Error fetching transaction:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()

    // If envelope_id is in URL, set it as the result
    if (envelopeId) {
      setEnvelopeResult({
        envelope_id: envelopeId,
        status: "sent",
        view_url: `/esign/${params.transactionId}?envelope_id=${envelopeId}`,
      })
    }
  }, [params.transactionId, envelopeId, supabase, toast])

  const handleSendEnvelope = async () => {
    if (!transaction) return

    setIsSending(true)
    try {
      const response = await fetch("/api/esign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          document_type: documentType,
          signers: [
            {
              email: "buyer@example.com",
              name: "Buyer User",
              role: "buyer",
            },
            {
              email: "seller@example.com",
              name: "Seller User",
              role: "seller",
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send envelope")
      }

      const result = await response.json()
      setEnvelopeResult(result.data)

      // Update URL with envelope_id
      router.push(`/esign/${params.transactionId}?envelope_id=${result.data.envelope_id}`)

      toast({
        title: "Envelope sent",
        description: "DocuSign envelope has been sent to all parties",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send DocuSign envelope",
        variant: "destructive",
      })
      console.error("Error sending envelope:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading transaction data...</p>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Transaction not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">DocuSign Integration</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send Documents for Signature</CardTitle>
          <CardDescription>Property: {transaction.property_address || "Unnamed Property"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={!!envelopeResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase_agreement">Purchase Agreement</SelectItem>
                  <SelectItem value="inspection_report">Inspection Report</SelectItem>
                  <SelectItem value="closing_disclosure">Closing Disclosure</SelectItem>
                  <SelectItem value="deed">Deed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!envelopeResult ? (
              <Button onClick={handleSendEnvelope} disabled={isSending}>
                {isSending ? "Sending..." : "Send for Signature"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium text-green-800">Envelope sent successfully!</p>
                  <p className="text-sm text-green-700">Envelope ID: {envelopeResult.envelope_id}</p>
                  <p className="text-sm text-green-700">Status: {envelopeResult.status}</p>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="p-4 bg-muted">
                    <h3 className="font-medium">DocuSign Embedded Signing</h3>
                  </div>
                  <div className="p-4 h-96 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        In a production environment, this would embed the DocuSign signing experience.
                      </p>
                      <Button variant="outline" onClick={() => router.push(`/transactions/${params.transactionId}`)}>
                        Return to Transaction
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
