import BudgetsManager from '@/components/BudgetsManager'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('http') && !url.includes('placeholder')
}

export default async function BudgetsPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`

  let budgets: any[] = []
  let categories: any[] = []
  let transactions: any[] = []
  let userId = 'demo'

  if (isSupabaseConfigured()) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const [b, c, t] = await Promise.all([
        supabase.from('budgets').select('*, category:categories(*)').eq('user_id', user.id).eq('month', month).eq('year', year),
        supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense'),
        supabase.from('transactions').select('*').eq('user_id', user.id).eq('type', 'expense').gte('date', monthStart),
      ])
      budgets = b.data ?? []
      categories = c.data ?? []
      transactions = t.data ?? []
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Бюджеты</h1>
      <p className="text-sm mb-6" style={{ color: '#9090a8' }}>Лимиты расходов на этот месяц</p>
      {!isSupabaseConfigured() && (
        <div className="mb-4 rounded-2xl p-4" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
          <p className="text-sm" style={{ color: '#f59e0b' }}>⚠ Режим превью — подключите Supabase для работы с данными</p>
        </div>
      )}
      <BudgetsManager initialBudgets={budgets} categories={categories} transactions={transactions} userId={userId} month={month} year={year} />
    </div>
  )
}
