-- Within DM: follow-up κάθε λεπτό, δωρεάν, από το Supabase (δουλεύει και με κλειστό laptop).
-- Θέλει ενεργά τα extensions pg_cron και pg_net (Database → Extensions).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('within-dm-followups')
where exists (select 1 from cron.job where jobname = 'within-dm-followups');

select cron.schedule(
  'within-dm-followups',
  '* * * * *',
  $$ select net.http_get(url := 'https://withinsuccess.gr/api/ig/followups'); $$
);
