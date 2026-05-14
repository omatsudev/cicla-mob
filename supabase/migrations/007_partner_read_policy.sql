-- Permite que o parceiro (homem) leia os registros diários da esposa vinculada
CREATE POLICY "mob_daily_records_partner_read"
  ON mob_daily_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mob_couple_links
      WHERE woman_id = mob_daily_records.user_id
        AND man_id = auth.uid()
    )
  );
