-- Run this whole file once in Supabase > SQL Editor > New query

create table politicians (
  id serial primary key,
  name text unique not null,
  party text
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  enrollment_no text unique not null,
  email text unique not null,
  phone text not null,
  course text not null,
  year text not null,
  politician_id int unique not null references politicians(id),
  created_at timestamptz default now()
);

-- Lock the tables. Only the server (service role key) can read or write.
alter table politicians enable row level security;
alter table registrations enable row level security;

-- Shows every politician and whether someone has already picked them
create view politician_status as
select p.id, p.name, p.party,
       exists (select 1 from registrations r where r.politician_id = p.id) as taken
from politicians p
order by p.name;



revoke all on politician_status from anon, authenticated;



-- Replace these placeholders with your real list
insert into politicians (name, party) values
  ('Politician One', 'Party A'),
  ('Politician Two', 'Party B'),
  ('Politician Three', 'Party C'),
  ('Politician Four', 'Party D'),
  ('Politician Five', 'Party E'),
  ('Politician Six', 'Party F');


