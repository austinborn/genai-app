-- migrate:up
alter table gpt.completion_request
add max_chat_history_length integer,
add max_chat_history_chars integer;

-- migrate:down
alter table gpt.completion_request
drop max_chat_history_length,
drop max_chat_history_chars;
