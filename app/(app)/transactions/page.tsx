import { createClient } from '@/lib/supabase/server'
import TransactionsList from '@/components/TransactionsList'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: transactions }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase.from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('accounts').select('*').eq('user_id', user!.id),
    supabase.from('categories').select('*').eq('user_id', user!.id),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Транзакции</h1>
      <TransactionsList
        initialTransactions={transactions ?? []}
        accounts={accounts ?? []}
        categories={categories ?? []}
        userId={user!.id}
      />
    </div>
  )
}
