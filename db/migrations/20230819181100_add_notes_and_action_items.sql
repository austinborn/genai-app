-- migrate:up
create schema productivity;

create table productivity.note (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  user_uuid uuid not null references main.user,
  body text
);

create trigger updated_at
before update
on productivity.note
for each row
execute procedure updated_at();

create table productivity.action_item (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  user_uuid uuid not null references main.user,
  body text,
  estimate text,
  priority varchar(7) check (priority in ('lowest', 'low', 'medium', 'high', 'highest')),
  status varchar(6) not null check (status in ('open', 'in_progress', 'closed')),
  previous_action_item_uuid uuid references productivity.action_item,
  next_action_item_uuid uuid references productivity.action_item,
  note_uuid uuid not null references productivity.note
);

create trigger updated_at
before update
on productivity.action_item
for each row
execute procedure updated_at();

-- migrate:down
drop schema if exists productivity cascade;
