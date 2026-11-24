-- Within DM: follow-up κάθε λεπτό, δωρεάν, από το Supabase (δουλεύει και με κλειστό laptop).
-- 1. Supabase → Database → Extensions: ενεργοποίησε «pg_cron» και «pg_net».
-- 2. Αντικατέστησε το ΒΑΛΕ_ΤΟ_CRON_SECRET με την τιμή του CRON_SECRET από το Vercel.
-- 3. Run.

select cron.unschedule('within-dm-followups')
where exists (select 1 from cron.job where jobname = 'within-dm-followups');

select cron.schedule(
  'within-dm-followups',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://withinsuccess.gr/api/ig/followups',
    headers := jsonb_build_object('Authorization', 'Bearer ΒΑΛΕ_ΤΟ_CRON_SECRET')
  );
  $$
);
