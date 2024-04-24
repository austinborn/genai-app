-- migrate:up
create table gpt.latest_message (
	uuid uuid primary key default gen_random_uuid(),
  created_at timestamp not null default CURRENT_TIMESTAMP,
	updated_at timestamp not null default CURRENT_TIMESTAMP,
  workflow_uuid uuid unique not null references main.workflow,
  latest_message_uuid uuid unique not null references gpt.message
);

create trigger updated_at
before update
on gpt.latest_message
for each row
execute procedure updated_at();

insert into gpt.latest_message (workflow_uuid, latest_message_uuid)
select workflow_uuid, latest_message_uuid from 
(
  select ROW_NUMBER() over (
    partition by w.uuid order by lm.created_at desc
  ) as r,
  w.uuid as workflow_uuid,
  lm.uuid as latest_message_uuid
  from gpt.message lm
  join gpt.completion_request cr on cr.uuid = lm.completion_request_uuid
  join main.job j on j.uuid = cr.job_uuid 
  join main.workflow w on w.uuid = j.workflow_uuid 
  left join gpt.message next_m on next_m.previous_message_uuid = lm.uuid
  where next_m.uuid is null
) last_message where last_message.r = 1;

-- migrate:down
drop table if exists gpt.latest_message cascade;
