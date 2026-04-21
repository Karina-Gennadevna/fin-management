import { createClient } from '@/lib/supabase/server'
import BudgetsManager from '@/components/BudgetsManager'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`

  const [{ data: budgets }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('budgets').select('*, category:categories(*)').eq('user_id', user!.id).eq('month', month).eq('year', year),
    supabase.from('categories').select('*').eq('user_id', user!.id).eq('type', 'expense'),
    supabase.from('transactions').select('*').eq('user_id', user!.id).eq('type', 'expense').gte('date', monthStart),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Бюджеты</h1>
      <p className="text-sm mb-6" style={{ color: '#9090a8' }}>Лимиты расходов на этот месяц</p>
      <BudgetsManager
        initialBudgets={budgets ?? []}
        categories={categories ?? []}
        transactions={transactions ?? []}
        userId={user!.id}
        month={month}
        year={year}
      />
    </div>
  )
}
