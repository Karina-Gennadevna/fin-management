import TransactionsList from '@/components/TransactionsList'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('http') && !url.includes('placeholder')
}

export default async function TransactionsPage() {
  let transactions: any[] = []
  let accounts: any[] = []
  let categories: any[] = []
  let userId = 'demo'

  if (isSupabaseConfigured()) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const [t, a, c] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*), account:accounts(*)').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ])
      transactions = t.data ?? []
      accounts = a.data ?? []
      categories = c.data ?? []
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Транзакции</h1>
      {!isSupabaseConfigured() && (
        <div className="mb-4 rounded-2xl p-4" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
          <p className="text-sm" style={{ color: '#f59e0b' }}>⚠ Режим превью — подключите Supabase для работы с данными</p>
        </div>
      )}
      <TransactionsList
        initialTransactions={transactions}
        accounts={accounts}
        categories={categories}
        userId={userId}
      />
    </div>
  )
}
