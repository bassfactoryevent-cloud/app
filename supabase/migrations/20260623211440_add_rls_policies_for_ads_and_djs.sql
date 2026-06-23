-- Políticas de Seguridad para Campañas y Anuncios
CREATE POLICY "Public can view active campaigns" ON ad_campaigns FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage campaigns" ON ad_campaigns USING (public.is_admin());

CREATE POLICY "Public can view ad placements" ON ad_placements FOR SELECT USING (true);
CREATE POLICY "Admins can manage ad placements" ON ad_placements USING (public.is_admin());

CREATE POLICY "Public can view active ads" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ads" ON ads USING (public.is_admin());

-- Políticas de Seguridad para DJs
CREATE POLICY "Public can view djs" ON djs FOR SELECT USING (true);
CREATE POLICY "Admins can manage djs" ON djs USING (public.is_admin());
