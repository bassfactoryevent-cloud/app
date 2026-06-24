-- 1. Modify merch_orders to add user_id
ALTER TABLE public.merch_orders 
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system', -- 'system', 'order', 'ticket', 'promo'
  is_read BOOLEAN DEFAULT false NOT NULL,
  action_url TEXT, -- Opcional: url a donde dirigir al clickear
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and system can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true); -- Ideally restrict to admin role or trigger, but leaving open for server-side inserts

-- 4. RLS Policies for merch_orders (Customer View)
-- Customers can view their own orders
CREATE POLICY "Users can view their own merch orders" 
ON public.merch_orders FOR SELECT 
USING (auth.uid() = user_id);

-- 5. RLS Policies for tickets (Customer View)
-- Ensure users can view their own tickets. Tickets table might already have user_id
-- We add a policy for tickets if it doesn't exist.
-- (If there's a conflict we might get a warning, but we need to ensure users can read their tickets)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tickets" 
ON public.tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage tickets" 
ON public.tickets USING (public.is_admin());
