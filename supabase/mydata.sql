-- myDATA: παραστατικά που εκδίδει απευθείας το site (δοκιμαστικό στάδιο).
-- Μπορεί να τρέξει ξανά χωρίς πρόβλημα.

create table if not exists mydata_series (
  env text not null,
  series text not null,
  last_aa int not null default 0,
  primary key (env, series)
);

create table if not exists mydata_docs (
  id uuid primary key default gen_random_uuid(),
  env text not null,                 -- dev | prod
  doc_type text not null,            -- 11.2 ΑΠΥ | 11.4 πιστωτικό
  series text not null,
  aa int not null,
  issue_date date not null,
  amount numeric(10,2) not null,
  payment_type int not null,         -- 7 κάρτα (POS/e-POS), 8 IRIS, 6 web banking
  description text,
  customer_email text,
  external_ref text,                 -- Stripe/Viva αναφορά
  mark text,
  uid text,
  qr_url text,
  correlated_mark text,              -- για πιστωτικό: MARK της αρχικής
  status text not null default 'pending',  -- pending | sent | failed | cancelled
  error text,
  created_at timestamptz not null default now(),
  unique (env, series, aa)
);
create index if not exists mydata_docs_created on mydata_docs (env, created_at desc);
create unique index if not exists mydata_docs_ref on mydata_docs (env, doc_type, external_ref) where external_ref is not null;

-- Ατομική αρίθμηση ανά περιβάλλον + σειρά (χωρίς διπλά νούμερα όταν έρχονται δύο πληρωμές μαζί)
create or replace function mydata_next_aa(p_env text, p_series text)
returns int
language plpgsql
as $$
declare v int;
begin
  insert into mydata_series (env, series, last_aa) values (p_env, p_series, 1)
  on conflict (env, series) do update set last_aa = mydata_series.last_aa + 1
  returning last_aa into v;
  return v;
end;
$$;

alter table mydata_series enable row level security;
alter table mydata_docs enable row level security;
