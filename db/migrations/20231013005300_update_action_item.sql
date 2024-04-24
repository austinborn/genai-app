-- migrate:up
alter table productivity.action_item add advice_tooltip text;

-- migrate:down
alter table productivity.action_item drop advice_tooltip;
