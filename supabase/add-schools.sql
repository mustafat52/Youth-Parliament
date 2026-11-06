-- Run ONCE in Supabase > SQL Editor if you already ran the old schema.sql.
-- Adds multi-school support. Existing registrations are moved to a school called "ITM University".

create table schools (
  id serial primary key,
  name text not null,
  slug text unique not null,
  is_open boolean not null default true,
  created_at timestamptz default now()
);
alter table schools enable row level security;

insert into schools (name, slug) values ('ITM University', 'itm-university');

alter table registrations add column school_id int references schools(id) on delete cascade;
update registrations set school_id = (select id from schools where slug = 'itm-university');
alter table registrations alter column school_id set not null;

-- Uniqueness now applies inside each school, not across the whole event
alter table registrations drop constraint if exists registrations_politician_id_key;
alter table registrations drop constraint if exists registrations_email_key;
alter table registrations drop constraint if exists registrations_enrollment_no_key;
alter table registrations add constraint reg_school_politician_key unique (school_id, politician_id);
alter table registrations add constraint reg_school_email_key unique (school_id, email);
alter table registrations add constraint reg_school_enrollment_key unique (school_id, enrollment_no);

-- The old view counted "taken" across all schools, so it is no longer used
drop view if exists politician_status;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
