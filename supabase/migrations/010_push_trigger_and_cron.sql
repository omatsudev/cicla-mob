-- Trigger: notifica parceiro quando mulher insere registro diário
-- (a URL e o service key são hardcoded pois pg_cron/net não suportam variáveis de ambiente)
CREATE OR REPLACE FUNCTION notify_partner_on_record()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://utesgzaybftosklfuhnt.supabase.co/functions/v1/partner-record-notify',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY_PLACEHOLDER", "Content-Type": "application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::text::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_partner_on_record
  AFTER INSERT ON mob_daily_records
  FOR EACH ROW EXECUTE FUNCTION notify_partner_on_record();

-- Cron: lembrete diário a cada hora cheia (filtra por notification_hour no Edge Function)
SELECT cron.schedule(
  'daily-reminder-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://utesgzaybftosklfuhnt.supabase.co/functions/v1/daily-reminder',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY_PLACEHOLDER", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
