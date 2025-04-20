import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { DocuSignEnvelopeInput, DocuSignEnvelopeResult } from "@/lib/types"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body: DocuSignEnvelopeInput = await request.json()

    // Validate required fields
    if (!body.transaction_id || !body.document_type || !body.signers || body.signers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: transaction_id, document_type, signers" },
        { status: 400 },
      )
    }

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", body.transaction_id)
      .single()

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: transactionError.code === "PGRST116" ? 404 : 500 },
      )
    }

    // In a real implementation, this would call the DocuSign API
    // For this MVP, we'll simulate the response

    const envelopeId = `env-${Math.random().toString(36).substring(2, 10)}`

    // Create a simulated DocuSign response
    const result: DocuSignEnvelopeResult = {
      envelope_id: envelopeId,
      status: "sent",
      view_url: `/esign/${body.transaction_id}?envelope_id=${envelopeId}`,
    }

    // Record the envelope in the database (in a real app)
    // This would be a separate table to track DocuSign envelopes

    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
