-- =============================================================================
-- Cicla MOB — Seed de dados de amostragem
-- Execute no SQL Editor do Supabase após rodar a migration 002_notifications.sql
-- =============================================================================

-- UUIDs fixos para os usuários de teste
DO $$
DECLARE
  woman_id UUID := 'a1000000-0000-0000-0000-000000000001';
  man_id   UUID := 'a2000000-0000-0000-0000-000000000002';
BEGIN

-- ---------------------------------------------------------------------------
-- Criar usuários na tabela auth.users
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) VALUES (
  woman_id, '00000000-0000-0000-0000-000000000000',
  'ana.cicla@teste.com', crypt('Cicla2026!', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Ana Silva"}',
  'authenticated', 'authenticated', NOW(), NOW()
), (
  man_id, '00000000-0000-0000-0000-000000000000',
  'pedro.cicla@teste.com', crypt('Cicla2026!', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Pedro Silva"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Identidades (necessário para login via email)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), woman_id,
  json_build_object('sub', woman_id::text, 'email', 'ana.cicla@teste.com'),
  'email', 'ana.cicla@teste.com', NOW(), NOW(), NOW()
), (
  gen_random_uuid(), man_id,
  json_build_object('sub', man_id::text, 'email', 'pedro.cicla@teste.com'),
  'email', 'pedro.cicla@teste.com', NOW(), NOW(), NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Perfis dos usuários
-- ---------------------------------------------------------------------------
INSERT INTO mob_user_profiles (id, name, user_type, couple_objective, notifications_enabled, notification_hour)
VALUES
  (woman_id, 'Ana Silva',   'woman', 'avoid_pregnancy', true, 8),
  (man_id,   'Pedro Silva', 'man',   'avoid_pregnancy', true, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  user_type = EXCLUDED.user_type,
  couple_objective = EXCLUDED.couple_objective,
  notifications_enabled = EXCLUDED.notifications_enabled;

-- ---------------------------------------------------------------------------
-- Vínculo de casal
-- ---------------------------------------------------------------------------
INSERT INTO mob_couple_links (woman_id, man_id)
VALUES (woman_id, man_id)
ON CONFLICT (woman_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Registros diários da Ana (ciclo de 28 dias)
-- Ciclo iniciou em 25/03/2026 — hoje é dia 28 (21/04/2026)
-- ---------------------------------------------------------------------------
INSERT INTO mob_daily_records (user_id, date, sensation, mucus_appearance, mucus_quantity, bleeding_intensity, notes)
VALUES
  -- Menstruação (dias 1-5)
  (woman_id, '2026-03-25', 'menstruacao', 'nenhum', 'nenhum', 'intenso',  'Início do ciclo'),
  (woman_id, '2026-03-26', 'menstruacao', 'nenhum', 'nenhum', 'intenso',  ''),
  (woman_id, '2026-03-27', 'menstruacao', 'nenhum', 'nenhum', 'moderado', ''),
  (woman_id, '2026-03-28', 'menstruacao', 'nenhum', 'nenhum', 'leve',     ''),
  (woman_id, '2026-03-29', 'menstruacao', 'nenhum', 'nenhum', 'leve',     'Finalizando'),
  -- PBI Seco (dias 6-9)
  (woman_id, '2026-03-30', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-03-31', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-01', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-02', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  -- Mudança de padrão (dia 10)
  (woman_id, '2026-04-03', 'umida', 'opaco', 'pouco', 'nenhum', 'Percebi algo diferente'),
  -- Fértil (dias 11-13)
  (woman_id, '2026-04-04', 'umida',    'claro', 'moderado', 'nenhum', ''),
  (woman_id, '2026-04-05', 'molhada',  'claro', 'moderado', 'nenhum', ''),
  (woman_id, '2026-04-06', 'molhada',  'claro', 'muito',    'nenhum', ''),
  -- Ápice / Pico (dia 14)
  (woman_id, '2026-04-07', 'escorregadia', 'elastico', 'muito', 'nenhum', 'Pico de fertilidade'),
  -- Pós-ápice 1/2/3 (dias 15-17)
  (woman_id, '2026-04-08', 'umida', 'opaco', 'pouco',  'nenhum', ''),
  (woman_id, '2026-04-09', 'seca',  'nenhum','nenhum', 'nenhum', ''),
  (woman_id, '2026-04-10', 'seca',  'nenhum','nenhum', 'nenhum', ''),
  -- Fase lútea / infértil (dias 18-27) — sem registrar hoje (dia 28) para disparar lembrete
  (woman_id, '2026-04-11', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-12', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-13', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-14', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-15', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-16', 'seca', 'nenhum', 'nenhum', 'nenhum', 'Cólica leve'),
  (woman_id, '2026-04-17', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-18', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-19', 'seca', 'nenhum', 'nenhum', 'nenhum', ''),
  (woman_id, '2026-04-20', 'seca', 'nenhum', 'nenhum', 'nenhum', '')
  -- Dia 21/04 sem registro → disparará lembrete diário e notificação de TPM (dia 11 de fase lútea)
ON CONFLICT (user_id, date) DO NOTHING;

RAISE NOTICE '✅ Seed concluído!';
RAISE NOTICE '   Mulher: ana.cicla@teste.com / Cicla2026!';
RAISE NOTICE '   Homem:  pedro.cicla@teste.com / Cicla2026!';

END $$;
