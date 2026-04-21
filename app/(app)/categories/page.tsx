import { createClient } from '@/lib/supabase/server'
import CategoriesManager from '@/components/CategoriesManager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: categories } = await supabase.from('categories').select('*').eq('user_id', user!.id).order('name')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Категории</h1>
      <CategoriesManager initialCategories={categories ?? []} userId={user!.id} />
    </div>
  )
}
