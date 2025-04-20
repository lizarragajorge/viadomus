export type UserRole = "superadmin" | "coordinator" | "agent" | "buyer" | "seller"
export type TransactionStatus = "draft" | "active" | "closed"
export type TaskStatus = "todo" | "in_progress" | "done"
export type NotificationType = "email" | "sms" | "in_app"

export interface Brokerage {
  id: string
  name: string
  timezone: string
  created_at: string
}

export interface User {
  id: string
  brokerage_id: string
  role: UserRole
  name: string
  email: string
  created_at: string
}

export interface Transaction {
  id: string
  brokerage_id: string
  agent_id: string
  buyer_id?: string
  seller_id?: string
  status: TransactionStatus
  property_address?: string
  closing_date?: string
  created_at: string
}

export interface Milestone {
  id: string
  transaction_id: string
  name: string
  due_date: string
  completed_at?: string
  created_at: string
}

export interface Task {
  id: string
  milestone_id: string
  description: string
  owner_id?: string
  status: TaskStatus
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, any>
  sent_at?: string
  created_at: string
}

export interface SimulationInput {
  transaction_id: string
  inspection_offset_days: number
}

export interface SimulationResult {
  original_milestones: Milestone[]
  recalculated_milestones: Milestone[]
  cost_impact: {
    additional_cost: number
    reason: string
  }
}

export interface DocuSignEnvelopeInput {
  transaction_id: string
  document_type: string
  signers: {
    email: string
    name: string
    role: string
  }[]
}

export interface DocuSignEnvelopeResult {
  envelope_id: string
  status: string
  view_url?: string
}
