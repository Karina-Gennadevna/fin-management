'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

const COLORS = ['#C4A56A','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#22c55e','#14b8a6','#f97316','#64748b','#d946ef']
const emptyForm = { name: '', type: 'expense' as 'income' | 'expense', color: '#C4A56A' }

export default function CategoriesManager({ initialCategories, userId }: { initialCategories: Category[]; userId: string }) {
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const supabase = createClient()

  const filtered = categories.filter(c => c.type === tab)

  function openNew() { setForm({ ...emptyForm, type: tab }); setEditing(null); setShowForm(true) }
  function openEdit(c: Category) {
    setForm({ name: c.name, type: c.type as 'income' | 'expense', color: c.color })
    setEditing(c); setShowForm(true)
  }

  async function handleSave() {
    if (!form.name) return
    setLoading(true)
    const payload = { user_id: userId, name: form.name, type: form.type, color: form.color, icon: 'tag' }
    if (editing) {
      const { data } = await supabase.from('categories').update(payload).eq('id', editing.id).select().single()
      if (data) setCategories(prev => prev.map(c => c.id === editing.id ? data : c))
    } else {
      const { data } = await supabase.from('categories').insert(payload).select().single()
      if (data) setCategories(prev => [...prev, data])
    }
    setLoading(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить категорию?')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        {(['expense', 'income'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === t ? '#C4A56A' : '#111111', color: tab === t ? 'white' : '#666666', border: '1px solid', borderColor: tab === t ? 'transparent' : '#1E1E1E' }}>
            {t === 'expense' ? 'Расходы' : 'Доходы'}
          </button>
        ))}
        <button onClick={openNew} className="ml-auto px-4 py-1.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#C4A56A' }}>
          + Добавить
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center"><p style={{ color: '#666666' }}>Нет категорий</p></div>
        ) : (
          filtered.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1E1E1E' : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                style={{ background: c.color + '25', color: c.color }}>●</div>
              <span className="flex-1 text-sm font-medium text-white">{c.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-xs hover:bg-white/10" style={{ color: '#666666' }}>✎</button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-xs hover:bg-red-500/20" style={{ color: '#ef4444' }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <h3 className="text-lg font-semibold text-white mb-5">{editing ? 'Редактировать' : 'Новая категория'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Тип</label>
                <div className="flex gap-2">
                  {(['expense', 'income'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="flex-1 py-2 rounded-xl text-sm font-medium"
                      style={{ background: form.type === t ? '#C4A56A' : '#0A0A0A', color: form.type === t ? 'white' : '#666666', border: '1px solid', borderColor: form.type === t ? 'transparent' : '#1E1E1E' }}>
                      {t === 'expense' ? 'Расход' : 'Доход'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#666666' }}>Название</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Название категории" className="w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  style={{ background: '#0A0A0A', border: '1px solid #1E1E1E' }} />
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
    </>
  )
}
