import { createClient } from '@/lib/supabase/server'
import ReportsCharts from '@/components/ReportsCharts'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user!.id).gte('date', startDate).order('date'),
    supabase.from('categories').select('*').eq('user_id', user!.id),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Отчёты</h1>
      <ReportsCharts transactions={transactions ?? []} categories={categories ?? []} />
    </div>
  )
}
