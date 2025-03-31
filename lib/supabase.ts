import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type FlashcardCollection = {
  id: string
  collection_name: string
  content: {
    question: string
    answer: string
  }[]
  edited_at: string
  url_path?: string
}

// Database types
export type DbFlashcardCollection = {
  id: string
  collection_name: string
  content: {
    question: string
    answer: string
  }[]
  edited_at: string
  url_path?: string
}

