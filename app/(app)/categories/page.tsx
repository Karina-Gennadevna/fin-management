import CategoriesManager from '@/components/CategoriesManager'

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('http') && !url.includes('placeholder')
}

export default async function CategoriesPage() {
  let categories: any[] = []
  let userId = 'demo'

  if (isSupabaseConfigured()) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name')
      categories = data ?? []
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Категории</h1>
      {!isSupabaseConfigured() && (
        <div className="mb-4 rounded-2xl p-4" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
          <p className="text-sm" style={{ color: '#f59e0b' }}>⚠ Режим превью — подключите Supabase для работы с данными</p>
        </div>
      )}
      <CategoriesManager initialCategories={categories} userId={userId} />
    </div>
  )
}
