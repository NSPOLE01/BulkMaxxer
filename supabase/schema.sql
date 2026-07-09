create table if not exists food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  food_name text not null,
  calories numeric not null default 0,
  protein numeric not null default 0,
  sodium numeric not null default 0,
  sugar numeric not null default 0,
  fat numeric not null default 0,
  serving_size text,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table food_log enable row level security;

create policy "Users manage own log"
  on food_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index food_log_user_eaten on food_log(user_id, eaten_at desc);
