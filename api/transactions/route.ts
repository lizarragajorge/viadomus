import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  // Build query
  let query = supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  // Add status filter if provided
  if (status) {
    query = query.eq("status", status)
  }

  // Execute query
  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

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
    const body = await request.json()

    // Validate required fields
    if (!body.brokerage_id || !body.agent_id) {
      return NextResponse.json({ error: "Missing required fields: brokerage_id, agent_id" }, { status: 400 })
    }

    // Insert transaction
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        brokerage_id: body.brokerage_id,
        agent_id: body.agent_id,
        buyer_id: body.buyer_id,
        seller_id: body.seller_id,
        status: body.status || "draft",
        property_address: body.property_address,
        closing_date: body.closing_date,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create default milestones if transaction was created successfully
    if (data && data.id) {
      const closingDate = new Date(body.closing_date || new Date())

      // Create milestones
      const milestones = [
        {
          transaction_id: data.id,
          name: "Contract Acceptance",
          due_date: new Date().toISOString().split("T")[0],
        },
        {
          transaction_id: data.id,
          name: "Option Period",
          due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0],
        },
        {
          transaction_id: data.id,
          name: "Financing Approval",
          due_date: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString().split("T")[0],
        },
        {
          transaction_id: data.id,
          name: "Closing",
          due_date: closingDate.toISOString().split("T")[0],
        },
      ]

      const { error: milestonesError } = await supabase.from("milestones").insert(milestones)

      if (milestonesError) {
        console.error("Error creating milestones:", milestonesError)
      }
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
