/**
 * NextAuth.js Configuration - FlowStudio
 * Google OAuth + Prisma Adapter
 *
 * Separated from route handler for Next.js 16 compatibility
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { Adapter } from 'next-auth/adapters'
import GoogleProvider from 'next-auth/providers/google'
import KakaoProvider from 'next-auth/providers/kakao'
import { prisma } from '@/lib/prisma'
import { grantSignupBonus, initializeCredit } from '@/lib/utils/creditManager'
import { assignReferralCode } from '@/lib/utils/referralManager'
import { initializeSubscription } from '@/lib/utils/subscriptionManager'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      // 카카오 프로필 정보 명시적 매핑
      profile(profile) {
        console.log('[Kakao] Profile response:', JSON.stringify(profile, null, 2))
        return {
          id: String(profile.id),
          name: profile.kakao_account?.profile?.nickname ?? profile.properties?.nickname ?? null,
          email: profile.kakao_account?.email ?? null,
          image: profile.kakao_account?.profile?.profile_image_url ?? profile.properties?.profile_image ?? null,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // JWT strategy for serverless compatibility
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      // Persist user ID in JWT token
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // 신규 가입 시 초기화 및 보너스 지급
      console.log('[Auth] New user created:', user.id)

      try {
        // 1. 크레딧 레코드 초기화
        await initializeCredit(user.id)

        // 2. 일반 회원 가입 보너스 지급 (30 크레딧)
        await grantSignupBonus(user.id, 'general')
        console.log('[Auth] Signup bonus granted: 30 credits')

        // 3. 추천 코드 할당
        const referralCode = await assignReferralCode(user.id)
        console.log('[Auth] Referral code assigned:', referralCode)

        // 4. 구독 초기화 (FREE 플랜)
        await initializeSubscription(user.id)
        console.log('[Auth] Subscription initialized: FREE tier')
      } catch (error) {
        // 보너스 지급 실패가 가입을 차단하지 않도록 에러 로깅만
        console.error('[Auth] Post-signup initialization failed:', error)
      }
    },
  },
}
