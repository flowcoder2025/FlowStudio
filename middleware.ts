/**
 * Next.js Middleware - Route Protection & API 최적화
 *
 * [성능 최적화] Edge Middleware에서 JWT 검증
 * - 보호된 페이지: 인증 체크 후 리다이렉트
 * - 보호된 API: x-user-id 헤더 주입 (getServerSession 호출 감소)
 *
 * 보호된 라우트에 대한 인증 체크
 * - 공개 페이지: /, /login, /privacy, /terms, /refund
 * - 인증 필요: /create, /edit, /detail-page, /detail-edit, /profile, /gallery 등
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

// 보호된 API 경로 목록
const PROTECTED_API_PATHS = [
  '/api/generate',
  '/api/upscale',
  '/api/images',
  '/api/projects',
  '/api/credits',
  '/api/profile',
  '/api/subscription',
  '/api/referral',
  '/api/detail-page-drafts',
]

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // 이미 로그인한 사용자가 로그인 페이지 접근 시 홈으로 리다이렉트
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // [성능 최적화] 보호된 API 경로에 x-user-id 헤더 주입
    // API Route에서 getServerSession 호출 없이 바로 userId 사용 가능
    if (token?.sub) {
      const isProtectedApi = PROTECTED_API_PATHS.some(path =>
        pathname.startsWith(path)
      )

      if (isProtectedApi) {
        const response = NextResponse.next()
        response.headers.set('x-user-id', token.sub)
        return response
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 공개 페이지는 항상 접근 가능
        const publicPaths = ['/', '/login', '/auth/error', '/privacy', '/terms', '/refund']
        if (publicPaths.includes(pathname)) {
          return true
        }

        // API 라우트는 각자 인증 체크 (NextAuth API 제외)
        if (pathname.startsWith('/api/auth')) {
          return true
        }

        // 웹훅 API는 인증 체크 제외 (별도 서명 검증)
        if (pathname.includes('/webhook')) {
          return true
        }

        // Cron API는 인증 체크 제외 (Vercel Cron 전용)
        if (pathname.startsWith('/api/cron')) {
          return true
        }

        // 정적 파일은 접근 가능
        if (
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.includes('.')
        ) {
          return true
        }

        // 그 외 모든 페이지는 인증 필요
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
