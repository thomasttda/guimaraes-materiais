-- Execute EM ORDEM no SQL Editor do Supabase Dashboard
-- 1) Adicionar coluna payment_method na tabela notes
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2) Confirmar que store_cnpj existe nas settings
INSERT INTO app_settings (key, value) VALUES ('store_cnpj', '51.803.643/0001-04') ON CONFLICT (key) DO NOTHING;
