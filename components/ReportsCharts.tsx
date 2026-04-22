'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { formatCurrency, getMonthName } from '@/lib/utils'
import type { Transaction, Category } from '@/lib/types'

interface Props {
  transactions: Transaction[]
  categories: Category[]
}

const currencyFormatter = (v: unknown) => formatCurrency(Number(v ?? 0))

export default function ReportsCharts({ transactions }: Props) {
  const monthMap: Record<string, { month: string; income: number; expense: number }> = {}
  transactions.forEach(t => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    if (!monthMap[key]) {
      monthMap[key] = { month: `${getMonthName(d.getMonth() + 1).slice(0, 3)} ${d.getFullYear()}`, income: 0, expense: 0 }
    }
    if (t.type === 'income') monthMap[key].income += Number(t.amount)
    if (t.type === 'expense') monthMap[key].expense += Number(t.amount)
  })
  const monthData = Object.values(monthMap)

  const catMap: Record<string, { name: string; value: number; color: string }> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category as Category
    if (!cat) return
    if (!catMap[cat.id]) catMap[cat.id] = { name: cat.name, value: 0, color: cat.color }
    catMap[cat.id].value += Number(t.amount)
  })
  const catData = Object.values(catMap).sort((a, b) => b.value - a.value).slice(0, 8)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const tooltipStyle = { background: '#111111', border: '1px solid #1E1E1E', borderRadius: 8, color: '#f1f1f3' }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Доходы за 6 месяцев', value: formatCurrency(totalIncome), color: '#10b981' },
          { label: 'Расходы за 6 месяцев', value: formatCurrency(totalExpense), color: '#ef4444' },
          { label: 'Сальдо', value: formatCurrency(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
            <p className="text-xs mb-1" style={{ color: '#666666' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
        <h2 className="font-semibold text-white mb-4">Доходы и расходы по месяцам</h2>
        {monthData.length === 0 ? (
          <p className="text-sm" style={{ color: '#666666' }}>Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: '#666666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={currencyFormatter} />
              <Bar dataKey="income" name="Доходы" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#111111', border: '1px solid #1E1E1E' }}>
        <h2 className="font-semibold text-white mb-4">Расходы по категориям</h2>
        {catData.length === 0 ? (
          <p className="text-sm" style={{ color: '#666666' }}>Нет данных</p>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div style={{ width: 200, height: 200, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" outerRadius={90} dataKey="value" strokeWidth={0}>
                    {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={currencyFormatter} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {catData.map(c => {
                const pct = totalExpense > 0 ? ((c.value / totalExpense) * 100).toFixed(0) : '0'
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-white">{c.name}</span>
                      </div>
                      <span style={{ color: '#666666' }}>{formatCurrency(c.value)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0A0A0A' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
