create table public.hero_settings (
  id integer primary key default 1,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  media_url text not null,
  title text not null,
  subtitle text,
  primary_button_text text,
  primary_button_url text,
  secondary_button_text text,
  secondary_button_url text,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Enable RLS
alter table public.hero_settings enable row level security;

-- Policies
create policy "hero_settings are viewable by everyone" on public.hero_settings
  for select using (true);

create policy "hero_settings are updatable by admins" on public.hero_settings
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "hero_settings are insertable by admins" on public.hero_settings
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insert default row
insert into public.hero_settings (
  id,
  media_type, 
  media_url, 
  title, 
  subtitle, 
  primary_button_text, 
  primary_button_url
) values (
  1,
  'image',
  'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop',
  'MÚSICA<br/>Cultura<br/>Movimiento',
  'El ecosistema definitivo de la cultura electrónica en tu ciudad.',
  'Ver Eventos',
  '/events'
);


