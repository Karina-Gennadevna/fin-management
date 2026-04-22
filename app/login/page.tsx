'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Проверьте почту для подтверждения регистрации!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('Неверный email или пароль')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-5" style={{ background: '#C4A56A', color: '#0A0A0A' }}>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>₽</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, color: '#F4EEE4', letterSpacing: '0.04em' }}>
            Мои финансы
          </h1>
          <p className="mt-2 text-xs tracking-widest uppercase" style={{ color: '#666666', letterSpacing: '0.15em' }}>
            {isSignUp ? 'Создать аккаунт' : 'Войти в систему'}
          </p>
        </div>

        <div className="p-7" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#666666', letterSpacing: '0.12em' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{ background: '#0A0A0A', border: '1px solid #1E1E1E', color: '#F4EEE4' }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#666666', letterSpacing: '0.12em' }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{ background: '#0A0A0A', border: '1px solid #1E1E1E', color: '#F4EEE4' }}
              />
            </div>

            {message && (
              <div className="text-sm p-3" style={{
                background: message.includes('Проверьте') ? '#10b98115' : '#ef444415',
                borderLeft: `2px solid ${message.includes('Проверьте') ? '#10b981' : '#ef4444'}`,
                color: message.includes('Проверьте') ? '#10b981' : '#ef4444'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-medium tracking-widest uppercase transition-all hover:opacity-85 disabled:opacity-40"
              style={{ background: '#C4A56A', color: '#0A0A0A', letterSpacing: '0.12em' }}
            >
              {loading ? '...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
              className="text-xs hover:opacity-70 transition-all"
              style={{ color: '#C4A56A', letterSpacing: '0.08em' }}
            >
              {isSignUp ? 'Уже есть аккаунт — войти' : 'Нет аккаунта — зарегистрироваться'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
