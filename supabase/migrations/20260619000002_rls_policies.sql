-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

-- 1. Políticas Globales (Superadmins / Admins pueden ver y hacer todo)
-- Por simplicidad, unificaremos funciones de autorización.

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_promoter() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'promoter'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Políticas Específicas: PROFILES
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Políticas Específicas: EVENTS & TICKET_TIERS
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (public.is_admin());

CREATE POLICY "Tiers are viewable by everyone"
  ON ticket_tiers FOR SELECT USING (true);

CREATE POLICY "Admins can manage tiers"
  ON ticket_tiers FOR ALL USING (public.is_admin());

-- 4. Políticas Específicas: ORDERS & TICKETS
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR public.is_promoter());

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) 
    OR public.is_admin()
  );

-- Promotores pueden actualizar el estado del ticket (escanear)
CREATE POLICY "Promoters can update ticket status"
  ON tickets FOR UPDATE USING (public.is_promoter() OR public.is_admin());

-- 5. REGLA DE ORO: PREVENIR EL BORRADO DE DATOS (SOFT DELETE)
-- Vamos a crear una política general o trigger para evitar DELETE.
-- En RLS, si no definimos política de DELETE, está denegado por defecto.
-- Así que NO crearemos ninguna política FOR DELETE para nadie.
-- Esto bloquea a todos los clientes (incluyendo la web app y promotores) de hacer DELETE.
