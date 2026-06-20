-- =====================================================================
-- MINI VAT PREMIUM — Seeds de desenvolvimento
-- Fonte: docs/05-DATABASE-SCHEMA.md secao 7
-- Rodar APOS a migration 0001. Idempotente (on conflict do nothing).
-- =====================================================================

-- categorias
insert into public.categories (slug, name, description, sort_order) values
  ('mini-vat', 'Mini VAT', 'Cubetas para impressoras 3D odontologicas', 1),
  ('mesas', 'Mesas de impressao', 'Plataformas de impressao', 2),
  ('acessorios', 'Acessorios', 'Itens complementares', 3)
on conflict (slug) do nothing;

-- produto exemplo
insert into public.products
  (sku, slug, name, short_description, price_cents, stock, weight_g, is_active, is_featured, category_id)
select
  'MVP-INOX-G', 'mini-vat-premium-inox', 'Mini VAT PREMIUM Inox',
  'Cubeta em aco inox 316, durabilidade superior, encaixe perfeito.',
  129900, 50, 180, true, true,
  (select id from public.categories where slug = 'mini-vat')
on conflict (sku) do nothing;
