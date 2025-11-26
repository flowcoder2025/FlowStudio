/**
 * NextAuth Type Augmentation
 * Extends default NextAuth types to include user ID in session
 */

import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
  }
}
