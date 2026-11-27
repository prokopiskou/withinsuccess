-- Ταμείο (τύπου Oxygen) πάνω στο myDATA: πελάτης, προϊόν, ποσότητα + κατάλογος προϊόντων.
alter table mydata_docs add column if not exists customer_name text;
alter table mydata_docs add column if not exists product text;
alter table mydata_docs add column if not exists quantity int not null default 1;
alter table mydata_docs add column if not exists unit_price numeric(10,2);
alter table mydata_docs add column if not exists source text not null default 'manual';  -- manual | stripe | viva

create table if not exists mydata_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table mydata_products enable row level security;

insert into mydata_products (name, price)
select * from (values
  ('30 Μέρες Μεταμόρφωσης', 15.00),
  ('Coaching · 6 συνεδρίες', 240.00),
  ('GROW · μηνιαία συνδρομή', 120.00),
  ('Σεμινάριο · εισιτήριο', 15.00)
) v(name, price)
where not exists (select 1 from mydata_products);
