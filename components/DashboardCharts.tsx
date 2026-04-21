'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export default function DashboardCharts({ income, expense }: { income: number; expense: number }) {
  const data = [
    { name: 'Доходы', value: income, color: '#10b981' },
    { name: 'Расходы', value: expense, color: '#ef4444' },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-center" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
        <p className="text-sm" style={{ color: '#9090a8' }}>Нет данных за этот месяц</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
      <h2 className="font-semibold text-white mb-4">Доходы vs расходы</h2>
      <div className="flex items-center gap-4">
        <div style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f1f3' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-sm" style={{ color: '#9090a8' }}>{d.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{formatCurrency(d.value)}</span>
            </div>
          ))}
          {income > 0 && expense > 0 && (
            <div className="pt-2 mt-2 border-t" style={{ borderColor: '#2a2a3a' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#9090a8' }}>Остаток</span>
                <span className="text-sm font-semibold" style={{ color: income - expense >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(income - expense)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
