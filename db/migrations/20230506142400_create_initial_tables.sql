-- migrate:up
create or replace function updated_at() returns trigger
language plpgsql
as
$$
begin
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
end;
$$;

create schema main;

create table main.user (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  google_id text unique,
  discord_id text unique,
  allow_nsfw boolean not null default false
);

create trigger updated_at
before update
on main.user
for each row
execute procedure updated_at();

create table main.oauth_token (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  provider text not null,
  access_token text unique not null,
  refresh_token text unique not null,
  expires_at timestamp not null,
  scope text not null,
  token_type text not null,
  user_uuid uuid not null references main.user
);

create trigger updated_at
before update
on main.oauth_token
for each row
execute procedure updated_at();

create table main.file (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  path text unique not null,
  type varchar(5) not null check (type in ('text', 'image'))
);

create trigger updated_at
before update
on main.file
for each row
execute procedure updated_at();

create table main.workflow (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  user_uuid uuid not null references main.user
);

create trigger updated_at
before update
on main.workflow
for each row
execute procedure updated_at();

create table main.job (
  uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  workflow_uuid uuid not null references main.workflow,
  previous_job_uuid uuid references main.job,
  job_index integer not null
);

alter table main.workflow
add latest_job_uuid uuid unique references main.job;

create trigger updated_at
before update
on main.job
for each row
execute procedure updated_at();

create schema sd;

create table sd.batch (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  prompt text not null,
  negative_prompt text,
  height integer not null,
  width integer not null,
  steps integer not null,
  guidance numeric not null,
  eta numeric not null,
  allow_nsfw boolean not null,
  num_seeds integer not null,
  init_image_uuid uuid references main.file,
  strength numeric,
  job_uuid uuid not null references main.job
);

create trigger updated_at
before update
on sd.batch
for each row
execute procedure updated_at();

create table sd.generated_image (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  seed text not null,
  batch_uuid uuid not null references sd.batch,
  generated_image_uuid uuid unique references main.file,
  has_nsfw boolean,
  tags text,
  batch_index integer not null
);

create trigger updated_at
before update
on sd.generated_image
for each row
execute procedure updated_at();

create schema gpt;

create table gpt.completion_request (
  uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  model text not null,
  temperature numeric not null,
  top_p numeric not null,
  completions integer not null,
  max_tokens integer,
  presence_penalty numeric,
  frequency_penalty numeric,
  job_uuid uuid not null references main.job
);

create trigger updated_at
before update
on gpt.completion_request
for each row
execute procedure updated_at();

create table gpt.message (
  uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  role varchar(9) not null check (role in ('user', 'assistant', 'system')),
  text_uuid uuid not null unique references main.file,
  completion_request_uuid uuid references gpt.completion_request,
  previous_message_uuid uuid references gpt.message,
  completion_index integer not null
);

alter table gpt.completion_request
add previous_message_uuid uuid not null references gpt.message;

create trigger updated_at
before update
on gpt.message
for each row
execute procedure updated_at();

-- migrate:down
drop schema if exists gpt cascade;

drop schema if exists sd cascade;

drop schema if exists main cascade;

drop function IF EXISTS updated_at() CASCADE;
