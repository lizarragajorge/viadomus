import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { SimulationInput, SimulationResult } from "@/lib/types"

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
    const body: SimulationInput = await request.json()

    // Validate required fields
    if (!body.transaction_id || body.inspection_offset_days === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: transaction_id, inspection_offset_days" },
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

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*")
      .eq("transaction_id", body.transaction_id)
      .order("due_date", { ascending: true })

    if (milestonesError) {
      return NextResponse.json({ error: milestonesError.message }, { status: 500 })
    }

    // Clone milestones for recalculation
    const originalMilestones = [...milestones]
    const recalculatedMilestones = JSON.parse(JSON.stringify(milestones))

    // Find inspection milestone (assuming it's the second milestone)
    const inspectionMilestoneIndex = recalculatedMilestones.findIndex(
      (m) => m.name.toLowerCase().includes("inspection") || m.name.toLowerCase().includes("option"),
    )

    if (inspectionMilestoneIndex === -1) {
      return NextResponse.json({ error: "Inspection milestone not found" }, { status: 400 })
    }

    // Calculate the offset in milliseconds
    const offsetDays = body.inspection_offset_days

    // Apply offset to inspection milestone and all subsequent milestones
    for (let i = inspectionMilestoneIndex; i < recalculatedMilestones.length; i++) {
      const milestone = recalculatedMilestones[i]
      const dueDate = new Date(milestone.due_date)
      dueDate.setDate(dueDate.getDate() + offsetDays)
      milestone.due_date = dueDate.toISOString().split("T")[0]
    }

    // Calculate cost impact
    // For this example, we'll use a simple formula: $100 per day of delay
    const costImpact = {
      additional_cost: offsetDays > 0 ? offsetDays * 100 : 0,
      reason:
        offsetDays > 0 ? `Delay of ${offsetDays} days results in additional carrying costs` : "No additional costs",
    }

    const result: SimulationResult = {
      original_milestones: originalMilestones,
      recalculated_milestones: recalculatedMilestones,
      cost_impact: costImpact,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
