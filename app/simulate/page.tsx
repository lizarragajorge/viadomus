"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { SimulationResult, Transaction } from "@/lib/types"

export default function SimulatePage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transaction_id")
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [inspectionOffsetDays, setInspectionOffsetDays] = useState(0)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("transactions").select("*").eq("id", transactionId).single()

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
  }, [transactionId, supabase, toast])

  const handleSimulate = async () => {
    if (!transaction) return

    setIsSimulating(true)
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          inspection_offset_days: inspectionOffsetDays,
        }),
      })

      if (!response.ok) {
        throw new Error("Simulation failed")
      }

      const result = await response.json()
      setSimulationResult(result.data)

      toast({
        title: "Simulation complete",
        description: `Simulated with ${inspectionOffsetDays} day offset`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run simulation",
        variant: "destructive",
      })
      console.error("Error running simulation:", error)
    } finally {
      setIsSimulating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading transaction data...</p>
      </div>
    )
  }

  if (!transaction && transactionId) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Transaction not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Transaction Timeline Simulation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
          <CardDescription>Adjust the inspection period to see how it affects the closing timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transaction ? (
              <div>
                <p className="text-sm font-medium">Property: {transaction.property_address || "Unnamed Property"}</p>
                <p className="text-sm text-muted-foreground">Transaction ID: {transaction.id}</p>
              </div>
            ) : (
              <div className="p-4 border rounded-md">
                <p className="text-center text-muted-foreground">No transaction selected</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inspectionOffset">Inspection Period Offset (days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="inspectionOffset"
                  type="number"
                  value={inspectionOffsetDays}
                  onChange={(e) => setInspectionOffsetDays(Number.parseInt(e.target.value) || 0)}
                  disabled={!transaction}
                />
                <Button onClick={handleSimulate} disabled={!transaction || isSimulating}>
                  {isSimulating ? "Simulating..." : "Run Simulation"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Positive values extend the inspection period, negative values shorten it
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {simulationResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
              <CardDescription>
                Impact of {inspectionOffsetDays} day{Math.abs(inspectionOffsetDays) !== 1 ? "s" : ""}{" "}
                {inspectionOffsetDays >= 0 ? "extension" : "reduction"} to inspection period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Cost Impact</h3>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-bold text-lg">${simulationResult.cost_impact.additional_cost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{simulationResult.cost_impact.reason}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Timeline Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Milestone</th>
                          <th className="text-left p-2">Original Date</th>
                          <th className="text-left p-2">New Date</th>
                          <th className="text-left p-2">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.original_milestones.map((original, index) => {
                          const recalculated = simulationResult.recalculated_milestones[index]
                          const originalDate = new Date(original.due_date)
                          const newDate = new Date(recalculated.due_date)
                          const diffDays = Math.round(
                            (newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24),
                          )

                          return (
                            <tr key={original.id} className="border-b">
                              <td className="p-2 font-medium">{original.name}</td>
                              <td className="p-2">{originalDate.toLocaleDateString()}</td>
                              <td className="p-2">{newDate.toLocaleDateString()}</td>
                              <td className="p-2">
                                {diffDays === 0 ? (
                                  <span>No change</span>
                                ) : (
                                  <span className={diffDays > 0 ? "text-red-600" : "text-green-600"}>
                                    {diffDays > 0 ? "+" : ""}
                                    {diffDays} day{Math.abs(diffDays) !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
