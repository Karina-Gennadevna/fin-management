import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function send(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const message = body.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const chatId: number = message.chat.id
  const telegramId: number = message.from.id
  const text: string = message.text.trim()

  // /start — привязка аккаунта
  if (text.startsWith('/start')) {
    const email = text.replace('/start', '').trim()
    if (!email || !email.includes('@')) {
      await send(chatId,
        '👋 Привет! Я помогу записывать расходы и доходы.\n\nДля начала привяжи аккаунт — напиши:\n<code>/start твой@email.com</code>'
      )
      return NextResponse.json({ ok: true })
    }

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)

    if (!user) {
      await send(chatId, '❌ Аккаунт с таким email не найден.\n\nСначала зарегистрируйся на сайте, потом возвращайся сюда.')
      return NextResponse.json({ ok: true })
    }

    await supabase.from('telegram_links').upsert({ telegram_id: telegramId, user_id: user.id })
    await send(chatId,
      '✅ <b>Аккаунт подключён!</b>\n\nТеперь просто пиши мне:\n• "потратила 500 на кофе"\n• "зарплата 80000"\n• "1200 продукты"\n\nИли пересылай уведомления от банка — разберу сам 🤖'
    )
    return NextResponse.json({ ok: true })
  }

  // Проверяем привязку
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single()

  if (!link) {
    await send(chatId, 'Сначала привяжи аккаунт:\n<code>/start твой@email.com</code>')
    return NextResponse.json({ ok: true })
  }

  const userId = link.user_id

  // Загружаем категории и счёт пользователя
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from('categories').select('id, name, type').eq('user_id', userId),
    supabase.from('accounts').select('id, name').eq('user_id', userId).limit(1),
  ])

  if (!accounts?.length) {
    await send(chatId, '❌ Нет счетов. Создай счёт в приложении.')
    return NextResponse.json({ ok: true })
  }

  const categoryList = categories?.map(c => `${c.name} (${c.type})`).join(', ') ?? ''

  // Разбираем сообщение через Claude
  const aiResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Разбери финансовую транзакцию из текста. Верни ТОЛЬКО валидный JSON без markdown и пояснений.

Текст пользователя: "${text}"
Доступные категории: ${categoryList}

Правила:
- type: "expense" для трат, "income" для поступлений
- amount: число (только цифры, без символов)
- description: краткое описание на русском
- category_name: ТОЧНОЕ название из списка категорий или null

Формат: {"type":"expense","amount":500,"description":"Кофе","category_name":"Кафе и рестораны"}
Если не понял: {"error":"не понял"}`
    }],
  })

  let parsed: { type?: string; amount?: number; description?: string; category_name?: string | null; error?: string }
  try {
    let raw = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text.trim() : ''
    // Убираем markdown-обёртку если Claude вернул ```json ... ```
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(raw)
  } catch {
    await send(chatId, '❌ Не понял. Попробуй написать иначе:\n• "500 кофе"\n• "потратила 1200 на продукты"\n• "зарплата 60000"')
    return NextResponse.json({ ok: true })
  }

  if (parsed.error || !parsed.amount || !parsed.type) {
    await send(chatId, '❌ Не смог разобрать сумму. Напиши например:\n• "350 кафе"\n• "зарплата 50000"')
    return NextResponse.json({ ok: true })
  }

  const cat = categories?.find(c => c.name === parsed.category_name)
  const account = accounts[0]

  const { error: insertError } = await supabase.from('transactions').insert({
    user_id: userId,
    account_id: account.id,
    category_id: cat?.id ?? null,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description ?? null,
    date: new Date().toISOString().split('T')[0],
  })

  if (insertError) {
    await send(chatId, '❌ Ошибка сохранения. Попробуй ещё раз.')
    return NextResponse.json({ ok: true })
  }

  // Обновляем баланс счёта
  const delta = parsed.type === 'income' ? Number(parsed.amount) : -Number(parsed.amount)
  const { data: freshAccount } = await supabase.from('accounts').select('balance').eq('id', account.id).single()
  if (freshAccount) {
    await supabase.from('accounts').update({ balance: Number(freshAccount.balance) + delta }).eq('id', account.id)
  }

  const emoji = parsed.type === 'income' ? '📈' : '📉'
  const sign = parsed.type === 'income' ? '+' : '−'
  const amount = Number(parsed.amount).toLocaleString('ru-RU')
  const newBalance = freshAccount ? (Number(freshAccount.balance) + delta).toLocaleString('ru-RU') : '—'

  await send(chatId,
    `${emoji} <b>${sign}${amount} ₽</b>\n${parsed.description}${cat ? ` · ${cat.name}` : ''}\n\n<i>${account.name}: ${newBalance} ₽</i>`
  )

  return NextResponse.json({ ok: true })
}
