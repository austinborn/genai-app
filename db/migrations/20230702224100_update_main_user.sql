-- migrate:up
alter table main.user
add subscription_tier varchar(13) check (subscription_tier in ('explorer', 'tinkerer', 'creator', 'groundbreaker')),
add email text,
add active boolean;

update main.user set subscription_tier = 'explorer', email = 'REPLACE_ME', active = true;

alter table main.user alter column subscription_tier set not null;
alter table main.user alter column email set not null; 
alter table main.user alter column active set not null;

alter table main.user rename column allow_nsfw to default_nsfw_enabled;

-- migrate:down
alter table main.user rename column default_nsfw_enabled to allow_nsfw;
alter table main.user alter column active drop not null;

alter table main.user
drop subscription_tier,
drop email,
drop active;
