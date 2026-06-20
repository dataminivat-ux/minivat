-- =====================================================================
-- MINI VAT PREMIUM — Checkout (0003)
-- Aditivo: funcao de criacao de pedido (atomica, com decremento de estoque)
-- + tabela de idempotencia de webhooks. NAO altera tabelas existentes.
-- Rodar APOS 0001.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Idempotencia de webhooks (Mercado Pago etc.)
-- ---------------------------------------------------------------------
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;
-- Sem policies: somente service_role (que bypassa RLS) acessa.

-- ---------------------------------------------------------------------
-- 2. create_order_with_items
--    Cria orders + order_items e decrementa estoque em uma transacao.
--    p_order: jsonb com os campos do pedido (snapshot).
--    p_items: jsonb array [{product_id, variant_id, product_name,
--             product_sku, variant_name, product_image_url, quantity,
--             unit_price_cents}]
--    Lanca excecao 'INSUFFICIENT_STOCK:<id>' se faltar estoque (rollback).
-- ---------------------------------------------------------------------
create or replace function public.create_order_with_items(
  p_order jsonb,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  it jsonb;
  v_qty int;
  v_affected int;
begin
  insert into public.orders (
    user_id, customer_email, customer_name, customer_cpf, customer_phone,
    status, subtotal_cents, discount_cents, shipping_cents, total_cents,
    shipping_method, shipping_carrier, shipping_service_id,
    shipping_estimated_days, shipping_address, billing_address,
    coupon_code, coupon_id
  ) values (
    nullif(p_order->>'user_id', '')::uuid,
    p_order->>'customer_email',
    p_order->>'customer_name',
    nullif(p_order->>'customer_cpf', ''),
    nullif(p_order->>'customer_phone', ''),
    'pending',
    (p_order->>'subtotal_cents')::int,
    coalesce((p_order->>'discount_cents')::int, 0),
    coalesce((p_order->>'shipping_cents')::int, 0),
    (p_order->>'total_cents')::int,
    nullif(p_order->>'shipping_method', ''),
    nullif(p_order->>'shipping_carrier', ''),
    nullif(p_order->>'shipping_service_id', ''),
    nullif(p_order->>'shipping_estimated_days', '')::int,
    p_order->'shipping_address',
    p_order->'billing_address',
    nullif(p_order->>'coupon_code', ''),
    nullif(p_order->>'coupon_id', '')::uuid
  )
  returning * into v_order;

  for it in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (it->>'quantity')::int;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_sku,
      variant_name, product_image_url, quantity, unit_price_cents, total_cents
    ) values (
      v_order.id,
      nullif(it->>'product_id', '')::uuid,
      nullif(it->>'variant_id', '')::uuid,
      it->>'product_name',
      it->>'product_sku',
      nullif(it->>'variant_name', ''),
      nullif(it->>'product_image_url', ''),
      v_qty,
      (it->>'unit_price_cents')::int,
      v_qty * (it->>'unit_price_cents')::int
    );

    if nullif(it->>'variant_id', '') is not null then
      update public.product_variants
        set stock = stock - v_qty
        where id = (it->>'variant_id')::uuid and stock >= v_qty;
      get diagnostics v_affected = row_count;
      if v_affected = 0 then
        raise exception 'INSUFFICIENT_STOCK:%', it->>'variant_id';
      end if;
    else
      update public.products
        set stock = stock - v_qty
        where id = (it->>'product_id')::uuid and stock >= v_qty;
      get diagnostics v_affected = row_count;
      if v_affected = 0 then
        raise exception 'INSUFFICIENT_STOCK:%', it->>'product_id';
      end if;
    end if;
  end loop;

  return v_order;
end;
$$;

-- Apenas o service_role (rotas server-side) pode chamar — nunca o cliente.
revoke all on function public.create_order_with_items(jsonb, jsonb) from public;
revoke all on function public.create_order_with_items(jsonb, jsonb) from anon;
revoke all on function public.create_order_with_items(jsonb, jsonb) from authenticated;
grant execute on function public.create_order_with_items(jsonb, jsonb) to service_role;
