"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupabase } from "@/lib/supabase/provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ClipboardListIcon, HomeIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import type { Transaction, Task, Milestone } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<(Task & { milestone: Milestone })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useSupabase()
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])

        // Fetch upcoming tasks with their milestones
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            milestone:milestones(*)
          `)
          .eq("status", "todo")
          .order("created_at", { ascending: false })
          .limit(10)

        if (tasksError) throw tasksError
        setUpcomingTasks(tasksData || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, supabase, toast])

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => router.push("/transactions/new")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Transactions</TabsTrigger>
          <TabsTrigger value="tasks">Upcoming Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="text-center p-4">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active transactions found.</p>
                <Button className="mt-4" onClick={() => router.push("/transactions/new")}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Transaction
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {transactions.map((transaction) => (
                <Link key={transaction.id} href={`/transactions/${transaction.id}`} passHref>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{transaction.property_address || "Unnamed Property"}</CardTitle>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {transaction.closing_date
                            ? new Date(transaction.closing_date).toLocaleDateString()
                            : "No closing date"}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span>ID: {transaction.id.substring(0, 8)}...</span>
                        <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          {isLoading ? (
            <div className="text-center p-4">Loading tasks...</div>
          ) : upcomingTasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No upcoming tasks found.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Tasks that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <li key={task.id} className="flex items-start p-3 border rounded-md">
                      <ClipboardListIcon className="h-5 w-5 mr-3 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{task.description}</p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <HomeIcon className="h-3 w-3 mr-1" />
                          <span>
                            {task.milestone?.name} - Due: {new Date(task.milestone?.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Mark Done
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
