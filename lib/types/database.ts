export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      brokerages: {
        Row: {
          created_at: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          name: string
          transaction_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          name: string
          transaction_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          name?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_transaction_id_fkey"
            columns: ["transaction_id"]
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          sent_at: string | null
          type: "email" | "sms" | "in_app"
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          sent_at?: string | null
          type: "email" | "sms" | "in_app"
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          sent_at?: string | null
          type?: "email" | "sms" | "in_app"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          milestone_id: string
          owner_id: string | null
          status: "todo" | "in_progress" | "done"
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          milestone_id: string
          owner_id?: string | null
          status?: "todo" | "in_progress" | "done"
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          milestone_id?: string
          owner_id?: string | null
          status?: "todo" | "in_progress" | "done"
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          agent_id: string
          brokerage_id: string
          buyer_id: string | null
          closing_date: string | null
          created_at: string
          id: string
          property_address: string | null
          seller_id: string | null
          status: "draft" | "active" | "closed"
        }
        Insert: {
          agent_id: string
          brokerage_id: string
          buyer_id?: string | null
          closing_date?: string | null
          created_at?: string
          id?: string
          property_address?: string | null
          seller_id?: string | null
          status?: "draft" | "active" | "closed"
        }
        Update: {
          agent_id?: string
          brokerage_id?: string
          buyer_id?: string | null
          closing_date?: string | null
          created_at?: string
          id?: string
          property_address?: string | null
          seller_id?: string | null
          status?: "draft" | "active" | "closed"
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_brokerage_id_fkey"
            columns: ["brokerage_id"]
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          brokerage_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: "superadmin" | "coordinator" | "agent" | "buyer" | "seller"
        }
        Insert: {
          brokerage_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role: "superadmin" | "coordinator" | "agent" | "buyer" | "seller"
        }
        Update: {
          brokerage_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: "superadmin" | "coordinator" | "agent" | "buyer" | "seller"
        }
        Relationships: [
          {
            foreignKeyName: "users_brokerage_id_fkey"
            columns: ["brokerage_id"]
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      notification_type: "email" | "sms" | "in_app"
      task_status: "todo" | "in_progress" | "done"
      transaction_status: "draft" | "active" | "closed"
      user_role: "superadmin" | "coordinator" | "agent" | "buyer" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
