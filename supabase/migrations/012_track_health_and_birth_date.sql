-- Terceiro objetivo (acompanhar saúde reprodutiva, não só engravidar/evitar gravidez)
-- e data de nascimento, usada para validar que a usuária tem 18 anos ou mais.

ALTER TABLE mob_user_profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE mob_user_profiles
  DROP CONSTRAINT IF EXISTS mob_user_profiles_couple_objective_check;

ALTER TABLE mob_user_profiles
  ADD CONSTRAINT mob_user_profiles_couple_objective_check
  CHECK (couple_objective IN ('get_pregnant', 'avoid_pregnancy', 'track_health'));
