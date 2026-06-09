-- Execute EM ORDEM no SQL Editor do Supabase Dashboard
-- 1) Adicionar coluna payment_method na tabela notes
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2) Adicionar coluna pix_discount na tabela notes (desconto especial para PIX)
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS pix_discount NUMERIC(10,2) DEFAULT 0;

-- 3) Confirmar que store_cnpj existe nas settings
INSERT INTO app_settings (key, value) VALUES ('store_cnpj', '51.803.643/0001-04') ON CONFLICT (key) DO NOTHING;

-- 4) Permitir role 'seller' em admin_users
ALTER TABLE IF EXISTS admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE IF EXISTS admin_users ADD CONSTRAINT admin_users_role_check CHECK(role IN ('admin', 'superadmin', 'seller'));

-- 5) Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password TEXT,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Tabela de logs de ações de administradores/vendedores
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  description TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Inserir vendedores padrão (senha: guimaraes@2026)
INSERT INTO sellers (name, phone, email, password) VALUES
  ('THOMAS', '(73) 99154-6335', 'thomas@guimaraes.com', 'guimaraes@2026'),
  ('THIAGO GUIMARÃES', '(73) 98821-2164', 'thiago.aag@hotmail.com', 'guimaraes@2026');

-- Garantir que admin_users existe para os vendedores
INSERT INTO admin_users (name, email, password, role) VALUES
  ('THOMAS', 'thomas@guimaraes.com', 'guimaraes@2026', 'seller'),
  ('THIAGO GUIMARÃES', 'thiago.aag@hotmail.com', 'guimaraes@2026', 'seller')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password;

-- 8) Adicionar coluna note_id na tabela deliveries (para vincular entregas a notas)
ALTER TABLE IF EXISTS deliveries ADD COLUMN IF NOT EXISTS note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE;
