-- 1. Merch Categories
CREATE TABLE merch_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Merch Products
CREATE TABLE merch_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES merch_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, out_of_stock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Merch Product Images (Carousel)
CREATE TABLE merch_product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES merch_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Merch Product Variants (e.g. Sizes, Colors)
CREATE TABLE merch_product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES merch_products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. "Size: L", "Color: Black"
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  price_override DECIMAL(10,2), -- If null, use product's base_price
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Merch Orders (Checkout Information)
CREATE TABLE merch_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL,
  shipping_zip VARCHAR(50),
  subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  payment_provider VARCHAR(50),
  payment_id VARCHAR(255),
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Merch Order Items (Items within an order)
CREATE TABLE merch_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES merch_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES merch_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES merch_product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL, -- Stored as snapshot
  variant_name VARCHAR(100), -- Stored as snapshot
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL, -- Stored as snapshot
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
