/**
 * Next.js Middleware - Route Protection
 *
 * 보호된 라우트에 대한 인증 체크
 * - 공개 페이지: /, /login
 * - 인증 필요: /create, /edit, /detail-page, /detail-edit, /profile
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // 이미 로그인한 사용자가 로그인 페이지 접근 시 홈으로 리다이렉트
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 공개 페이지는 항상 접근 가능
        const publicPaths = ['/', '/login', '/auth/error']
        if (publicPaths.includes(pathname)) {
          return true
        }

        // API 라우트는 각자 인증 체크 (NextAuth API 제외)
        if (pathname.startsWith('/api/auth')) {
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
