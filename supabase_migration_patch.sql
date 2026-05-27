-- Execute EM ORDEM no SQL Editor do Supabase Dashboard
-- 1) Adicionar coluna payment_method na tabela notes
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2) Adicionar coluna pix_discount na tabela notes (desconto especial para PIX)
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS pix_discount NUMERIC(10,2) DEFAULT 0;

-- 3) Confirmar que store_cnpj existe nas settings
INSERT INTO app_settings (key, value) VALUES ('store_cnpj', '51.803.643/0001-04') ON CONFLICT (key) DO NOTHING;

-- 4) Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Inserir vendedores padrão
INSERT INTO sellers (name, phone, email) VALUES
  ('THOMAS', '(73) 99154-6335', 'thomas@guimaraes.com'),
  ('THIAGO GUIMARÃES', '(73) 98821-2164', 'thiago.aag@hotmail.com')
ON CONFLICT DO NOTHING;
