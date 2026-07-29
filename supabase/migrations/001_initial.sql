-- =============================================================================
-- Somos Billings — Database Schema
-- Prefixo "mob_" evita conflito com outras apps no mesmo projeto Supabase.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- mob_daily_records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mob_daily_records (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date              DATE        NOT NULL,
  sensation         TEXT        NOT NULL
    CHECK (sensation IN ('menstruacao','mancha','seca','umida','molhada','escorregadia')),
  mucus_appearance  TEXT        NOT NULL DEFAULT 'nenhum'
    CHECK (mucus_appearance IN ('nenhum','opaco','claro','elastico','com_fios')),
  mucus_quantity    TEXT        NOT NULL DEFAULT 'nenhum'
    CHECK (mucus_quantity IN ('nenhum','pouco','moderado','muito')),
  bleeding_intensity TEXT       NOT NULL DEFAULT 'nenhum'
    CHECK (bleeding_intensity IN ('nenhum','leve','moderado','intenso')),
  notes             TEXT        NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mob_daily_records_user_date
  ON mob_daily_records(user_id, date DESC);

-- ---------------------------------------------------------------------------
-- mob_user_profiles  (dados complementares da usuária)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mob_user_profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT,
  notifications_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Trigger: atualiza updated_at automaticamente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mob_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER mob_daily_records_updated_at
  BEFORE UPDATE ON mob_daily_records
  FOR EACH ROW EXECUTE FUNCTION mob_set_updated_at();

CREATE TRIGGER mob_user_profiles_updated_at
  BEFORE UPDATE ON mob_user_profiles
  FOR EACH ROW EXECUTE FUNCTION mob_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS) — cada usuária vê apenas seus próprios dados
-- ---------------------------------------------------------------------------
ALTER TABLE mob_daily_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mob_user_profiles   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mob_daily_records_owner"
  ON mob_daily_records FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mob_user_profiles_owner"
  ON mob_user_profiles FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
