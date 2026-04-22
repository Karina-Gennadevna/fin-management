'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Budget, Category, Transaction } from '@/lib/types'

interface Props {
  initialBudgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  userId: string
  month: number
  year: number
}

export default function BudgetsManager({ initialBudgets, categories, transactions, userId, month, year }: Props) {
  const [budgets, setBudgets] = useState(initialBudgets)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category_id: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function getSpent(categoryId: string) {
    return transactions.filter(t => t.category_id === categoryId).reduce((s, t) => s + Number(t.amount), 0)
  }

  const categoryWithBudget = budgets.map(b => b.category_id)
  const availableCategories = categories.filter(c => !categoryWithBudget.includes(c.id))

  async function handleSave() {
    if (!form.category_id || !form.amount) return
    setLoading(true)
    const payload = { user_id: userId, category_id: form.category_id, amount: parseFloat(form.amount), month, year }
    const { data } = await supabase.from('budgets').insert(payload).select('*, category:categories(*)').single()
    if (data) setBudgets(prev => [...prev, data])
    setLoading(false); setShowForm(false); setForm({ category_id: '', amount: '' })
  }

  async function handleDelete(id: string) {
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#C4A56A' }}>
          + Добавить бюджет
        </button>
      </div>

      <div className="space-y-3">
        {budgets.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <p style={{ color: '#666666' }}>Бюджеты не установлены</p>
          </div>
        ) : (
          budgets.map(b => {
            const spent = getSpent(b.category_id)
            const pct = Math.min((spent / b.amount) * 100, 100)
            const over = spent > b.amount
            const cat = b.category as Category
            return (
              <div key={b.id} className="rounded-2xl p-4" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: cat?.color ? cat.color + '25' : '#C4A56A25', color: cat?.color ?? '#C4A56A' }}>●</div>
                    <div>
                      <p className="font-medium text-white text-sm">{cat?.name ?? 'Категория'}</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Лимит: {formatCurrency(b.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: over ? '#ef4444' : 'white' }}>{formatCurrency(spent)}</p>
                      <p className="text-xs" style={{ color: '#666666' }}>из {formatCurrency(b.amount)}</p>
                    </div>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/20" style={{ color: '#ef4444' }}>✕</button>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#0A0A0A' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#ef4444' : pct > 75 ? '#f59e0b' : '#10b981' }} />
                </div>
                {over && <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>Превышен на {formatCurrency(spent - b.amount)}</p>}
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <h3 className="text-lg font-semibold text-white mb-5">Новый бюджет</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Категория</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }}>
                  <option value="">Выберите категорию</option>
                  {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Лимит на месяц ₽</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
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
    </>
  )
}
