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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f13' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#6366f1' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Мои финансы</h1>
          <p style={{ color: '#9090a8' }} className="mt-1 text-sm">
            {isSignUp ? 'Создайте аккаунт' : 'Войдите в свой аккаунт'}
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 transition-all"
                style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 outline-none transition-all"
                style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
              />
            </div>

            {message && (
              <div className="text-sm p-3 rounded-lg" style={{
                background: message.includes('Проверьте') ? '#10b98120' : '#ef444420',
                color: message.includes('Проверьте') ? '#10b981' : '#ef4444'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#6366f1' }}
            >
              {loading ? 'Загрузка...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
              className="text-sm hover:underline"
              style={{ color: '#6366f1' }}
            >
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
