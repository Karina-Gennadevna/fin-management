'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/lib/types'

const COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#22c55e','#14b8a6','#f97316']
const TYPES = [
  { value: 'card', label: 'Карта' },
  { value: 'cash', label: 'Наличные' },
  { value: 'savings', label: 'Накопления' },
  { value: 'investment', label: 'Инвестиции' },
]

const emptyForm = { name: '', type: 'card', balance: '', currency: 'RUB', color: '#6366f1' }

export default function AccountsManager({ initialAccounts, userId }: { initialAccounts: Account[]; userId: string }) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  function openNew() { setForm(emptyForm); setEditing(null); setShowForm(true) }
  function openEdit(a: Account) {
    setForm({ name: a.name, type: a.type, balance: String(a.balance), currency: a.currency, color: a.color })
    setEditing(a); setShowForm(true)
  }

  async function handleSave() {
    if (!form.name) return
    setLoading(true)
    const payload = { user_id: userId, name: form.name, type: form.type, balance: parseFloat(form.balance) || 0, currency: form.currency, color: form.color, icon: 'wallet' }

    if (editing) {
      const { data } = await supabase.from('accounts').update(payload).eq('id', editing.id).select().single()
      if (data) setAccounts(prev => prev.map(a => a.id === editing.id ? data : a))
    } else {
      const { data } = await supabase.from('accounts').insert(payload).select().single()
      if (data) setAccounts(prev => [...prev, data])
    }
    setLoading(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить счёт? Все транзакции по нему тоже удалятся.')) return
    await supabase.from('accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label ?? t

  return (
    <>
      {/* Итого */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
        <p className="text-sm mb-1" style={{ color: '#9090a8' }}>Общий баланс</p>
        <p className="text-3xl font-bold text-white">{formatCurrency(totalBalance)}</p>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={openNew} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#6366f1' }}>
          + Добавить счёт
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map(a => (
          <div key={a.id} className="rounded-2xl p-4" style={{ background: '#1a1a24', border: `1px solid ${a.color}30` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: a.color + '25', color: a.color }}>◈</div>
                <div>
                  <p className="font-semibold text-white">{a.name}</p>
                  <p className="text-xs" style={{ color: '#9090a8' }}>{typeLabel(a.type)} · {a.currency}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-xs hover:bg-white/10" style={{ color: '#9090a8' }}>✎</button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-xs hover:bg-red-500/20" style={{ color: '#ef4444' }}>✕</button>
              </div>
            </div>
            <p className="text-2xl font-bold mt-3" style={{ color: a.color }}>{formatCurrency(a.balance, a.currency)}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
            <h3 className="text-lg font-semibold text-white mb-5">{editing ? 'Редактировать счёт' : 'Новый счёт'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Название</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Моя карта" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Тип</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Начальный баланс ₽</label>
                <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder="0" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ background: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#0f0f13', color: '#9090a8', border: '1px solid #2a2a3a' }}>Отмена</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: '#6366f1' }}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
