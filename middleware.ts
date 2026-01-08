import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { routing, getLocaleFromCountry } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

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

const PUBLIC_PAGES = [
  '/',
  '/login',
  '/auth/error',
  '/privacy',
  '/terms',
  '/refund',
  '/pricing',
]

function isPublicPage(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/(ko|en)/, '') || '/'
  return PUBLIC_PAGES.includes(cleanPath)
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_vercel/') ||
      pathname.includes('.')
    ) {
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
    }

    const localeCookie = req.cookies.get('NEXT_LOCALE')?.value
    if (!localeCookie) {
      const country = req.headers.get('x-vercel-ip-country')
      const detectedLocale = getLocaleFromCountry(country)
      
      const response = intlMiddleware(req)
      response.cookies.set('NEXT_LOCALE', detectedLocale, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
      })
      return response
    }

    const cleanPath = pathname.replace(/^\/(ko|en)/, '') || '/'
    if (cleanPath === '/login' && token) {
      const locale = pathname.startsWith('/en') ? 'en' : 'ko'
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }

    return intlMiddleware(req)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        if (pathname.startsWith('/api/auth')) return true
        if (pathname.includes('/webhook')) return true
        if (pathname.startsWith('/api/cron')) return true
        if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) return true
        if (isPublicPage(pathname)) return true

        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)'],
}
