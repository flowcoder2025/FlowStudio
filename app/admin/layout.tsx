import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions/admin'
import { Providers } from '@/components/providers/Providers'
import '../globals.css'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const adminCheck = await isAdmin(session.user.id)

  if (!adminCheck) {
    redirect('/')
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
