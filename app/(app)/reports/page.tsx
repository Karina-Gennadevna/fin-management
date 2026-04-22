import ReportsCharts from '@/components/ReportsCharts'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('http') && !url.includes('placeholder')
}

export default async function ReportsPage() {
  let transactions: any[] = []
  let categories: any[] = []

  if (isSupabaseConfigured()) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`
      const [t, c] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id).gte('date', startDate).order('date'),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ])
      transactions = t.data ?? []
      categories = c.data ?? []
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Отчёты</h1>
      {!isSupabaseConfigured() && (
        <div className="mb-4 rounded-2xl p-4" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
          <p className="text-sm" style={{ color: '#f59e0b' }}>⚠ Режим превью — подключите Supabase для работы с данными</p>
        </div>
      )}
      <ReportsCharts transactions={transactions} categories={categories} />
    </div>
  )
}
