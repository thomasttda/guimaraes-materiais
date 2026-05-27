-- Execute EM ORDEM no SQL Editor do Supabase Dashboard
-- 1) Adicionar coluna payment_method na tabela notes
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2) Adicionar coluna pix_discount na tabela notes (desconto especial para PIX)
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS pix_discount NUMERIC(10,2) DEFAULT 0;

-- 3) Confirmar que store_cnpj existe nas settings
INSERT INTO app_settings (key, value) VALUES ('store_cnpj', '51.803.643/0001-04') ON CONFLICT (key) DO NOTHING;
