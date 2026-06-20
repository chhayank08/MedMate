-- Web Push subscription storage.
-- Each browser/device registers its own PushSubscription object here.
-- One user can have multiple subscriptions (phone + laptop + etc.).

create table if not exists push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth        text        not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Owners can only see and manage their own subscriptions.
alter table push_subscriptions enable row level security;

drop policy if exists "owner can select push_subscriptions" on push_subscriptions;
drop policy if exists "owner can insert push_subscriptions" on push_subscriptions;
drop policy if exists "owner can delete push_subscriptions" on push_subscriptions;

create policy "owner can select push_subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "owner can insert push_subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "owner can delete push_subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Service-role (cron) needs to read all subscriptions to fan out notifications.
-- Granted implicitly by the service role bypassing RLS. No extra policy needed.

-- Index for fast per-user lookup.
create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);
