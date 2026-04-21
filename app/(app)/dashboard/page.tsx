import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import DashboardCharts from '@/components/DashboardCharts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`

  const [
    { data: accounts },
    { data: transactions },
    { data: monthTransactions },
  ] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user!.id),
    supabase.from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(8),
    supabase.from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', monthStart),
  ])

  const totalBalance = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0)
  const monthIncome = (monthTransactions ?? [])
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const monthExpense = (monthTransactions ?? [])
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Главная</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9090a8' }}>
          {months[month - 1]} {year}
        </p>
      </div>

      {/* Карточки сводки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Общий баланс"
          value={formatCurrency(totalBalance)}
          color="#6366f1"
          icon="◈"
        />
        <StatCard
          label="Доходы за месяц"
          value={formatCurrency(monthIncome)}
          color="#10b981"
          icon="↑"
          positive
        />
        <StatCard
          label="Расходы за месяц"
          value={formatCurrency(monthExpense)}
          color="#ef4444"
          icon="↓"
          negative
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Счета */}
        <div className="rounded-2xl p-5" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
          <h2 className="font-semibold text-white mb-4">Счета</h2>
          {(accounts ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: '#9090a8' }}>Нет счетов</p>
          ) : (
            <div className="space-y-3">
              {(accounts ?? []).map(acc => (
                <div key={acc.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
                      style={{ background: acc.color + '30', border: `1px solid ${acc.color}40` }}>
                      ◈
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{acc.name}</p>
                      <p className="text-xs" style={{ color: '#9090a8' }}>{acc.type === 'card' ? 'Карта' : acc.type === 'cash' ? 'Наличные' : acc.type === 'savings' ? 'Накопления' : 'Инвестиции'}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(acc.balance, acc.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* График */}
        <DashboardCharts income={monthIncome} expense={monthExpense} />
      </div>

      {/* Последние транзакции */}
      <div className="rounded-2xl p-5" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Последние транзакции</h2>
          <a href="/transactions" className="text-xs hover:underline" style={{ color: '#6366f1' }}>
            Все →
          </a>
        </div>
        {(transactions ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: '#9090a8' }}>Нет транзакций</p>
        ) : (
          <div className="space-y-2">
            {(transactions ?? []).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#2a2a3a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: t.category?.color ? t.category.color + '25' : '#6366f120', color: t.category?.color ?? '#6366f1' }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.description || t.category?.name || 'Без описания'}</p>
                    <p className="text-xs" style={{ color: '#9090a8' }}>{formatShortDate(t.date)} · {t.account?.name}</p>
                  </div>
                </div>
                <span className="font-semibold text-sm" style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon, positive, negative }: {
  label: string
  value: string
  color: string
  icon: string
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#1a1a24', border: '1px solid #2a2a3a' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm" style={{ color: '#9090a8' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + '25', color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: positive ? '#10b981' : negative ? '#ef4444' : 'white' }}>
        {value}
      </p>
    </div>
  )
}
