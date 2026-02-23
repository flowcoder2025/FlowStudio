/**
 * Admin API Types
 *
 * Type definitions for admin dashboard API endpoints
 */

// ============================================
// Generic API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  statusCode?: number
  details?: unknown
}

// ============================================
// Admin API Types
// ============================================

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  creditBalance: number
  totalGenerated: number
  createdAt: Date
  businessVerified: boolean
  subscriptionTier: string | null
}

export interface AdminUsersResponse {
  users: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminBonusRequest {
  userId: string
  amount: number
  description: string
  expiresInDays?: number | null
}

export interface AdminBonusResponse {
  success: true
  transaction: {
    id: string
    userId: string
    amount: number
    description: string
    expiresAt: Date | null
  }
  newBalance: number
}

export interface AdminStats {
  users: {
    total: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
    businessVerified: number
  }
  credits: {
    totalInCirculation: number
    totalPurchased: number
    totalBonusGranted: number
    totalUsed: number
    totalExpired: number
  }
  generations: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  subscriptions: {
    free: number
    plus: number
    pro: number
    enterprise: number
  }
}

export interface AdminStatsResponse {
  success: true
  stats: AdminStats
}

// ============================================
// Admin Generations (생성 내역) API Types
// ============================================

export interface AdminGeneration {
  id: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  mode: string
  prompt: string | null
  category: string | null
  style: string | null
  imageCount: number
  costUsd: number
  status: 'success' | 'failed'
  errorMessage: string | null
  createdAt: string
  projectImages: string[]
}

export interface AdminGenerationsResponse {
  success: true
  generations: AdminGeneration[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalToday: number
    successToday: number
    failedToday: number
  }
}

// ============================================
// Admin Errors (오류 내역) API Types
// ============================================

export interface AdminError {
  id: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  mode: string
  prompt: string | null
  errorMessage: string | null
  createdAt: string
}

export interface AdminErrorsResponse {
  success: true
  errors: AdminError[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalToday: number
    totalThisWeek: number
    totalThisMonth: number
  }
}
