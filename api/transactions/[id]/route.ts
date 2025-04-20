import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id

  // Get transaction
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
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
    .eq("transaction_id", id)
    .order("due_date", { ascending: true })

  if (milestonesError) {
    return NextResponse.json({ error: milestonesError.message }, { status: 500 })
  }

  // Get tasks for each milestone
  const milestoneIds = milestones.map((milestone) => milestone.id)
  const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*").in("milestone_id", milestoneIds)

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  // Group tasks by milestone_id
  const tasksByMilestone = tasks.reduce((acc, task) => {
    if (!acc[task.milestone_id]) {
      acc[task.milestone_id] = []
    }
    acc[task.milestone_id].push(task)
    return acc
  }, {})

  // Add tasks to milestones
  const milestonesWithTasks = milestones.map((milestone) => ({
    ...milestone,
    tasks: tasksByMilestone[milestone.id] || [],
  }))

  return NextResponse.json({
    data: {
      transaction,
      milestones: milestonesWithTasks,
    },
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id

  try {
    const body = await request.json()

    // Update transaction
    const { data, error } = await supabase
      .from("transactions")
      .update({
        buyer_id: body.buyer_id,
        seller_id: body.seller_id,
        status: body.status,
        property_address: body.property_address,
        closing_date: body.closing_date,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id

  // Delete transaction (cascades to milestones and tasks)
  const { error } = await supabase.from("transactions").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 })
  }

  return NextResponse.json({ success: true })
}
