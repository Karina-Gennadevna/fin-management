'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction, Account, Category } from '@/lib/types'

interface Props {
  initialTransactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  userId: string
}

const emptyForm = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  account_id: '',
  category_id: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

export default function TransactionsList({ initialTransactions, accounts, categories, userId }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const supabase = createClient()

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  function openNew() {
    setForm({ ...emptyForm, account_id: accounts[0]?.id ?? '' })
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t: Transaction) {
    setForm({
      type: t.type as 'income' | 'expense',
      amount: String(t.amount),
      account_id: t.account_id,
      category_id: t.category_id ?? '',
      description: t.description ?? '',
      date: t.date,
    })
    setEditing(t)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.amount || !form.account_id) return
    setLoading(true)
    const payload = {
      user_id: userId,
      type: form.type,
      amount: parseFloat(form.amount),
      account_id: form.account_id,
      category_id: form.category_id || null,
      description: form.description || null,
      date: form.date,
    }

    if (editing) {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', editing.id)
        .select('*, category:categories(*), account:accounts(*)')
        .single()
      if (!error && data) {
        setTransactions(prev => prev.map(t => t.id === editing.id ? data : t))
      }
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select('*, category:categories(*), account:accounts(*)')
        .single()
      if (!error && data) {
        setTransactions(prev => [data, ...prev])
        // Update account balance
        const account = accounts.find(a => a.id === form.account_id)
        if (account) {
          const delta = form.type === 'income' ? parseFloat(form.amount) : -parseFloat(form.amount)
          await supabase.from('accounts').update({ balance: account.balance + delta }).eq('id', account.id)
        }
      }
    }
    setLoading(false)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить транзакцию?')) return
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const filteredCategories = categories.filter(c => c.type === form.type)

  return (
    <>
      {/* Фильтры и кнопка добавления */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f ? (f === 'income' ? '#10b981' : f === 'expense' ? '#ef4444' : '#6366f1') : '#1a1a24',
                color: filter === f ? 'white' : '#9090a8',
                border: '1px solid',
                borderColor: filter === f ? 'transparent' : '#2a2a3a',
              }}
            >
              {f === 'all' ? 'Все' : f === 'income' ? 'Доходы' : 'Расходы'}
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: '#6366f1' }}
        >
          + Добавить
        </button>
      </div>

      {/* Список */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p style={{ color: '#9090a8' }}>Нет транзакций</p>
          </div>
        ) : (
          <div>
            {filtered.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #2a2a3a' : 'none' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: (t.category as Category)?.color ? (t.category as Category).color + '25' : '#6366f120', color: (t.category as Category)?.color ?? '#6366f1' }}>
                  {t.type === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {t.description || (t.category as Category)?.name || 'Без описания'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9090a8' }}>
                    {formatDate(t.date)} · {(t.account as Account)?.name} {(t.category as Category) ? `· ${(t.category as Category).name}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-sm mr-3 shrink-0" style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-xs hover:bg-white/10" style={{ color: '#9090a8' }}>✎</button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-xs hover:bg-red-500/20" style={{ color: '#ef4444' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно формы */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
            <h3 className="text-lg font-semibold text-white mb-5">
              {editing ? 'Редактировать' : 'Новая транзакция'}
            </h3>

            <div className="space-y-4">
              {/* Тип */}
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setForm(f => ({ ...f, type, category_id: '' }))}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: form.type === type ? (type === 'income' ? '#10b981' : '#ef4444') : '#0f0f13',
                      color: form.type === type ? 'white' : '#9090a8',
                      border: '1px solid',
                      borderColor: form.type === type ? 'transparent' : '#2a2a3a',
                    }}
                  >
                    {type === 'income' ? 'Доход' : 'Расход'}
                  </button>
                ))}
              </div>

              {/* Сумма */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Сумма ₽</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
                />
              </div>

              {/* Счёт */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Счёт</label>
                <select
                  value={form.account_id}
                  onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Выберите счёт</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Категория */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Категория</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Без категории</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Описание */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Описание</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Необязательно"
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a' }}
                />
              </div>

              {/* Дата */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9090a8' }}>Дата</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0f0f13', border: '1px solid #2a2a3a', colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#0f0f13', color: '#9090a8', border: '1px solid #2a2a3a' }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#6366f1' }}
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
