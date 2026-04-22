import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function send(chatId: number, text: string, replyMarkup?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup }),
  })
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  })
}

async function answerCallback(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Обработка нажатия кнопки "Отменить"
  if (body.callback_query) {
    const query = body.callback_query
    const chatId: number = query.message.chat.id
    const messageId: number = query.message.message_id
    const data: string = query.data

    if (data.startsWith('cancel:')) {
      const transactionId = data.replace('cancel:', '')

      // Получаем транзакцию перед удалением
      const { data: tx } = await supabase
        .from('transactions')
        .select('amount, type, account_id')
        .eq('id', transactionId)
        .single()

      if (tx) {
        // Возвращаем баланс
        const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single()
        if (acc) {
          const delta = tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount)
          await supabase.from('accounts').update({ balance: Number(acc.balance) + delta }).eq('id', tx.account_id)
        }
        await supabase.from('transactions').delete().eq('id', transactionId)
        await editMessage(chatId, messageId, '↩️ <i>Запись отменена, баланс восстановлен</i>')
      } else {
        await editMessage(chatId, messageId, '❌ <i>Запись уже была удалена</i>')
      }

      await answerCallback(query.id, 'Отменено')
    }
    return NextResponse.json({ ok: true })
  }

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

  // Ищем категорию, если нет — создаём автоматически
  let cat = categories?.find(c => c.name === parsed.category_name)
  let isNewCategory = false

  if (!cat && parsed.category_name) {
    const colors = ['#C4A56A','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#22c55e','#14b8a6','#f97316']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const { data: newCat } = await supabase.from('categories').insert({
      user_id: userId,
      name: parsed.category_name,
      type: parsed.type,
      color: randomColor,
      icon: 'tag',
    }).select().single()
    if (newCat) { cat = newCat; isNewCategory = true }
  }

  const account = accounts[0]

  const { data: newTx, error: insertError } = await supabase.from('transactions').insert({
    user_id: userId,
    account_id: account.id,
    category_id: cat?.id ?? null,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description ?? null,
    date: new Date().toISOString().split('T')[0],
  }).select('id').single()

  if (insertError || !newTx) {
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

  await send(
    chatId,
    `${emoji} <b>${sign}${amount} ₽</b>\n${parsed.description}${cat ? ` · ${cat.name}` : ''}${isNewCategory ? ' <i>(новая категория)</i>' : ''}\n\n<i>${account.name}: ${newBalance} ₽</i>`,
    { inline_keyboard: [[{ text: '↩️ Отменить', callback_data: `cancel:${newTx.id}` }]] }
  )

  return NextResponse.json({ ok: true })
}
