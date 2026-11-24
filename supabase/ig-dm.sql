-- Within DM: δικό μας «ManyChat» για σχόλιο → DM στο Instagram.
-- Τρέξ' το στο Supabase → SQL Editor. Μπορεί να τρέξει ξανά χωρίς πρόβλημα.

create table if not exists ig_automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  keywords text[] not null default '{}',
  media_id text,                 -- null = οποιοδήποτε post / reel
  media_caption text,
  media_thumb text,
  public_replies text[] not null default '{}',
  dm_text text not null,         -- πρώτο μήνυμα
  button_label text,             -- κουμπί του link
  link_url text,
  trigger_dm boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Επιλογές ροής
alter table ig_automations add column if not exists use_tap boolean not null default true;          -- κουμπί «Στείλε μου το link» πριν το link
alter table ig_automations add column if not exists tap_label text not null default 'Στείλε μου το link';
alter table ig_automations add column if not exists link_text text not null default 'Ορίστε 👇';
alter table ig_automations add column if not exists follow_gate boolean not null default false;     -- ζητάει follow πρώτα
alter table ig_automations add column if not exists follow_text text not null default 'Για να σου το στείλω, κάνε πρώτα follow στο προφίλ και μετά πάτα το κουμπί.';
alter table ig_automations add column if not exists follow_label text not null default 'Σε ακολουθώ';
alter table ig_automations add column if not exists followup_enabled boolean not null default true;
alter table ig_automations add column if not exists followup_minutes int not null default 60;
alter table ig_automations add column if not exists followup_text text not null default 'Το link σου είναι ακόμα εδώ 👇';

-- Κάθε άτομο που μπήκε στη ροή (επαφές + funnel)
create table if not exists ig_threads (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references ig_automations(id) on delete cascade,
  ig_user_id text not null,
  username text,
  source text not null default 'comment',   -- comment | dm
  ref_id text unique,                       -- comment id ή message id
  comment_text text,
  stage text not null default 'new',        -- new | dm_sent | follow_asked | link_sent | clicked | failed
  follows boolean,
  follow_asks int not null default 0,
  created_at timestamptz not null default now(),
  dm_sent_at timestamptz,
  tapped_at timestamptz,
  link_sent_at timestamptz,
  clicked_at timestamptz,
  followup_due_at timestamptz,
  followup_sent_at timestamptz,
  last_error text
);
create index if not exists ig_threads_auto on ig_threads (automation_id, created_at desc);
create index if not exists ig_threads_user on ig_threads (ig_user_id, automation_id, created_at desc);
create index if not exists ig_threads_followup on ig_threads (followup_due_at) where followup_sent_at is null and clicked_at is null;

-- Log δραστηριότητας
create table if not exists ig_events (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references ig_automations(id) on delete set null,
  type text not null,
  ig_user_id text,
  username text,
  ref_id text,
  detail text,
  created_at timestamptz not null default now()
);
create unique index if not exists ig_events_dedup on ig_events (type, ref_id) where ref_id is not null;
create index if not exists ig_events_created on ig_events (created_at desc);

create table if not exists ig_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

drop view if exists ig_automation_stats;
create or replace view ig_funnel as
select
  automation_id,
  count(*)                                  as commented,
  count(dm_sent_at)                         as dm_sent,
  count(tapped_at)                          as tapped,
  count(link_sent_at)                       as link_sent,
  count(clicked_at)                         as clicked,
  count(followup_sent_at)                   as followups,
  count(*) filter (where stage = 'failed')  as failed
from ig_threads
group by automation_id;

alter table ig_automations enable row level security;
alter table ig_threads enable row level security;
alter table ig_events enable row level security;
alter table ig_settings enable row level security;
