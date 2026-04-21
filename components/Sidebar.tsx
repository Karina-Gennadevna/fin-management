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
      className="w-56 flex flex-col py-5 px-3 shrink-0"
      style={{ background: '#13131a', borderRight: '1px solid #2a2a3a' }}
    >
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: '#6366f1' }}>
          Ф
        </div>
        <span className="font-semibold text-white text-sm">Мои финансы</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? '#6366f120' : 'transparent',
                color: active ? '#818cf8' : '#9090a8',
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t pt-3 mt-3" style={{ borderColor: '#2a2a3a' }}>
        <div className="px-3 py-2 mb-1">
          <p className="text-xs truncate" style={{ color: '#9090a8' }}>{userEmail}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80"
          style={{ color: '#ef4444' }}
        >
          <span>⊗</span>
          Выйти
        </button>
      </div>
    </aside>
  )
}
