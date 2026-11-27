-- Κανονική απόδειξη με ΦΠΑ 24% (εκτός από την απαλλαγή άρθρου 22)
alter table mydata_docs add column if not exists vat_rate numeric not null default 0;
