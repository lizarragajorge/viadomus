import { NextRequest } from "next/server"
import { POST } from "@/api/simulate/route"
import { describe, it, expect, jest } from "@jest/globals"

// Mock Supabase client
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => ({
        data: {
          session: {
            user: { id: "test-user-id" },
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: "test-transaction-id",
              brokerage_id: "test-brokerage-id",
              agent_id: "test-agent-id",
              status: "active",
              property_address: "123 Test St",
              closing_date: "2023-12-31",
            },
            error: null,
          })),
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [
              {
                id: "milestone-1",
                transaction_id: "test-transaction-id",
                name: "Contract Acceptance",
                due_date: "2023-11-01",
              },
              {
                id: "milestone-2",
                transaction_id: "test-transaction-id",
                name: "Inspection Period",
                due_date: "2023-11-15",
              },
              {
                id: "milestone-3",
                transaction_id: "test-transaction-id",
                name: "Closing",
                due_date: "2023-12-31",
              },
            ],
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

describe("Simulation API", () => {
  it("should calculate correct date differences and cost impact", async () => {
    // Create mock request
    const req = new NextRequest("http://localhost:3000/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_id: "test-transaction-id",
        inspection_offset_days: 5,
      }),
    })

    // Call the API handler
    const res = await POST(req)
    const data = await res.json()

    // Assertions
    expect(res.status).toBe(200)
    expect(data.data).toBeDefined()
    expect(data.data.original_milestones).toHaveLength(3)
    expect(data.data.recalculated_milestones).toHaveLength(3)

    // Check that only the inspection milestone and subsequent milestones are shifted
    expect(data.data.recalculated_milestones[0].due_date).toBe(data.data.original_milestones[0].due_date)
    expect(new Date(data.data.recalculated_milestones[1].due_date).getTime()).toBe(
      new Date(data.data.original_milestones[1].due_date).getTime() + 5 * 24 * 60 * 60 * 1000,
    )
    expect(new Date(data.data.recalculated_milestones[2].due_date).getTime()).toBe(
      new Date(data.data.original_milestones[2].due_date).getTime() + 5 * 24 * 60 * 60 * 1000,
    )

    // Check cost impact calculation
    expect(data.data.cost_impact.additional_cost).toBe(5 * 100) // $100 per day
    expect(data.data.cost_impact.reason).toContain("Delay of 5 days")
  })
})
