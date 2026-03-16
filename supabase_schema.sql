-- Supabase SQL Schema for Market Manager - Multitenancy Version

-- Password hashing helper (used in seed data)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables to ensure clean state (Multitenancy migration)
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS cash_flow CASCADE;
DROP TABLE IF EXISTS accounts_payable CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 0. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active', -- active, suspended
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 1. Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'operator', -- admin, operator
    name TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cnpj TEXT,
    contact TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT,
    category TEXT,
    price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    image_url TEXT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    expiry_date DATE,
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0
);

-- 8. Accounts Payable Table
CREATE TABLE IF NOT EXISTS accounts_payable (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendente', -- Pendente, Pago, Atrasado
    category TEXT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cash Flow Table
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    initial_value NUMERIC(10,2) NOT NULL,
    final_value NUMERIC(10,2),
    expected_value NUMERIC(10,2),
    status TEXT DEFAULT 'open', -- open, closed
    notes TEXT
);

-- 10. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    -- Unicidade correta é via índices parciais (NULL não colide em UNIQUE)
);

CREATE UNIQUE INDEX IF NOT EXISTS settings_tenant_key_unique
  ON settings (tenant_id, key)
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS settings_tenant_user_key_unique
  ON settings (tenant_id, user_id, key)
  WHERE user_id IS NOT NULL;

-- 11. Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
    change_amount INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    settings_json JSONB
);

-- --- Constraints (integridade básica) ---
ALTER TABLE tenants
  ADD CONSTRAINT tenants_status_check CHECK (status IN ('active', 'suspended'));

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin', 'operator'));

ALTER TABLE products
  ADD CONSTRAINT products_price_check CHECK (price >= 0),
  ADD CONSTRAINT products_cost_price_check CHECK (cost_price IS NULL OR cost_price >= 0),
  ADD CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0),
  ADD CONSTRAINT products_min_stock_level_check CHECK (min_stock_level >= 0);

ALTER TABLE batches
  ADD CONSTRAINT batches_quantity_check CHECK (quantity > 0);

ALTER TABLE customers
  ADD CONSTRAINT customers_points_check CHECK (points >= 0);

ALTER TABLE sales
  ADD CONSTRAINT sales_total_amount_check CHECK (total_amount >= 0),
  ADD CONSTRAINT sales_discount_check CHECK (discount >= 0);

ALTER TABLE sale_items
  ADD CONSTRAINT sale_items_quantity_check CHECK (quantity > 0),
  ADD CONSTRAINT sale_items_unit_price_check CHECK (unit_price >= 0),
  ADD CONSTRAINT sale_items_discount_check CHECK (discount >= 0);

ALTER TABLE accounts_payable
  ADD CONSTRAINT accounts_payable_amount_check CHECK (amount >= 0),
  ADD CONSTRAINT accounts_payable_status_check CHECK (status IN ('Pendente', 'Pago', 'Atrasado'));

ALTER TABLE cash_flow
  ADD CONSTRAINT cash_flow_initial_value_check CHECK (initial_value >= 0),
  ADD CONSTRAINT cash_flow_final_value_check CHECK (final_value IS NULL OR final_value >= 0),
  ADD CONSTRAINT cash_flow_expected_value_check CHECK (expected_value IS NULL OR expected_value >= 0),
  ADD CONSTRAINT cash_flow_status_check CHECK (status IN ('open', 'closed'));

-- --- Índices (performance / consultas comuns) ---
CREATE INDEX IF NOT EXISTS idx_app_users_tenant ON app_users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_name ON suppliers (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_products_tenant_name ON products (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_products_tenant_barcode ON products (tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at ON sales (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_sale_id ON sale_items (tenant_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_tenant_due_date ON accounts_payable (tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_tenant_created_at ON inventory_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_tenant_expiry_date ON batches (tenant_id, expiry_date);

-- --- Funções transacionais (RPC) para consistência de estoque/vendas ---
CREATE OR REPLACE FUNCTION mm_create_sale(
  p_tenant_id integer,
  p_customer_id integer,
  p_total_amount numeric,
  p_discount numeric,
  p_payment_method text,
  p_items jsonb
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id integer;
  v_item jsonb;
  v_product_id integer;
  v_qty integer;
  v_unit_price numeric;
  v_item_discount numeric;
  v_current_stock integer;
  v_points integer;
BEGIN
  INSERT INTO sales (tenant_id, customer_id, total_amount, discount, payment_method)
  VALUES (p_tenant_id, p_customer_id, p_total_amount, COALESCE(p_discount, 0), p_payment_method)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    v_product_id := (v_item->>'product_id')::integer;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_item_discount := COALESCE((v_item->>'discount')::numeric, 0);

    -- trava e valida estoque
    SELECT stock_quantity INTO v_current_stock
    FROM products
    WHERE tenant_id = p_tenant_id AND id = v_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado (%).', v_product_id;
    END IF;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade inválida (%).', v_qty;
    END IF;
    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para produto % (atual %, pedido %).', v_product_id, v_current_stock, v_qty;
    END IF;

    INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, unit_price, discount)
    VALUES (p_tenant_id, v_sale_id, v_product_id, v_qty, v_unit_price, v_item_discount);

    UPDATE products
      SET stock_quantity = stock_quantity - v_qty
    WHERE tenant_id = p_tenant_id AND id = v_product_id;
  END LOOP;

  IF p_customer_id IS NOT NULL THEN
    SELECT points INTO v_points
      FROM customers
      WHERE tenant_id = p_tenant_id AND id = p_customer_id
      FOR UPDATE;
    IF v_points IS NOT NULL THEN
      UPDATE customers
        SET points = points + floor(p_total_amount / 10)
      WHERE tenant_id = p_tenant_id AND id = p_customer_id;
    END IF;
  END IF;

  RETURN v_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION mm_update_sale(
  p_tenant_id integer,
  p_sale_id integer,
  p_customer_id integer,
  p_total_amount numeric,
  p_discount numeric,
  p_payment_method text,
  p_items jsonb
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_old record;
  v_item jsonb;
  v_product_id integer;
  v_qty integer;
  v_unit_price numeric;
  v_item_discount numeric;
  v_current_stock integer;
BEGIN
  -- reverte estoque dos itens antigos
  FOR v_old IN
    SELECT product_id, quantity
    FROM sale_items
    WHERE tenant_id = p_tenant_id AND sale_id = p_sale_id
  LOOP
    IF v_old.product_id IS NOT NULL THEN
      UPDATE products
        SET stock_quantity = stock_quantity + v_old.quantity
      WHERE tenant_id = p_tenant_id AND id = v_old.product_id;
    END IF;
  END LOOP;

  DELETE FROM sale_items WHERE tenant_id = p_tenant_id AND sale_id = p_sale_id;

  UPDATE sales
    SET customer_id = p_customer_id,
        total_amount = p_total_amount,
        discount = COALESCE(p_discount, 0),
        payment_method = p_payment_method
  WHERE tenant_id = p_tenant_id AND id = p_sale_id;

  -- aplica novos itens (com travas e validação)
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    v_product_id := (v_item->>'product_id')::integer;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_item_discount := COALESCE((v_item->>'discount')::numeric, 0);

    SELECT stock_quantity INTO v_current_stock
    FROM products
    WHERE tenant_id = p_tenant_id AND id = v_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado (%).', v_product_id;
    END IF;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade inválida (%).', v_qty;
    END IF;
    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para produto % (atual %, pedido %).', v_product_id, v_current_stock, v_qty;
    END IF;

    INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, unit_price, discount)
    VALUES (p_tenant_id, p_sale_id, v_product_id, v_qty, v_unit_price, v_item_discount);

    UPDATE products
      SET stock_quantity = stock_quantity - v_qty
    WHERE tenant_id = p_tenant_id AND id = v_product_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION mm_delete_sale(
  p_tenant_id integer,
  p_sale_id integer
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_old record;
BEGIN
  FOR v_old IN
    SELECT product_id, quantity
    FROM sale_items
    WHERE tenant_id = p_tenant_id AND sale_id = p_sale_id
  LOOP
    IF v_old.product_id IS NOT NULL THEN
      UPDATE products
        SET stock_quantity = stock_quantity + v_old.quantity
      WHERE tenant_id = p_tenant_id AND id = v_old.product_id;
    END IF;
  END LOOP;

  DELETE FROM sale_items WHERE tenant_id = p_tenant_id AND sale_id = p_sale_id;
  DELETE FROM sales WHERE tenant_id = p_tenant_id AND id = p_sale_id;
END;
$$;

-- Initial Data
INSERT INTO tenants (name, slug) VALUES ('Market Manager', 'market-manager') ON CONFLICT (slug) DO NOTHING;

-- Assigning the first tenant ID (assuming it's 1)
INSERT INTO app_users (tenant_id, username, password, role, name, is_super_admin) VALUES 
(1, 'felipe', crypt('260892', gen_salt('bf')), 'admin', 'Felipe', TRUE),
(1, 'admin', crypt('admin', gen_salt('bf')), 'admin', 'Administrador', FALSE),
(1, 'caixa', crypt('caixa123', gen_salt('bf')), 'operator', 'Operador de Caixa', FALSE)
ON CONFLICT (tenant_id, username) DO NOTHING;

INSERT INTO settings (tenant_id, key, value) VALUES 
(1, 'bill_alert_days', '3')
ON CONFLICT (tenant_id, key) DO NOTHING;
