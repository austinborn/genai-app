-- migrate:up
alter table sd.batch alter column height drop not null;
alter table sd.batch alter column width drop not null;

-- migrate:down
update sd.batch set height = 512 where height is null;
update sd.batch set width = 512 where width is null;

alter table sd.batch alter column height set not null;
alter table sd.batch alter column width set not null;
