import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('http') && !url.includes('placeholder')
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail = 'demo@example.com'

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const { redirect } = await import('next/navigation')
      redirect('/login')
    }
    userEmail = user?.email ?? userEmail
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0A' }}>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
