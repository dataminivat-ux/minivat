# 05 — Database Schema (Supabase / PostgreSQL 16)

> Este documento define o schema completo do banco. **É a fonte da verdade para o Claude Code rodar as migrations.** Todo o SQL aqui está pronto para colar no Supabase SQL Editor ou em arquivos de migração `supabase/migrations/`.

## Princípios

1. **RLS obrigatório em toda tabela.** Nada exposto sem policy explícita.
2. **`auth.users` é a fonte primária de identidade.** Toda referência a usuário é via `auth.uid()`.
3. **IDs são UUID v4** (`gen_random_uuid()`). Pedidos têm também um `order_number` legível (`MVP-2026-000001`).
4. **`timestamptz` em tudo.** Nada de `timestamp` sem timezone.
5. **Soft-delete** via coluna `deleted_at timestamptz NULL` nas tabelas onde o histórico importa (produtos, categorias). Pedidos e pagamentos **nunca** se apagam.
6. **Triggers automáticos** para `updated_at` e numeração de pedidos.
7. **Preços em centavos (`integer`)** para evitar erros de ponto flutuante. Conversão pra reais só na camada de apresentação.

---

## 1. Extensões necessárias

```sql
create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "pg_trgm";         -- busca textual
create extension if not exists "unaccent";        -- busca sem acento
```

---

## 2. Enums

```sql
create type order_status as enum (
  'pending',        -- recém-criado, aguardando pagamento
  'paid',           -- pagamento aprovado
  'processing',     -- em separação/embalagem
  'shipped',        -- despachado
  'delivered',      -- entregue
  'cancelled',      -- cancelado
  'refunded'        -- estornado
);

create type payment_status as enum (
  'pending',
  'in_process',
  'approved',
  'authorized',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back'
);

create type payment_method as enum (
  'pix',
  'credit_card',
  'debit_card',
  'boleto',
  'apple_pay',
  'google_pay'
);

create type shipment_status as enum (
  'pending',
  'label_purchased',
  'posted',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'returned',
  'lost'
);

create type address_type as enum ('shipping', 'billing');

create type user_role as enum ('customer', 'admin', 'staff');
```

---

## 3. Tabelas

### 3.1 `profiles` — extensão de `auth.users`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  cpf text,                       -- só dígitos
  phone text,                     -- E.164: +5562999999999
  role user_role not null default 'customer',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role) where role <> 'customer';
```

### 3.2 `addresses`

```sql
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type address_type not null default 'shipping',
  recipient_name text not null,
  cep text not null,              -- só dígitos, 8 chars
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state char(2) not null,
  country char(2) not null default 'BR',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_idx on public.addresses(user_id);
create unique index addresses_user_default_unique
  on public.addresses(user_id, type)
  where is_default = true;
```

### 3.3 `categories`

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index categories_parent_idx on public.categories(parent_id);
create index categories_active_idx on public.categories(is_active) where is_active = true;
```

### 3.4 `products`

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  short_description text,
  description text,               -- markdown / rich text JSON
  category_id uuid references public.categories(id) on delete set null,
  brand text default 'MINI VAT PREMIUM',

  -- preço base (centavos)
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  cost_cents integer check (cost_cents >= 0),

  -- estoque agregado (variantes têm o próprio)
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,

  -- dimensões pra cálculo de frete (cm e g)
  weight_g integer not null default 0,
  width_cm integer not null default 0,
  height_cm integer not null default 0,
  length_cm integer not null default 0,

  -- flags
  is_active boolean not null default true,
  is_featured boolean not null default false,
  requires_shipping boolean not null default true,

  -- SEO
  seo_title text,
  seo_description text,
  seo_keywords text[],

  -- busca
  search_tsv tsvector
    generated always as (
      to_tsvector('portuguese',
        coalesce(name, '') || ' ' ||
        coalesce(short_description, '') || ' ' ||
        coalesce(description, '')
      )
    ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(is_active) where is_active = true;
create index products_featured_idx on public.products(is_featured) where is_featured = true;
create index products_search_idx on public.products using gin(search_tsv);
create index products_slug_idx on public.products(slug);
```

### 3.5 `product_images`

```sql
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id);
create unique index product_images_primary_unique
  on public.product_images(product_id) where is_primary = true;
```

### 3.6 `product_variants`

```sql
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,                -- ex: "Inox / Grande"
  options jsonb not null default '{}'::jsonb,  -- {material: "inox", size: "G"}
  price_cents integer check (price_cents >= 0),  -- override do preço base
  stock integer not null default 0 check (stock >= 0),
  weight_g integer,                  -- override
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants(product_id);
```

### 3.7 `orders`

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,           -- MVP-2026-000001 (trigger)
  user_id uuid references public.profiles(id) on delete set null,

  -- snapshot de contato (cliente pode mudar depois)
  customer_email text not null,
  customer_name text not null,
  customer_cpf text,
  customer_phone text,

  status order_status not null default 'pending',

  -- valores em centavos (snapshot — nunca recalcular após criar)
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null,

  -- frete
  shipping_method text,            -- ex: "PAC", "SEDEX"
  shipping_carrier text,           -- ex: "Correios", "Jadlog"
  shipping_service_id text,        -- ID do serviço no Melhor Envio
  shipping_estimated_days integer,

  -- endereços (snapshot completo)
  shipping_address jsonb not null,
  billing_address jsonb,

  -- cupom aplicado
  coupon_code text,
  coupon_id uuid,

  notes text,
  internal_notes text,             -- só admin

  -- timestamps de transição
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);
create index orders_email_idx on public.orders(customer_email);
```

### 3.8 `order_items`

```sql
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,

  -- snapshot do produto no momento da compra
  product_name text not null,
  product_sku text not null,
  variant_name text,
  product_image_url text,

  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),

  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);
```

### 3.9 `order_status_history`

```sql
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history(order_id, created_at desc);
```

### 3.10 `payments`

```sql
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  gateway text not null default 'mercadopago',
  gateway_payment_id text not null,         -- ID no Mercado Pago
  method payment_method not null,
  status payment_status not null default 'pending',

  amount_cents integer not null,
  installments integer not null default 1,

  -- payload completo do webhook (auditoria)
  gateway_payload jsonb,

  -- Pix
  qr_code text,
  qr_code_base64 text,
  pix_expires_at timestamptz,

  -- cartão
  card_last_four text,
  card_brand text,

  approved_at timestamptz,
  rejected_at timestamptz,
  refunded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_gateway_id_unique
  on public.payments(gateway, gateway_payment_id);
create index payments_order_idx on public.payments(order_id);
create index payments_status_idx on public.payments(status);
```

### 3.11 `shipments`

```sql
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  status shipment_status not null default 'pending',

  carrier text,                       -- "Correios", "Jadlog"
  service text,                       -- "PAC", "SEDEX"
  tracking_code text,
  tracking_url text,

  -- Melhor Envio
  me_label_id text,
  me_cart_id text,
  label_url text,
  label_purchased_at timestamptz,

  shipping_cents integer not null,
  insurance_cents integer not null default 0,

  posted_at timestamptz,
  delivered_at timestamptz,
  estimated_delivery_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_idx on public.shipments(order_id);
create index shipments_tracking_idx on public.shipments(tracking_code);
```

### 3.12 `coupons`

```sql
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_shipping')),
  discount_value integer not null check (discount_value >= 0),  -- % ou centavos

  min_purchase_cents integer not null default 0,
  max_discount_cents integer,         -- teto para %

  usage_limit integer,                -- total
  usage_limit_per_user integer,
  used_count integer not null default 0,

  starts_at timestamptz not null default now(),
  expires_at timestamptz,

  is_active boolean not null default true,
  applies_to_sale_items boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coupons_active_idx on public.coupons(is_active, expires_at)
  where is_active = true;
```

### 3.13 `coupon_usages`

```sql
create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  discount_applied_cents integer not null,
  created_at timestamptz not null default now()
);

create index coupon_usages_coupon_idx on public.coupon_usages(coupon_id);
create index coupon_usages_user_idx on public.coupon_usages(user_id);
```

### 3.14 `wishlist_items`

```sql
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlist_user_idx on public.wishlist_items(user_id);
```

### 3.15 `reviews`

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified_purchase boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_product_idx on public.reviews(product_id) where is_published = true;
```

### 3.16 `banners`

```sql
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  image_url_mobile text,
  link_url text,
  cta_label text,
  position text not null default 'home_hero',  -- home_hero, home_secondary, category_top
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index banners_position_active_idx
  on public.banners(position, is_active)
  where is_active = true;
```

### 3.17 `site_settings`

Chave/valor para configurações editáveis pelo admin (frete grátis, juros, etc.).

```sql
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- seeds iniciais
insert into public.site_settings (key, value, description) values
  ('free_shipping_threshold_cents', '20000', 'Valor mínimo para frete grátis (200 BRL)'),
  ('max_installments', '6', 'Parcelas máximas no cartão'),
  ('checkout_min_total_cents', '5000', 'Compra mínima (50 BRL)'),
  ('contact_whatsapp', '"+5562999429997"', 'WhatsApp de contato'),
  ('contact_email', '"vst2002@gmail.com"', 'E-mail de contato')
on conflict (key) do nothing;
```

### 3.18 `shipping_quotes_cache`

Cache de cotações por CEP+SKUs (5 min TTL).

```sql
create table public.shipping_quotes_cache (
  cache_key text primary key,         -- hash(cep+items)
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index shipping_cache_expires_idx on public.shipping_quotes_cache(expires_at);
```

### 3.19 `newsletter_subscribers`

```sql
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'storefront',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
```

---

## 4. Triggers e funções utilitárias

### 4.1 `updated_at` automático

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- aplicar em toda tabela com updated_at:
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('drop trigger if exists set_updated_at_trg on public.%I;', t);
    execute format('create trigger set_updated_at_trg before update on public.%I
      for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
```

### 4.2 Numeração de pedidos `MVP-YYYY-NNNNNN`

```sql
create sequence if not exists public.order_number_seq start 1;

create or replace function public.gen_order_number()
returns trigger language plpgsql as $$
declare
  n bigint;
begin
  if new.order_number is null or new.order_number = '' then
    n := nextval('public.order_number_seq');
    new.order_number := 'MVP-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger gen_order_number_trg
  before insert on public.orders
  for each row execute function public.gen_order_number();
```

### 4.3 Histórico automático de status do pedido

```sql
create or replace function public.log_order_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, from_status, to_status)
    values (new.id, null, new.status);
  elsif (new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger log_order_status_trg
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();
```

### 4.4 Helper `is_admin()`

```sql
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select role in ('admin', 'staff') from public.profiles where id = auth.uid()),
    false
  );
$$;
```

### 4.5 Validação de cupom (RPC)

```sql
create or replace function public.validate_coupon(
  p_code text,
  p_subtotal_cents integer,
  p_user_id uuid
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.coupons%rowtype;
  used_by_user int;
  discount int := 0;
begin
  select * into c from public.coupons
   where upper(code) = upper(p_code) and is_active = true
   limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;
  if c.starts_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'NOT_STARTED');
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'EXPIRED');
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('ok', false, 'reason', 'LIMIT_REACHED');
  end if;
  if p_subtotal_cents < c.min_purchase_cents then
    return jsonb_build_object('ok', false, 'reason', 'BELOW_MIN');
  end if;
  if c.usage_limit_per_user is not null and p_user_id is not null then
    select count(*) into used_by_user
      from public.coupon_usages where coupon_id = c.id and user_id = p_user_id;
    if used_by_user >= c.usage_limit_per_user then
      return jsonb_build_object('ok', false, 'reason', 'USER_LIMIT');
    end if;
  end if;

  if c.discount_type = 'percentage' then
    discount := (p_subtotal_cents * c.discount_value) / 100;
    if c.max_discount_cents is not null and discount > c.max_discount_cents then
      discount := c.max_discount_cents;
    end if;
  elsif c.discount_type = 'fixed' then
    discount := least(c.discount_value, p_subtotal_cents);
  end if;

  return jsonb_build_object(
    'ok', true,
    'coupon_id', c.id,
    'discount_cents', discount,
    'discount_type', c.discount_type,
    'free_shipping', c.discount_type = 'free_shipping'
  );
end;
$$;
```

---

## 5. RLS — Row Level Security

> **Habilitar RLS em TODAS as tabelas é não-negociável.** Service Role bypassa RLS — usar apenas em rotas server-side com chave `SUPABASE_SERVICE_ROLE_KEY`.

```sql
-- 5.1 habilitar
alter table public.profiles                enable row level security;
alter table public.addresses               enable row level security;
alter table public.categories              enable row level security;
alter table public.products                enable row level security;
alter table public.product_images          enable row level security;
alter table public.product_variants        enable row level security;
alter table public.orders                  enable row level security;
alter table public.order_items             enable row level security;
alter table public.order_status_history    enable row level security;
alter table public.payments                enable row level security;
alter table public.shipments               enable row level security;
alter table public.coupons                 enable row level security;
alter table public.coupon_usages           enable row level security;
alter table public.wishlist_items          enable row level security;
alter table public.reviews                 enable row level security;
alter table public.banners                 enable row level security;
alter table public.site_settings           enable row level security;
alter table public.shipping_quotes_cache   enable row level security;
alter table public.newsletter_subscribers  enable row level security;
```

### 5.2 Policies

```sql
-- profiles
create policy "user sees own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "user updates own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin manages profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- addresses
create policy "user manages own addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin reads addresses" on public.addresses
  for select using (public.is_admin());

-- catálogo (público pode ler ativos)
create policy "anyone reads active categories" on public.categories
  for select using (is_active = true and deleted_at is null);
create policy "admin manages categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads active products" on public.products
  for select using (is_active = true and deleted_at is null);
create policy "admin manages products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads product images" on public.product_images
  for select using (true);
create policy "admin manages product images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads active variants" on public.product_variants
  for select using (is_active = true);
create policy "admin manages variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: cliente vê os próprios; admin vê tudo. Inserts vão sempre via API server (service role).
create policy "user reads own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "admin updates orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
-- inserts NUNCA pelo cliente; só service role.

create policy "user reads own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "user reads own status history" on public.order_status_history
  for select using (
    exists (select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "user reads own payments" on public.payments
  for select using (
    exists (select 1 from public.orders o
      where o.id = payments.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "user reads own shipments" on public.shipments
  for select using (
    exists (select 1 from public.orders o
      where o.id = shipments.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );

-- coupons
create policy "anyone reads active coupons (limited)" on public.coupons
  for select using (is_active = true);
create policy "admin manages coupons" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin reads coupon usages" on public.coupon_usages
  for select using (public.is_admin());

-- wishlist
create policy "user manages own wishlist" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews
create policy "anyone reads published reviews" on public.reviews
  for select using (is_published = true or auth.uid() = user_id or public.is_admin());
create policy "user creates own review" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "admin manages reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- banners
create policy "anyone reads active banners" on public.banners
  for select using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
create policy "admin manages banners" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- settings
create policy "anyone reads public settings" on public.site_settings
  for select using (true);
create policy "admin manages settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- newsletter
create policy "anyone subscribes" on public.newsletter_subscribers
  for insert with check (true);
create policy "admin reads newsletter" on public.newsletter_subscribers
  for select using (public.is_admin());
```

---

## 6. Views úteis

```sql
create or replace view public.products_with_default_price as
select
  p.*,
  pi.url as primary_image_url,
  c.slug as category_slug,
  c.name as category_name
from public.products p
left join public.product_images pi
  on pi.product_id = p.id and pi.is_primary = true
left join public.categories c on c.id = p.category_id
where p.deleted_at is null;
```

---

## 7. Seeds de desenvolvimento

```sql
-- categoria
insert into public.categories (slug, name, description, sort_order) values
  ('mini-vat', 'Mini VAT', 'Cubetas para impressoras 3D odontológicas', 1),
  ('mesas', 'Mesas de impressão', 'Plataformas de impressão', 2),
  ('acessorios', 'Acessórios', 'Itens complementares', 3)
on conflict (slug) do nothing;

-- produto exemplo
insert into public.products
  (sku, slug, name, short_description, price_cents, stock, weight_g, is_active, is_featured, category_id)
select
  'MVP-INOX-G', 'mini-vat-premium-inox', 'Mini VAT PREMIUM Inox',
  'Cubeta em aço inox 316, durabilidade superior, encaixe perfeito.',
  129900, 50, 180, true, true,
  (select id from public.categories where slug = 'mini-vat')
on conflict (sku) do nothing;
```

---

## 8. Gerando os tipos TypeScript

```bash
# após cada migration:
supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/database.types.ts
```

Importar como:

```ts
import { Database } from "@/lib/supabase/database.types";
type Product = Database["public"]["Tables"]["products"]["Row"];
```

---

## 9. Pendências da Fase 2

- Tabelas de `tax_invoices` (NF-e via WebmaniaBR) com chave de acesso, XML, status SEFAZ.
- `affiliates` e `affiliate_clicks` quando o programa de afiliados entrar.
- `products_i18n` para localização EN/ES.
- `multi_currency_prices` quando vier Stripe + USD/EUR.
- Tabela `audit_log` genérica para PIIs editadas no admin.
