import { createClient } from '@/lib/supabase/server'
import GoalsManager from '@/components/GoalsManager'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user!.id).order('created_at')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Цели</h1>
      <p className="text-sm mb-6" style={{ color: '#9090a8' }}>Копилки и накопления</p>
      <GoalsManager initialGoals={goals ?? []} userId={user!.id} />
    </div>
  )
}
