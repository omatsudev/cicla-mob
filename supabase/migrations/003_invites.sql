CREATE TABLE IF NOT EXISTS mob_invites (
  token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mob_invites ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode criar convite para si mesmo
CREATE POLICY "owner can insert" ON mob_invites
  FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

-- Qualquer um pode ler (anon também, para a página de convite pública)
CREATE POLICY "anyone can read" ON mob_invites
  FOR SELECT USING (true);

-- Só o sistema (service role) marca como usado
CREATE POLICY "service role update" ON mob_invites
  FOR UPDATE USING (true);
