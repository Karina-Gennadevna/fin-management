-- Таблица счетов (кошельков)
create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null default 'card', -- card, cash, savings, investment
  balance decimal(12,2) not null default 0,
  currency text not null default 'RUB',
  color text not null default '#6366f1',
  icon text not null default 'wallet',
  created_at timestamptz default now()
);

-- Таблица категорий
create table categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null, -- income, expense
  color text not null default '#6366f1',
  icon text not null default 'tag',
  created_at timestamptz default now()
);

-- Таблица транзакций
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  type text not null, -- income, expense, transfer
  amount decimal(12,2) not null,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Таблица бюджетов
create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  amount decimal(12,2) not null,
  month int not null, -- 1-12
  year int not null,
  created_at timestamptz default now(),
  unique(user_id, category_id, month, year)
);

-- Таблица целей (копилки)
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount decimal(12,2) not null,
  current_amount decimal(12,2) not null default 0,
  deadline date,
  color text not null default '#6366f1',
  icon text not null default 'target',
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;

-- Политики: каждый видит только своё
create policy "users_own_accounts" on accounts for all using (auth.uid() = user_id);
create policy "users_own_categories" on categories for all using (auth.uid() = user_id);
create policy "users_own_transactions" on transactions for all using (auth.uid() = user_id);
create policy "users_own_budgets" on budgets for all using (auth.uid() = user_id);
create policy "users_own_goals" on goals for all using (auth.uid() = user_id);

-- Дефолтные категории расходов (вставляются через функцию при регистрации)
create or replace function create_default_categories()
returns trigger language plpgsql security definer as $$
begin
  insert into categories (user_id, name, type, color, icon) values
    (new.id, 'Еда и продукты', 'expense', '#f97316', 'shopping-cart'),
    (new.id, 'Кафе и рестораны', 'expense', '#fb923c', 'utensils'),
    (new.id, 'Транспорт', 'expense', '#3b82f6', 'car'),
    (new.id, 'Жильё и ЖКХ', 'expense', '#8b5cf6', 'home'),
    (new.id, 'Здоровье', 'expense', '#ef4444', 'heart'),
    (new.id, 'Одежда', 'expense', '#ec4899', 'shirt'),
    (new.id, 'Развлечения', 'expense', '#a855f7', 'film'),
    (new.id, 'Образование', 'expense', '#06b6d4', 'book'),
    (new.id, 'Спорт', 'expense', '#22c55e', 'dumbbell'),
    (new.id, 'Связь и интернет', 'expense', '#64748b', 'smartphone'),
    (new.id, 'Зарплата', 'income', '#10b981', 'banknote'),
    (new.id, 'Фриланс', 'income', '#14b8a6', 'laptop'),
    (new.id, 'Инвестиции', 'income', '#f59e0b', 'trending-up'),
    (new.id, 'Подарки', 'income', '#d946ef', 'gift');

  insert into accounts (user_id, name, type, balance, color, icon) values
    (new.id, 'Основная карта', 'card', 0, '#6366f1', 'credit-card'),
    (new.id, 'Наличные', 'cash', 0, '#22c55e', 'banknote');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_default_categories();
