-- ============================================================================
-- SQL DE MIGRAÇÃO COMPLETA — Supabase (PostgreSQL)
-- Guimarães Materiais para Construção
-- Execute tudo no SQL Editor do Supabase (uma única vez)
-- ============================================================================

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 1. TABELAS (ORDEM CRESCENTE DE DEPENDÊNCIA)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  cnpj TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'UND',
  category TEXT NOT NULL,
  image TEXT,
  featured INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações da Loja
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cupons
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage' CHECK(discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_purchase NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  link TEXT,
  active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  items JSONB NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  delivery_status TEXT DEFAULT 'preparing',
  delivery_date DATE,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entregas
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT DEFAULT 'preparing' CHECK(status IN ('preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  driver_id INTEGER,
  driver_name TEXT,
  driver_phone TEXT,
  estimated_date DATE,
  delivered_date TIMESTAMPTZ,
  notes TEXT,
  tracking_code TEXT,
  current_lat NUMERIC(10,7),
  current_lng NUMERIC(10,7),
  last_update TIMESTAMPTZ,
  observation TEXT DEFAULT '',
  route_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fluxo de Caixa
CREATE TABLE IF NOT EXISTS cash_flow (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'pix', 'transfer', 'boleto', 'pending')),
  reference_id INTEGER,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas a Pagar / Boletos
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'cancelled')),
  reminder_days INTEGER DEFAULT 3,
  reminder_sent INTEGER DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  barcode TEXT,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('bill_reminder', 'order_status', 'stock_alert', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  reference_id INTEGER,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas de Estoque
CREATE TABLE IF NOT EXISTS stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  acknowledged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Administradores (login do painel admin)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'superadmin')),
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Motoristas
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  phone TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  cnh TEXT,
  vehicle TEXT,
  license_plate TEXT,
  password TEXT DEFAULT '123456',
  active INTEGER DEFAULT 1,
  current_lat NUMERIC(10,7),
  current_lng NUMERIC(10,7),
  last_location_update TIMESTAMPTZ,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Localizações GPS dos Motoristas
CREATE TABLE IF NOT EXISTS driver_locations (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  delivery_id INTEGER REFERENCES deliveries(id) ON DELETE SET NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  accuracy REAL,
  speed REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Atualizações de Entrega
CREATE TABLE IF NOT EXISTS delivery_updates (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  notes TEXT,
  photo_url TEXT,
  signature_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Bater Ponto (Jornada)
CREATE TABLE IF NOT EXISTS driver_timeclock (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  exit_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist de Pré-Entrega
CREATE TABLE IF NOT EXISTS delivery_checklist (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_quantity NUMERIC(10,2) NOT NULL,
  checked INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de Atividades dos Motoristas
CREATE TABLE IF NOT EXISTS driver_activity_logs (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  details JSONB,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notas (Orçamentos e Vendas)
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('quote', 'sale')),
  number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  customer_cpf TEXT,
  attendant_name TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'fixed',
  total NUMERIC(10,2) NOT NULL,
  observations TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'approved', 'completed', 'cancelled')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 2. ÍNDICES (PARA PERFORMANCE)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_drivers_username ON drivers(username);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_ts ON driver_locations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_driver_timeclock_date ON driver_timeclock(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_driver_activity_logs_driver ON driver_activity_logs(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_activity_logs_action ON driver_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_driver_activity_logs_created ON driver_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_created ON cash_flow(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_number ON notes(number);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 3. FUNÇÃO AUXILIAR PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a trigger nas tabelas que têm updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['products', 'quotes', 'orders', 'deliveries', 'bills', 'customers', 'drivers', 'suppliers', 'notes', 'driver_timeclock', 'app_settings', 'admin_users'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at()', tbl);
  END LOOP;
END;
$$;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 4. SEED DATA (DADOS DE EXEMPLO)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Configurações da Loja
INSERT INTO app_settings (key, value) VALUES
  ('store_name', 'Guimarães Materiais para Construção'),
  ('store_phone', '(00) 0000-0000'),
  ('store_address', 'Rua Exemplo, 123 - Centro'),
  ('store_hours', 'Seg-Sex: 7h-18h | Sáb: 7h-13h'),
  ('whatsapp_number', '5500000000000'),
  ('store_email', 'contato@guimaraesmateriais.com.br'),
  ('store_cnpj', '51.803.643/0001-04')
ON CONFLICT (key) DO NOTHING;

-- Fornecedores
INSERT INTO suppliers (name, contact_name, phone, email, active) VALUES
  ('Votorantim Cimentos', 'João Silva', '(11) 3000-1000', 'vendas@votorantim.com', 1),
  ('Distribuidora ABC', 'Maria Santos', '(11) 3000-2000', 'contato@abc.com', 1),
  ('Ferreira Materiais', 'Carlos Oliveira', '(11) 3000-3000', 'vendas@ferreira.com', 1)
ON CONFLICT DO NOTHING;

-- Produtos (50+ itens)
INSERT INTO products (name, description, price, unit, category, featured, stock, min_stock) VALUES
  ('Argamassa ACII - Votorantim', 'Argamassa colante para pisos e paredes internas e externas', 33.99, 'UND', 'Argamassas', 1, 150, 20),
  ('Argamassa ACIII Flexível - Votorantim', 'Argamassa colante flexível para áreas internas e externas', 47.99, 'UND', 'Argamassas', 1, 120, 20),
  ('Cimento CP II 50kg', 'Cimento Portland composto para uso geral', 38.90, 'SACO', 'Cimento', 1, 200, 30),
  ('Areia Média 20kg', 'Areia média lavada para construção', 12.50, 'SACO', 'Areia e Brita', 0, 300, 50),
  ('Brita 1 20kg', 'Brita número 1 para concreto e fundação', 14.90, 'SACO', 'Areia e Brita', 0, 250, 50),
  ('Tijolo Cerâmico 9x19x19', 'Tijolo cerâmico para alvenaria', 0.85, 'UND', 'Tijolos', 0, 5000, 500),
  ('Bloco de Concreto 14x19x39', 'Bloco de concreto estrutural', 3.50, 'UND', 'Tijolos', 0, 2000, 200),
  ('Tinta Acrílica Premium 18L', 'Tinta acrílica para paredes internas e externas', 189.90, 'LAT', 'Tintas', 1, 80, 10),
  ('Massa Corrida 25kg', 'Massa corrida para acabamento de paredes', 45.00, 'SACO', 'Tintas', 0, 100, 15),
  ('Rejunte Flexível 1kg', 'Rejunte flexível para pisos e azulejos', 12.90, 'UND', 'Rejuntes', 0, 200, 30),
  ('Impermeabilizante 18L', 'Impermeabilizante acrílico para lajes e paredes', 159.90, 'BAL', 'Impermeabilizantes', 1, 60, 10),
  ('Vergalhão CA-50 3/8 12m', 'Vergalhão de aço CA-50 para concreto armado', 42.90, 'BAR', 'Ferro e Aço', 0, 500, 50),
  ('Tela Soldada 15x15 2.5mm', 'Tela soldada para lajes e muros', 89.90, 'UND', 'Ferro e Aço', 0, 100, 10),
  ('Tubo PVC Esgoto 100mm 6m', 'Tubo de PVC para esgoto', 52.00, 'BAR', 'Hidráulica', 0, 150, 20),
  ('Tubo PVC Água 25mm 6m', 'Tubo de PVC para água fria', 18.90, 'BAR', 'Hidráulica', 0, 200, 30),
  ('Fio Elétrico 2.5mm 100m', 'Fio elétrico flexível para instalações', 189.00, 'ROL', 'Elétrica', 0, 80, 10),
  ('Disjuntor 20A', 'Disjuntor termomagnético monofásico', 15.90, 'UND', 'Elétrica', 0, 300, 50),
  ('Porta de Madeira Interna', 'Porta de madeira para uso interno', 189.00, 'UND', 'Portas e Janelas', 0, 40, 5),
  ('Janela de Alumínio 100x120', 'Janela de alumínio com vidro', 349.00, 'UND', 'Portas e Janelas', 0, 25, 5),
  ('Piso Cerâmico 60x60', 'Piso cerâmico para salas e quartos', 45.90, 'M2', 'Pisos', 1, 500, 50),
  ('Telha Cerâmica Francesa', 'Telha cerâmica tipo francesa', 2.50, 'UND', 'Telhados', 0, 3000, 300),
  ('Cumeeira Cerâmica', 'Cumeeira para telhado cerâmico', 5.90, 'UND', 'Telhados', 0, 500, 50),
  ('Calha PVC 100mm 3m', 'Calha de PVC para água pluvial', 32.90, 'UND', 'Hidráulica', 0, 80, 10),
  ('Caixa D''Água 1000L', 'Caixa d''água polietileno 1000 litros', 299.00, 'UND', 'Hidráulica', 1, 30, 5),
  ('Torneira de Mesa', 'Torneira cromada para cozinha', 89.90, 'UND', 'Hidráulica', 0, 50, 10),
  ('Chuveiro Elétrico', 'Chuveiro elétrico 5500W', 79.90, 'UND', 'Elétrica', 0, 60, 10),
  ('Lâmpada LED 12W', 'Lâmpada LED 12W bocal E27', 12.90, 'UND', 'Elétrica', 0, 200, 30),
  ('Cabo de Aço 3/8', 'Cabo de aço galvanizado 3/8', 3.90, 'M', 'Ferro e Aço', 0, 500, 50),
  ('Prego 17x27 1kg', 'Prego de aço 17x27 caixa 1kg', 18.90, 'KG', 'Ferragens', 0, 100, 15),
  ('Parafuso Drywall 3.5x25', 'Parafuso para drywall 3.5x25 caixa 1000un', 35.90, 'CX', 'Ferragens', 0, 50, 10),
  ('Lixa para Parede Grão 120', 'Lixa para parede grão 120 folha', 2.50, 'UND', 'Tintas', 0, 500, 50),
  ('Rolo de Lã 23cm', 'Rolo de lã para pintura 23cm', 15.90, 'UND', 'Tintas', 0, 80, 10),
  ('Cano PVC 50mm 6m', 'Cano de PVC para água fria 50mm', 28.90, 'BAR', 'Hidráulica', 0, 120, 20),
  ('Joelho PVC 90° 100mm', 'Joelho PVC esgoto 90 graus 100mm', 5.90, 'UND', 'Hidráulica', 0, 300, 50),
  ('Tinta Piso 3,6L', 'Tinta acrílica para pisos', 89.90, 'LAT', 'Tintas', 0, 40, 8),
  ('Verniz Poliuretano 900ml', 'Verniz poliuretano brilhante', 59.90, 'UND', 'Tintas', 0, 30, 5),
  ('Manta Asfáltica 10m2', 'Manta asfáltica impermeabilizante 3mm', 129.90, 'ROL', 'Impermeabilizantes', 0, 40, 5),
  ('Argamassa Revestimento 20kg', 'Argamassa para reboco interno/externo', 18.90, 'SACO', 'Argamassas', 0, 200, 30),
  ('Bloco Cerâmico 9x19x39', 'Bloco cerâmico estrutural', 2.80, 'UND', 'Tijolos', 0, 4000, 400),
  ('Piso Porcelanato 60x60', 'Porcelanato polido 60x60', 59.90, 'M2', 'Pisos', 1, 300, 30),
  ('Rodapé Cerâmico 10x60', 'Rodapé cerâmico 10x60', 8.90, 'UND', 'Pisos', 0, 200, 20),
  ('Porta de Ferro 80x210', 'Porta de ferro para entrada', 459.00, 'UND', 'Portas e Janelas', 0, 10, 2),
  ('Janela de Correr PVC', 'Janela PVC 120x100', 499.00, 'UND', 'Portas e Janelas', 0, 15, 3),
  ('Kit Metais Banheiro', 'Kit metais cromados para banheiro', 199.90, 'KIT', 'Hidráulica', 0, 25, 5),
  ('Máquina de Cortar Piso', 'Máquina elétrica de cortar piso 1500W', 899.00, 'UND', 'Ferramentas', 0, 5, 1),
  ('Betoneira 120L', 'Betoneira elétrica 120L monofásica', 1299.00, 'UND', 'Ferramentas', 1, 8, 2),
  ('Carrinho de Pedreiro', 'Carrinho de mão 60L', 129.90, 'UND', 'Ferramentas', 0, 20, 5),
  ('Colher de Pedreiro', 'Colher de pedreiro aço carbono', 18.90, 'UND', 'Ferramentas', 0, 50, 10),
  ('Nível Laser', 'Nível laser 360 graus auto-nivelante', 349.00, 'UND', 'Ferramentas', 0, 15, 3),
  ('Furadeira Impacto 600W', 'Furadeira elétrica 600W com impacto', 259.90, 'UND', 'Ferramentas', 0, 20, 5)
ON CONFLICT DO NOTHING;

-- Banners
INSERT INTO banners (title, subtitle, active, order_index) VALUES
  ('Oferta de Maio', 'Confira nossas promoções especiais', 1, 1),
  ('Toda Linha Votomassa', 'Encontre na Guimarães Materiais para Construção', 1, 2)
ON CONFLICT DO NOTHING;

-- Cupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, valid_until, active) VALUES
  ('PROMO10', '10% de desconto na primeira compra', 'percentage', 10, 100, 100, '2026-12-31', 1),
  ('FRETEGRATIS', 'Frete grátis acima de R$200', 'fixed', 0, 200, 50, '2026-12-31', 1)
ON CONFLICT (code) DO NOTHING;

-- Clientes
INSERT INTO customers (name, email, phone, address, neighborhood, city, state, total_orders, total_spent) VALUES
  ('João da Silva', 'joao@email.com', '(11) 99999-1111', 'Rua das Flores, 123', 'Centro', 'São Paulo', 'SP', 5, 2500.00),
  ('Maria Oliveira', 'maria@email.com', '(11) 99999-2222', 'Av. Brasil, 456', 'Jardim América', 'São Paulo', 'SP', 3, 1800.00),
  ('Carlos Santos', 'carlos@email.com', '(11) 99999-3333', 'Rua São Paulo, 789', 'Vila Nova', 'Guarulhos', 'SP', 8, 4200.00),
  ('Ana Costa', 'ana@email.com', '(11) 99999-4444', 'Rua Minas Gerais, 321', 'Centro', 'Osasco', 'SP', 2, 950.00),
  ('Pedro Lima', 'pedro@email.com', '(11) 99999-5555', 'Av. Paulista, 1000', 'Bela Vista', 'São Paulo', 'SP', 12, 7800.00)
ON CONFLICT DO NOTHING;

-- Administradores
INSERT INTO admin_users (name, email, password, role) VALUES
  ('Administrador', 'guimaraes@admin.com', 'admin@guimaraes', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Motoristas (login do app driver)
INSERT INTO drivers (name, username, phone, email, cpf, cnh, vehicle, license_plate, password, active, current_lat, current_lng) VALUES
  ('Thiago Motorista 01', 'thiago.motor01', '(73) 98877-4455', 'thiago.motor01@email.com', '123.456.789-00', '12345678901', 'Ford F700', 'ABC-1D23', 'thiago@motorista', 1, -14.7889, -39.0465),
  ('Thiago Guimarães', 'thiago.guimaraes', '(73) 98877-4456', 'thiago.guimaraes@email.com', '987.654.321-00', '98765432109', 'Caçamba', 'DEF-4E56', 'thiago@guimaraes', 1, -14.7920, -39.0510)
ON CONFLICT (username) DO NOTHING;

-- Exemplo de fluxo de caixa (só insere se tabela estiver vazia)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cash_flow LIMIT 1) THEN
    INSERT INTO cash_flow (type, category, description, amount, payment_method) VALUES
      ('income', 'vendas', 'Venda #1001 - Argamassas', 1500.00, 'pix'),
      ('income', 'vendas', 'Venda #1002 - Tintas', 890.50, 'card'),
      ('income', 'vendas', 'Venda #1003 - Ferragens', 2340.00, 'cash'),
      ('expense', 'fornecedores', 'Compra Votorantim - Argamassas', 3500.00, 'boleto'),
      ('expense', 'fornecedores', 'Compra Distribuidora ABC - Tintas', 1200.00, 'pix'),
      ('expense', 'aluguel', 'Aluguel do ponto comercial', 2500.00, 'boleto'),
      ('expense', 'funcionários', 'Folha de pagamento', 4500.00, 'transfer'),
      ('expense', 'energia', 'Conta de energia', 450.00, 'boleto'),
      ('income', 'vendas', 'Venda #1004 - Hidráulica', 670.00, 'pix'),
      ('income', 'vendas', 'Venda #1005 - Elétrica', 1230.00, 'card');
  END IF;
END;
$$;

-- Contas a pagar (vencimentos dinâmicos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bills LIMIT 1) THEN
    INSERT INTO bills (title, description, amount, due_date, status, reminder_days, supplier) VALUES
      ('Aluguel', 'Aluguel do ponto comercial', 2500.00, (CURRENT_DATE + INTERVAL '5 days')::DATE, 'pending', 3, 'Imobiliária XYZ'),
      ('Energia Elétrica', 'Conta de luz', 450.00, (CURRENT_DATE + INTERVAL '15 days')::DATE, 'pending', 5, 'Companhia Energética'),
      ('Fornecedor Votorantim', 'Boleto fornecedor argamassas', 3500.00, (CURRENT_DATE + INTERVAL '30 days')::DATE, 'pending', 7, 'Votorantim Cimentos'),
      ('Água e Esgoto', 'Conta de água', 180.00, (CURRENT_DATE + INTERVAL '5 days')::DATE, 'pending', 3, 'SABESP'),
      ('Internet', 'Mensalidade internet', 150.00, (CURRENT_DATE + INTERVAL '15 days')::DATE, 'pending', 5, 'Provedor Local');
  END IF;
END;
$$;

-- Exemplo de pedidos (para referência das entregas)
INSERT INTO orders (id, customer_name, customer_phone, customer_address, items, total, status)
SELECT * FROM (VALUES
  (1, 'João da Silva', '(11) 99999-1111', 'Rua das Flores, 123 - Centro', '[{"name":"Cimento CP II 50kg","quantity":5,"price":38.90}]'::jsonb, 194.50, 'confirmed'),
  (2, 'Maria Oliveira', '(11) 99999-2222', 'Av. Brasil, 456 - Jardim', '[{"name":"Tinta Acrílica Premium 18L","quantity":2,"price":189.90}]'::jsonb, 379.80, 'confirmed'),
  (3, 'Carlos Santos', '(11) 99999-3333', 'Rua São Paulo, 789 - Vila Nova', '[{"name":"Argamassa ACII","quantity":20,"price":33.99}]'::jsonb, 679.80, 'delivered')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = v.column1);

-- Exemplo de entregas
INSERT INTO deliveries (order_id, customer_name, customer_phone, customer_address, status, estimated_date)
SELECT * FROM (VALUES
  (1, 'João da Silva', '(11) 99999-1111', 'Rua das Flores, 123 - Centro', 'out_for_delivery', CURRENT_DATE + INTERVAL '1 day'),
  (2, 'Maria Oliveira', '(11) 99999-2222', 'Av. Brasil, 456 - Jardim', 'preparing', CURRENT_DATE + INTERVAL '2 days'),
  (3, 'Carlos Santos', '(11) 99999-3333', 'Rua São Paulo, 789 - Vila Nova', 'delivered', CURRENT_DATE - INTERVAL '2 days')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM deliveries WHERE id = v.column1);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 5. FUNÇÕES AUXILIARES
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Incrementar contagem de entregas do motorista
CREATE OR REPLACE FUNCTION increment_driver_deliveries(driver_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE drivers SET total_deliveries = total_deliveries + 1 WHERE id = driver_id;
END;
$$ LANGUAGE plpgsql;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 6. ROW LEVEL SECURITY (OPCIONAL — SEGURANÇA A NÍVEL DE LINHA)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Habilite apenas se quiser que o backend se conecte com anon key
-- e as regras de segurança fiquem no banco. Caso contrário, o backend
-- se conecta com service_role (acesso total) e RLS não interfere.

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- (adicione conforme necessidade)

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 7. VERIFICAÇÃO RÁPIDA
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- SELECT 'produtos' as tabela, COUNT(*) as registros FROM products
-- UNION ALL SELECT 'clientes', COUNT(*) FROM customers
-- UNION ALL SELECT 'motoristas', COUNT(*) FROM drivers
-- UNION ALL SELECT 'fornecedores', COUNT(*) FROM suppliers;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- PRONTO! O BANCO ESTÁ CRIADO.
-- Agora configure o backend para usar Supabase (veja o README).
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
