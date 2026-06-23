-- 1. Tabla Principal de Eventos
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location_name VARCHAR(255),
  location_address TEXT,
  is_free BOOLEAN DEFAULT false,
  total_capacity INTEGER,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, cancelled, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Entidad: Categorías de Boletas (Ticket Tiers)
CREATE TABLE ticket_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ej. "Early Bird", "Anytime"
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  sales_start TIMESTAMP WITH TIME ZONE,
  sales_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Entidad: Patrocinadores (Sponsors)
CREATE TABLE sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tablas Pivote (M:N)
-- event_djs (El orden es importante para el Line Up)
CREATE TABLE event_djs (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  dj_id UUID REFERENCES djs(id) ON DELETE CASCADE,
  set_time TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (event_id, dj_id)
);

CREATE TABLE event_sponsors (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  tier_name VARCHAR(100), -- Ej. "Main Sponsor", "Support"
  PRIMARY KEY (event_id, sponsor_id)
);

-- 5. Entidades Transaccionales (Orders y Tickets)
-- Pedidos (Órdenes de compra general)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled
  payment_provider VARCHAR(50), -- mercadopago, stripe, free
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Boletas individuales generadas (Una orden puede tener múltiples tickets)
CREATE TABLE issued_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- ¡ESTE ES EL VALOR DEL CÓDIGO QR!
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  ticket_tier_id UUID REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  qr_code_hash VARCHAR(255) UNIQUE NOT NULL, -- Un hash único para mayor seguridad al escanear
  is_scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
