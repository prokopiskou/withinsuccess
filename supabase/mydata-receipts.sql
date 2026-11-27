-- Αυτόματες αποδείξεις από Stripe → myDATA (αντικατάσταση Oxygen)
-- 1) δημόσιο link απόδειξης για τον πελάτη  2) πότε στάλθηκε email  3) καμία διπλή απόδειξη ανά πληρωμή
create extension if not exists pgcrypto;

alter table mydata_docs add column if not exists public_token uuid not null default gen_random_uuid();
alter table mydata_docs add column if not exists emailed_at timestamptz;
alter table mydata_docs add column if not exists vat_rate numeric not null default 0;

create unique index if not exists mydata_docs_public_token_idx on mydata_docs (public_token);
create unique index if not exists mydata_docs_external_ref_idx on mydata_docs (env, doc_type, external_ref) where external_ref is not null;
