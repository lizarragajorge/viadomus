import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await request.json()

    // In a real implementation, this would validate the DocuSign webhook payload
    // and update the corresponding milestone

    // Example webhook payload structure (simplified)
    // {
    //   "envelopeId": "string",
    //   "status": "completed",
    //   "completedAt": "2023-01-01T00:00:00Z",
    //   "customFields": {
    //     "transactionId": "uuid",
    //     "milestoneId": "uuid"
    //   }
    // }

    if (!body.envelopeId || !body.status || !body.customFields?.milestoneId) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Only update if the envelope is completed
    if (body.status === "completed") {
      const { error } = await supabase
        .from("milestones")
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq("id", body.customFields.milestoneId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
