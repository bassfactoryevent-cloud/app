-- Políticas de Seguridad (RLS) para la Tienda de Merch

-- 1. Categorías (merch_categories)
ALTER TABLE public.merch_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view merch categories" ON public.merch_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch categories" ON public.merch_categories USING (public.is_admin());

-- 2. Productos (merch_products)
ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published merch products" ON public.merch_products FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage merch products" ON public.merch_products USING (public.is_admin());

-- 3. Imágenes de Productos (merch_product_images)
ALTER TABLE public.merch_product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view merch product images" ON public.merch_product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch product images" ON public.merch_product_images USING (public.is_admin());

-- 4. Variantes de Productos (merch_product_variants)
ALTER TABLE public.merch_product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view merch product variants" ON public.merch_product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch product variants" ON public.merch_product_variants USING (public.is_admin());

-- 5. Órdenes (merch_orders)
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;
-- Los usuarios públicos pueden crear órdenes temporalmente a través de la API del servidor, 
-- pero para mayor seguridad, dejaremos que solo puedan ver las suyas por correo si es necesario.
-- Por ahora, permitimos inserción pública y select solo si son administradores.
CREATE POLICY "Public can insert merch orders" ON public.merch_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage merch orders" ON public.merch_orders USING (public.is_admin());

-- 6. Ítems de Órdenes (merch_order_items)
ALTER TABLE public.merch_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert merch order items" ON public.merch_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage merch order items" ON public.merch_order_items USING (public.is_admin());
