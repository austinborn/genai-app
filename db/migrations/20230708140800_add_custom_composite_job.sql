-- migrate:up
create table main.composite_job (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  user_uuid uuid not null references main.user,
  name text not null,
  composite_job jsonb not null
);

create trigger updated_at
before update
on main.composite_job
for each row
execute procedure updated_at();

-- migrate:down
drop table if exists main.composite_job cascade;
