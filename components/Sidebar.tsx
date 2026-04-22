'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Главная', icon: '⊞' },
  { href: '/transactions', label: 'Транзакции', icon: '↕' },
  { href: '/accounts', label: 'Счета', icon: '◈' },
  { href: '/categories', label: 'Категории', icon: '◉' },
  { href: '/budgets', label: 'Бюджеты', icon: '▤' },
  { href: '/goals', label: 'Цели', icon: '◎' },
  { href: '/reports', label: 'Отчёты', icon: '↗' },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-56 flex flex-col py-6 px-3 shrink-0"
      style={{ background: '#080808', borderRight: '1px solid #1E1E1E' }}
    >
      <div className="flex items-center gap-3 px-3 mb-10">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center font-semibold" style={{ background: '#C4A56A', color: '#0A0A0A', fontSize: '15px' }}>
          ₽
        </div>
        <span className="text-sm tracking-widest uppercase" style={{ color: '#F4EEE4', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.12em' }}>Финансы</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                borderLeft: active ? '1px solid #C4A56A' : '1px solid transparent',
                color: active ? '#C4A56A' : '#666666',
                background: active ? '#C4A56A08' : 'transparent',
              }}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t pt-4 mt-4" style={{ borderColor: '#1E1E1E' }}>
        <div className="px-3 py-1 mb-1">
          <p className="text-xs truncate" style={{ color: '#444444' }}>{userEmail}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all hover:opacity-70"
          style={{ color: '#ef4444' }}
        >
          <span>⊗</span>
          Выйти
        </button>
      </div>
    </aside>
  )
}
