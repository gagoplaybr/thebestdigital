-- THE BEST DIGITAL V6 - Área Premium
create extension if not exists pgcrypto;
create table if not exists public.customer_access (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_id text not null,
  active boolean not null default true,
  invoice_id text,
  buyer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, product_id)
);
create table if not exists public.saved_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text default '',
  cost numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_access enable row level security;
alter table public.saved_products enable row level security;
drop policy if exists customer_access_read_own on public.customer_access;
create policy customer_access_read_own on public.customer_access for select to authenticated using (lower(email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists saved_products_select_premium on public.saved_products;
create policy saved_products_select_premium on public.saved_products for select to authenticated using (user_id=auth.uid() and exists (select 1 from public.customer_access ca where lower(ca.email)=lower(coalesce(auth.jwt()->>'email','')) and ca.product_id='3103335' and ca.active=true));
drop policy if exists saved_products_insert_premium on public.saved_products;
create policy saved_products_insert_premium on public.saved_products for insert to authenticated with check (user_id=auth.uid() and exists (select 1 from public.customer_access ca where lower(ca.email)=lower(coalesce(auth.jwt()->>'email','')) and ca.product_id='3103335' and ca.active=true));
drop policy if exists saved_products_delete_premium on public.saved_products;
create policy saved_products_delete_premium on public.saved_products for delete to authenticated using (user_id=auth.uid() and exists (select 1 from public.customer_access ca where lower(ca.email)=lower(coalesce(auth.jwt()->>'email','')) and ca.product_id='3103335' and ca.active=true));
create index if not exists idx_customer_access_email_product on public.customer_access(lower(email),product_id);
create index if not exists idx_saved_products_user on public.saved_products(user_id,created_at desc);
