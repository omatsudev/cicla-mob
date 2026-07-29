-- =============================================================================
-- Somos Billings — Módulo de Notificações e Perfil de Usuário
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Atualiza mob_user_profiles com novos campos
-- ---------------------------------------------------------------------------
ALTER TABLE mob_user_profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'woman'
    CHECK (user_type IN ('woman', 'man')),
  ADD COLUMN IF NOT EXISTS couple_objective TEXT DEFAULT NULL
    CHECK (couple_objective IN ('get_pregnant', 'avoid_pregnancy')),
  ADD COLUMN IF NOT EXISTS notification_hour INTEGER NOT NULL DEFAULT 8
    CHECK (notification_hour >= 0 AND notification_hour <= 23);

-- ---------------------------------------------------------------------------
-- mob_couple_links — vínculo entre parceiros
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mob_couple_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  woman_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  man_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(woman_id),
  UNIQUE(man_id)
);

ALTER TABLE mob_couple_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mob_couple_links_member"
  ON mob_couple_links FOR ALL
  USING (auth.uid() = woman_id OR auth.uid() = man_id)
  WITH CHECK (auth.uid() = woman_id OR auth.uid() = man_id);

-- ---------------------------------------------------------------------------
-- mob_notifications — notificações in-app
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mob_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
    CHECK (type IN ('pms','fertile_period','peak_fertility','return_infertile','daily_reminder')),
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mob_notifications_user
  ON mob_notifications(user_id, created_at DESC);

ALTER TABLE mob_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mob_notifications_owner"
  ON mob_notifications FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
