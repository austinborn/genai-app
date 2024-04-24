-- migrate:up
alter table gpt.completion_request drop constraint completion_request_job_uuid_fkey;
alter table gpt.completion_request drop constraint completion_request_previous_message_uuid_fkey;
alter table gpt.latest_message drop constraint latest_message_latest_message_uuid_fkey;
alter table gpt.latest_message drop constraint latest_message_workflow_uuid_fkey;
alter table gpt.message drop constraint message_completion_request_uuid_fkey;
alter table gpt.message drop constraint message_previous_message_uuid_fkey;
alter table gpt.message drop constraint message_text_uuid_fkey;
alter table main.job drop constraint job_previous_job_uuid_fkey;
alter table main.job drop constraint job_workflow_uuid_fkey;
alter table main.oauth_token drop constraint oauth_token_user_uuid_fkey;
alter table main.workflow drop constraint workflow_latest_job_uuid_fkey;
alter table main.workflow drop constraint workflow_user_uuid_fkey;
alter table sd.batch drop constraint batch_init_image_uuid_fkey;
alter table sd.batch drop constraint batch_job_uuid_fkey;
alter table sd.generated_image drop constraint generated_image_batch_uuid_fkey;
alter table sd.generated_image drop constraint generated_image_generated_image_uuid_fkey;

alter table gpt.completion_request add constraint completion_request_job_uuid_fkey
foreign key (job_uuid) references main.job (uuid) on delete cascade on update no action;

alter table gpt.completion_request add constraint completion_request_previous_message_uuid_fkey
foreign key (previous_message_uuid) references gpt.message (uuid) on delete cascade on update no action;

alter table gpt.latest_message add constraint latest_message_latest_message_uuid_fkey
foreign key (latest_message_uuid) references gpt.message (uuid) on delete cascade on update no action;

alter table gpt.latest_message add constraint latest_message_workflow_uuid_fkey
foreign key (workflow_uuid) references main.workflow (uuid) on delete cascade on update no action;

alter table gpt.message add constraint message_completion_request_uuid_fkey
foreign key (completion_request_uuid) references gpt.completion_request (uuid) on delete cascade on update no action;

alter table gpt.message add constraint message_previous_message_uuid_fkey
foreign key (previous_message_uuid) references gpt.message (uuid) on delete cascade on update no action;

alter table gpt.message add constraint message_text_uuid_fkey
foreign key (text_uuid) references main.file (uuid) on delete cascade on update no action;

alter table main.job add constraint job_previous_job_uuid_fkey
foreign key (previous_job_uuid) references main.job (uuid) on delete cascade on update no action;

alter table main.job add constraint job_workflow_uuid_fkey
foreign key (workflow_uuid) references main.workflow (uuid) on delete cascade on update no action;

alter table main.oauth_token add constraint oauth_token_user_uuid_fkey
foreign key (user_uuid) references main.user (uuid) on delete cascade on update no action;

alter table main.workflow add constraint workflow_latest_job_uuid_fkey
foreign key (latest_job_uuid) references main.job (uuid) on delete cascade on update no action;

alter table main.workflow add constraint workflow_user_uuid_fkey
foreign key (user_uuid) references main.user (uuid) on delete cascade on update no action;

alter table sd.batch add constraint batch_init_image_uuid_fkey
foreign key (init_image_uuid) references main.file (uuid) on delete cascade on update no action;

alter table sd.batch add constraint batch_job_uuid_fkey
foreign key (job_uuid) references main.job (uuid) on delete cascade on update no action;

alter table sd.generated_image add constraint generated_image_batch_uuid_fkey
foreign key (batch_uuid) references sd.batch (uuid) on delete cascade on update no action;

alter table sd.generated_image add constraint generated_image_generated_image_uuid_fkey
foreign key (generated_image_uuid) references main.file (uuid) on delete cascade on update no action;

-- migrate:down
alter table gpt.completion_request drop constraint completion_request_job_uuid_fkey;
alter table gpt.completion_request drop constraint completion_request_previous_message_uuid_fkey;
alter table gpt.latest_message drop constraint latest_message_latest_message_uuid_fkey;
alter table gpt.latest_message drop constraint latest_message_workflow_uuid_fkey;
alter table gpt.message drop constraint message_completion_request_uuid_fkey;
alter table gpt.message drop constraint message_previous_message_uuid_fkey;
alter table gpt.message drop constraint message_text_uuid_fkey;
alter table main.job drop constraint job_previous_job_uuid_fkey;
alter table main.job drop constraint job_workflow_uuid_fkey;
alter table main.oauth_token drop constraint oauth_token_user_uuid_fkey;
alter table main.workflow drop constraint workflow_latest_job_uuid_fkey;
alter table main.workflow drop constraint workflow_user_uuid_fkey;
alter table sd.batch drop constraint batch_init_image_uuid_fkey;
alter table sd.batch drop constraint batch_job_uuid_fkey;
alter table sd.generated_image drop constraint generated_image_batch_uuid_fkey;
alter table sd.generated_image drop constraint generated_image_generated_image_uuid_fkey;

alter table gpt.completion_request add constraint completion_request_job_uuid_fkey
foreign key (job_uuid) references main.job (uuid);

alter table gpt.completion_request add constraint completion_request_previous_message_uuid_fkey
foreign key (previous_message_uuid) references gpt.message (uuid);

alter table gpt.latest_message add constraint latest_message_latest_message_uuid_fkey
foreign key (latest_message_uuid) references gpt.message (uuid);

alter table gpt.latest_message add constraint latest_message_workflow_uuid_fkey
foreign key (workflow_uuid) references main.workflow (uuid);

alter table gpt.message add constraint message_completion_request_uuid_fkey
foreign key (completion_request_uuid) references gpt.completion_request (uuid);

alter table gpt.message add constraint message_previous_message_uuid_fkey
foreign key (previous_message_uuid) references gpt.message (uuid);

alter table gpt.message add constraint message_text_uuid_fkey
foreign key (text_uuid) references main.file (uuid);

alter table main.job add constraint job_previous_job_uuid_fkey
foreign key (previous_job_uuid) references main.job (uuid);

alter table main.job add constraint job_workflow_uuid_fkey
foreign key (workflow_uuid) references main.workflow (uuid);

alter table main.oauth_token add constraint oauth_token_user_uuid_fkey
foreign key (user_uuid) references main.user (uuid);

alter table main.workflow add constraint workflow_latest_job_uuid_fkey
foreign key (latest_job_uuid) references main.job (uuid);

alter table main.workflow add constraint workflow_user_uuid_fkey
foreign key (user_uuid) references main.user (uuid);

alter table sd.batch add constraint batch_init_image_uuid_fkey
foreign key (init_image_uuid) references main.file (uuid);

alter table sd.batch add constraint batch_job_uuid_fkey
foreign key (job_uuid) references main.job (uuid);

alter table sd.generated_image add constraint generated_image_batch_uuid_fkey
foreign key (batch_uuid) references sd.batch (uuid);

alter table sd.generated_image add constraint generated_image_generated_image_uuid_fkey
foreign key (generated_image_uuid) references main.file (uuid);
