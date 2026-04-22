'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Goal } from '@/lib/types'

const COLORS = ['#C4A56A','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#22c55e','#14b8a6','#f97316']
const emptyForm = { name: '', target_amount: '', current_amount: '', deadline: '', color: '#C4A56A' }

export default function GoalsManager({ initialGoals, userId }: { initialGoals: Goal[]; userId: string }) {
  const [goals, setGoals] = useState(initialGoals)
  const [showForm, setShowForm] = useState(false)
  const [showDeposit, setShowDeposit] = useState<Goal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function openNew() { setForm(emptyForm); setEditing(null); setShowForm(true) }
  function openEdit(g: Goal) {
    setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), deadline: g.deadline ?? '', color: g.color })
    setEditing(g); setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.target_amount) return
    setLoading(true)
    const payload = { user_id: userId, name: form.name, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount) || 0, deadline: form.deadline || null, color: form.color, icon: 'target' }
    if (editing) {
      const { data } = await supabase.from('goals').update(payload).eq('id', editing.id).select().single()
      if (data) setGoals(prev => prev.map(g => g.id === editing.id ? data : g))
    } else {
      const { data } = await supabase.from('goals').insert(payload).select().single()
      if (data) setGoals(prev => [...prev, data])
    }
    setLoading(false); setShowForm(false)
  }

  async function handleDeposit() {
    if (!showDeposit || !depositAmount) return
    setLoading(true)
    const newAmount = showDeposit.current_amount + parseFloat(depositAmount)
    const { data } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', showDeposit.id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === showDeposit.id ? data : g))
    setLoading(false); setShowDeposit(null); setDepositAmount('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить цель?')) return
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#C4A56A' }}>
          + Новая цель
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.length === 0 ? (
          <div className="col-span-2 rounded-2xl p-8 text-center" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <p style={{ color: '#666666' }}>Нет целей</p>
          </div>
        ) : (
          goals.map(g => {
            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
            const done = g.current_amount >= g.target_amount
            return (
              <div key={g.id} className="rounded-2xl p-4" style={{ background: '#111111', border: `1px solid ${g.color}30` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: g.color + '25', color: g.color }}>◎</div>
                    <div>
                      <p className="font-semibold text-white text-sm">{g.name}</p>
                      {g.deadline && <p className="text-xs" style={{ color: '#666666' }}>До {formatDate(g.deadline)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-xs hover:bg-white/10" style={{ color: '#666666' }}>✎</button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-xs hover:bg-red-500/20" style={{ color: '#ef4444' }}>✕</button>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#666666' }}>
                    <span>{formatCurrency(g.current_amount)}</span>
                    <span>{formatCurrency(g.target_amount)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#0A0A0A' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? '#10b981' : g.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: done ? '#10b981' : '#666666' }}>
                    {done ? '✓ Цель достигнута!' : `${pct.toFixed(0)}% — осталось ${formatCurrency(g.target_amount - g.current_amount)}`}
                  </p>
                </div>
                {!done && (
                  <button onClick={() => { setShowDeposit(g); setDepositAmount('') }}
                    className="w-full py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 mt-1"
                    style={{ background: g.color }}>
                    Пополнить
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <h3 className="text-lg font-semibold text-white mb-5">{editing ? 'Редактировать цель' : 'Новая цель'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Название</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Например: Отпуск" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Целевая сумма ₽</label>
                <input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                  placeholder="100000" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Уже накоплено ₽</label>
                <input type="number" value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))}
                  placeholder="0" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Дата дедлайна (необязательно)</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full"
                      style={{ background: c, outline: form.color === c ? '3px solid white' : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#0A0A0A', color: '#666666', border: '1px solid #1E1E1E' }}>Отмена</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: '#C4A56A' }}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <h3 className="text-lg font-semibold text-white mb-2">Пополнить копилку</h3>
            <p className="text-sm mb-5" style={{ color: '#666666' }}>{showDeposit.name}</p>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
              placeholder="Сумма пополнения ₽" className="w-full px-4 py-2.5 rounded-xl text-white outline-none mb-4"
              style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
            <div className="flex gap-3">
              <button onClick={() => setShowDeposit(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#0A0A0A', color: '#666666', border: '1px solid #1E1E1E' }}>Отмена</button>
              <button onClick={handleDeposit} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: showDeposit.color }}>{loading ? '...' : 'Пополнить'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
