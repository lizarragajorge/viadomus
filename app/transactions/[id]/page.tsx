"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupabase } from "@/lib/supabase/provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, CheckIcon, ClipboardListIcon, FileTextIcon, HomeIcon, UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Transaction, Milestone, Task } from "@/lib/types"

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [milestones, setMilestones] = useState<(Milestone & { tasks: Task[] })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useSupabase()
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch transaction details
        const response = await fetch(`/api/transactions/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch transaction")
        }

        const data = await response.json()
        setTransaction(data.data.transaction)
        setMilestones(data.data.milestones)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load transaction data",
          variant: "destructive",
        })
        console.error("Error fetching transaction data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionData()
  }, [user, params.id, toast])

  const handleMarkTaskDone = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", taskId)

      if (error) throw error

      // Update local state
      setMilestones((prevMilestones) =>
        prevMilestones.map((milestone) => ({
          ...milestone,
          tasks: milestone.tasks.map((task) => (task.id === taskId ? { ...task, status: "done" } : task)),
        })),
      )

      toast({
        title: "Task updated",
        description: "Task marked as done",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
      console.error("Error updating task:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading transaction details...</p>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Transaction not found</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/simulate?transaction_id=" + transaction.id)}>
            Run Simulation
          </Button>
          <Button onClick={() => router.push("/esign/" + transaction.id)}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            DocuSign
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{transaction.property_address || "Unnamed Property"}</CardTitle>
              <CardDescription>Transaction ID: {transaction.id}</CardDescription>
            </div>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Property Details</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{transaction.property_address || "No address provided"}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Closing Date:{" "}
                    {transaction.closing_date ? new Date(transaction.closing_date).toLocaleDateString() : "Not set"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Participants</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Agent ID: {transaction.agent_id}</span>
                </div>
                {transaction.buyer_id && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Buyer ID: {transaction.buyer_id}</span>
                  </div>
                )}
                {transaction.seller_id && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Seller ID: {transaction.seller_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="space-y-4">
          <div className="timeline-container">
            <div className="timeline-line"></div>
            {milestones.map((milestone) => (
              <div key={milestone.id} className="timeline-item">
                <div
                  className={`timeline-marker ${milestone.completed_at ? "timeline-marker-completed" : "timeline-marker-incomplete"}`}
                ></div>
                <div className="timeline-content">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{milestone.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(milestone.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {milestone.completed_at
                      ? `Completed on ${new Date(milestone.completed_at).toLocaleDateString()}`
                      : `Due in ${Math.ceil((new Date(milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
                  </p>
                  {milestone.tasks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Tasks:</p>
                      <ul className="text-xs text-muted-foreground mt-1">
                        {milestone.tasks.map((task) => (
                          <li key={task.id} className="flex items-center">
                            {task.status === "done" ? (
                              <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                              <ClipboardListIcon className="h-3 w-3 mr-1" />
                            )}
                            <span>{task.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>All tasks for this transaction</CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.flatMap((milestone) => milestone.tasks).length === 0 ? (
                <p className="text-center text-muted-foreground">No tasks found for this transaction.</p>
              ) : (
                <ul className="space-y-3">
                  {milestones.flatMap((milestone) =>
                    milestone.tasks.map((task) => (
                      <li key={task.id} className="flex items-start p-3 border rounded-md">
                        <ClipboardListIcon className="h-5 w-5 mr-3 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{task.description}</p>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <span>
                              {milestone.name} - Due: {new Date(milestone.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {task.status !== "done" ? (
                          <Button size="sm" variant="outline" onClick={() => handleMarkTaskDone(task.id)}>
                            Mark Done
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </li>
                    )),
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
