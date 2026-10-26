-- ============================================================================
--  YOLO Eats — Supabase setup
--  ---------------------------------------------------------------------------
--  Run this ONCE in:  Supabase dashboard -> your project -> SQL Editor -> New query
--  Paste everything below, press RUN.
--
--  After it finishes:
--    1. Authentication -> Users -> "Add user"  (email + password for the owner)
--       Tick "Auto Confirm User" so they can sign in straight away.
--    2. Settings -> API -> copy "Project URL" and the "anon / publishable" key
--       into  assets/js/yolo-config.js
--
--  Anyone can READ the menu (that is what the website needs).
--  Only a signed-in user can CHANGE it.
-- ============================================================================

-- ---------------------------------------------------------------- settings
create table if not exists public.site_settings (
  id          int primary key default 1,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint site_settings_single_row check (id = 1)
);

-- -------------------------------------------------------------- categories
create table if not exists public.menu_categories (
  id          text primary key,              -- "thali", "momos", ...
  name        text not null,
  name_hi     text,
  sub         text,
  sort        int  not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- items
create table if not exists public.menu_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     text not null references public.menu_categories(id) on delete cascade,
  name            text not null,
  descr           text,
  price           numeric(10,2),             -- NULL  = "Ask staff"
  price_variants  jsonb,                     -- {"Half":90,"Full":160} for portioned dishes
  tags            text[] not null default '{}',   -- 'sig' = YOLO special, 'value' = full meal
  image           text,                      -- Pexels photo id, or a full image URL
  sort            int  not null default 0,
  active          boolean not null default true,
  featured        boolean not null default false, -- shows in the "Signature plates" reel
  updated_at      timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items (category_id, sort);
create index if not exists menu_categories_sort_idx on public.menu_categories (sort);

-- ------------------------------------------------------- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists menu_categories_touch on public.menu_categories;
create trigger menu_categories_touch before update on public.menu_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists menu_items_touch on public.menu_items;
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------- RLS
alter table public.site_settings   enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;

-- public read (the website runs with the anon key)
drop policy if exists "public read settings"   on public.site_settings;
drop policy if exists "public read categories" on public.menu_categories;
drop policy if exists "public read items"      on public.menu_items;

create policy "public read settings"   on public.site_settings
  for select to anon, authenticated using (true);
create policy "public read categories" on public.menu_categories
  for select to anon, authenticated using (true);
create policy "public read items"      on public.menu_items
  for select to anon, authenticated using (true);

-- signed-in staff can change everything
drop policy if exists "staff write settings"   on public.site_settings;
drop policy if exists "staff write categories" on public.menu_categories;
drop policy if exists "staff write items"      on public.menu_items;

create policy "staff write settings"   on public.site_settings
  for all to authenticated using (true) with check (true);
create policy "staff write categories" on public.menu_categories
  for all to authenticated using (true) with check (true);
create policy "staff write items"      on public.menu_items
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------- starting row
insert into public.site_settings (id, data)
values (1, '{
  "name": "YOLO Eats",
  "nameHi": "योलो",
  "kind": "Pure Veg Family Restaurant",
  "cuisine": "Punjabi · Chaap · Momos · Chinese · Pizza",
  "tagline": "Your cravings, our game. Punjabi tadka, smoky tandoori chaap, momos and pizzas — fresh from our kitchen, all pure veg.",
  "street": "",
  "locality": "",
  "city": "Kathua",
  "state": "Jammu & Kashmir",
  "postalCode": "",
  "country": "IN",
  "landmark": "near Pathankot",
  "lat": "",
  "lng": "",
  "phone": "+91 98765 43210",
  "whatsapp": "",
  "email": "",
  "mapsUrl": "https://maps.google.com/?q=YOLO+Eats+Kathua",
  "open": "08:00",
  "close": "23:00",
  "siteUrl": "https://yollo.co.in/",
  "metaTitle": "",
  "metaDescription": "",
  "keywords": ""
}'::jsonb)
on conflict (id) do nothing;

-- Done. Publish the menu once from the admin panel to fill the two menu tables.
