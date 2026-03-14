-- Create product reviews table (one review per user per product)
create table if not exists public.kumar_product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid not null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- Automatically bump updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kumar_product_reviews_updated_at on public.kumar_product_reviews;
create trigger trg_kumar_product_reviews_updated_at
before update on public.kumar_product_reviews
for each row execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.kumar_product_reviews enable row level security;

-- Policies:
-- Anyone can read reviews
drop policy if exists "reviews_select_all" on public.kumar_product_reviews;
create policy "reviews_select_all"
on public.kumar_product_reviews
for select
using (true);

-- Authenticated users can insert their own reviews
drop policy if exists "reviews_insert_own" on public.kumar_product_reviews;
create policy "reviews_insert_own"
on public.kumar_product_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

-- Authenticated users can update their own reviews
drop policy if exists "reviews_update_own" on public.kumar_product_reviews;
create policy "reviews_update_own"
on public.kumar_product_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Authenticated users can delete their own reviews
drop policy if exists "reviews_delete_own" on public.kumar_product_reviews;
create policy "reviews_delete_own"
on public.kumar_product_reviews
for delete
to authenticated
using (auth.uid() = user_id);

