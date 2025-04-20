import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types/database"

export const createClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
