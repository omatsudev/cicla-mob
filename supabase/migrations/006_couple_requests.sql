-- Solicitações de vínculo de casal
CREATE TABLE IF NOT EXISTS mob_couple_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','accepted','rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mob_couple_requests ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode criar solicitação para si mesmo
CREATE POLICY "mob_couple_requests_insert"
  ON mob_couple_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- Solicitante ou alvo podem ver
CREATE POLICY "mob_couple_requests_select"
  ON mob_couple_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_email = auth.email());

-- Alvo pode aceitar ou recusar
CREATE POLICY "mob_couple_requests_update"
  ON mob_couple_requests FOR UPDATE TO authenticated
  USING (target_email = auth.email())
  WITH CHECK (target_email = auth.email());

-- Solicitante pode cancelar
CREATE POLICY "mob_couple_requests_delete"
  ON mob_couple_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid());
