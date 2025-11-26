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
