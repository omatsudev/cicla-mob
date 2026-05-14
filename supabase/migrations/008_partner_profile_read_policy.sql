-- Permite que parceiros vinculados leiam o perfil um do outro
CREATE POLICY "mob_user_profiles_partner_read"
  ON mob_user_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mob_couple_links
      WHERE (woman_id = mob_user_profiles.id AND man_id = auth.uid())
         OR (man_id = mob_user_profiles.id AND woman_id = auth.uid())
    )
  );
