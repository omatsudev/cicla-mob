CREATE TABLE IF NOT EXISTS mob_cycle_names (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  name        TEXT NOT NULL,
  PRIMARY KEY (user_id, cycle_start)
);

ALTER TABLE mob_cycle_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON mob_cycle_names
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
