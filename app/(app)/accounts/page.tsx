import { createClient } from '@/lib/supabase/server'
import AccountsManager from '@/components/AccountsManager'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', user!.id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Счета</h1>
      <AccountsManager initialAccounts={accounts ?? []} userId={user!.id} />
    </div>
  )
}
