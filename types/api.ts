/**
 * API Response Types
 *
 * Type-safe API response definitions for all endpoints
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
// Authentication API Types
// ============================================

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface AuthSession {
  user: AuthUser
  expires: string
}

// ============================================
// Profile API Types
// ============================================

export interface ApiKeyResponse {
  exists: boolean
  isConfigured: boolean
  lastUpdated: string | null
}

export interface ApiKeySaveResponse {
  success: boolean
  message: string
}

export interface ApiKeyDeleteResponse {
  success: boolean
  message: string
}

// ============================================
// Image Generation API Types
// ============================================

export interface GenerationResponse {
  images: string[]
}

export interface TextExtractionResponse {
  text: string
}

export interface GenerationError extends ApiError {
  error: string
}

// ============================================
// Projects API Types
// ============================================

export interface ImageProject {
  id: string
  userId: string
  title: string | null
  mode: string
  prompt: string | null
  category: string | null
  style: string | null
  sourceImage: string | null
  resultImages: string[]
  status: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ProjectListResponse {
  projects: ImageProject[]
}

export interface ProjectResponse {
  project: ImageProject
}

export interface ProjectCreateRequest {
  title?: string
  mode: string
  prompt?: string
  category?: string
  style?: string
  sourceImage?: string
}

export interface ProjectUpdateRequest {
  title?: string
  prompt?: string
  category?: string
  style?: string
  resultImages?: string[]
  status?: string
}

// ============================================
// Project Sharing API Types
// ============================================

export interface Collaborator {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  relation: 'owner' | 'editor' | 'viewer'
}

export interface ShareRequest {
  collaboratorEmail: string
  role: 'editor' | 'viewer'
}

export interface ShareResponse {
  success: boolean
  message: string
}

export interface RevokeShareRequest {
  collaboratorId: string
  role: 'editor' | 'viewer'
}

export interface CollaboratorsResponse {
  collaborators: Collaborator[]
}

// ============================================
// Usage Stats API Types
// ============================================

export interface DailyUsage {
  date: string
  count: number
}

export interface UsageStats {
  totalImages: number
  totalCostUsd: number
  todayUsage: number
  history: DailyUsage[]
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
  expiresInDays?: number | null  // null이면 무기한
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
  // 관련 프로젝트 이미지 (미리보기용)
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
