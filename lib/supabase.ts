/**
 * Supabase Client for Storage Operations
 *
 * Used for uploading and managing images in Supabase Storage
 * Uses lazy initialization to avoid build-time errors when env vars are not set
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Storage bucket name
export const IMAGE_BUCKET = 'flowstudio-images'

// Lazy-initialized Supabase client
let supabaseInstance: SupabaseClient | null = null

/**
 * Get the Supabase client instance (lazy initialization)
 * Throws error at runtime if environment variables are missing
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  // Create a single supabase client for server-side operations
  // Using service role key for bypassing RLS (Row Level Security)
  supabaseInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseInstance
}

// For backward compatibility - will throw at runtime if env vars are missing
// @deprecated Use getSupabaseClient() instead
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getSupabaseClient(), prop)
  }
})
