SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: gpt; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA gpt;


--
-- Name: main; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA main;


--
-- Name: productivity; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA productivity;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: sd; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sd;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: completion_request; Type: TABLE; Schema: gpt; Owner: -
--

CREATE TABLE gpt.completion_request (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    model text NOT NULL,
    temperature numeric NOT NULL,
    top_p numeric NOT NULL,
    completions integer NOT NULL,
    max_tokens integer,
    presence_penalty numeric,
    frequency_penalty numeric,
    job_uuid uuid NOT NULL,
    previous_message_uuid uuid NOT NULL,
    max_chat_history_length integer,
    max_chat_history_chars integer
);


--
-- Name: latest_message; Type: TABLE; Schema: gpt; Owner: -
--

CREATE TABLE gpt.latest_message (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    workflow_uuid uuid NOT NULL,
    latest_message_uuid uuid NOT NULL
);


--
-- Name: message; Type: TABLE; Schema: gpt; Owner: -
--

CREATE TABLE gpt.message (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role character varying(9) NOT NULL,
    text_uuid uuid NOT NULL,
    completion_request_uuid uuid,
    previous_message_uuid uuid,
    completion_index integer NOT NULL,
    CONSTRAINT message_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


--
-- Name: composite_job; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.composite_job (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    name text NOT NULL,
    composite_job jsonb NOT NULL
);


--
-- Name: file; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.file (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    path text NOT NULL,
    type character varying(5) NOT NULL,
    CONSTRAINT file_type_check CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying])::text[])))
);


--
-- Name: job; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.job (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    workflow_uuid uuid NOT NULL,
    previous_job_uuid uuid,
    job_index integer NOT NULL
);


--
-- Name: oauth_token; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.oauth_token (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    provider text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    scope text NOT NULL,
    token_type text NOT NULL,
    user_uuid uuid NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main."user" (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    google_id text,
    discord_id text,
    default_nsfw_enabled boolean DEFAULT false NOT NULL,
    subscription_tier character varying(13) NOT NULL,
    email text NOT NULL,
    active boolean NOT NULL,
    CONSTRAINT user_subscription_tier_check CHECK (((subscription_tier)::text = ANY ((ARRAY['explorer'::character varying, 'tinkerer'::character varying, 'creator'::character varying, 'groundbreaker'::character varying])::text[])))
);


--
-- Name: workflow; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.workflow (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    latest_job_uuid uuid
);


--
-- Name: action_item; Type: TABLE; Schema: productivity; Owner: -
--

CREATE TABLE productivity.action_item (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    body text,
    estimate text,
    priority character varying(7),
    status character varying(6) NOT NULL,
    previous_action_item_uuid uuid,
    next_action_item_uuid uuid,
    note_uuid uuid NOT NULL,
    advice_tooltip text,
    CONSTRAINT action_item_priority_check CHECK (((priority)::text = ANY ((ARRAY['lowest'::character varying, 'low'::character varying, 'medium'::character varying, 'high'::character varying, 'highest'::character varying])::text[]))),
    CONSTRAINT action_item_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: note; Type: TABLE; Schema: productivity; Owner: -
--

CREATE TABLE productivity.note (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    body text
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: batch; Type: TABLE; Schema: sd; Owner: -
--

CREATE TABLE sd.batch (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    prompt text NOT NULL,
    negative_prompt text,
    height integer,
    width integer,
    steps integer NOT NULL,
    guidance numeric NOT NULL,
    eta numeric NOT NULL,
    allow_nsfw boolean NOT NULL,
    num_seeds integer NOT NULL,
    init_image_uuid uuid,
    strength numeric,
    job_uuid uuid NOT NULL,
    mask_image_uuid uuid
);


--
-- Name: generated_image; Type: TABLE; Schema: sd; Owner: -
--

CREATE TABLE sd.generated_image (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    seed text NOT NULL,
    batch_uuid uuid NOT NULL,
    generated_image_uuid uuid,
    has_nsfw boolean,
    tags text,
    batch_index integer NOT NULL
);


--
-- Name: completion_request completion_request_pkey; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.completion_request
    ADD CONSTRAINT completion_request_pkey PRIMARY KEY (uuid);


--
-- Name: latest_message latest_message_latest_message_uuid_key; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.latest_message
    ADD CONSTRAINT latest_message_latest_message_uuid_key UNIQUE (latest_message_uuid);


--
-- Name: latest_message latest_message_pkey; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.latest_message
    ADD CONSTRAINT latest_message_pkey PRIMARY KEY (uuid);


--
-- Name: latest_message latest_message_workflow_uuid_key; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.latest_message
    ADD CONSTRAINT latest_message_workflow_uuid_key UNIQUE (workflow_uuid);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (uuid);


--
-- Name: message message_text_uuid_key; Type: CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.message
    ADD CONSTRAINT message_text_uuid_key UNIQUE (text_uuid);


--
-- Name: composite_job composite_job_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.composite_job
    ADD CONSTRAINT composite_job_pkey PRIMARY KEY (uuid);


--
-- Name: file file_path_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.file
    ADD CONSTRAINT file_path_key UNIQUE (path);


--
-- Name: file file_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (uuid);


--
-- Name: oauth_token oauth_token_access_token_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.oauth_token
    ADD CONSTRAINT oauth_token_access_token_key UNIQUE (access_token);


--
-- Name: oauth_token oauth_token_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.oauth_token
    ADD CONSTRAINT oauth_token_pkey PRIMARY KEY (uuid);


--
-- Name: oauth_token oauth_token_refresh_token_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.oauth_token
    ADD CONSTRAINT oauth_token_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user user_discord_id_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main."user"
    ADD CONSTRAINT user_discord_id_key UNIQUE (discord_id);


--
-- Name: user user_google_id_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main."user"
    ADD CONSTRAINT user_google_id_key UNIQUE (google_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (uuid);


--
-- Name: workflow workflow_latest_job_uuid_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.workflow
    ADD CONSTRAINT workflow_latest_job_uuid_key UNIQUE (latest_job_uuid);


--
-- Name: workflow workflow_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.workflow
    ADD CONSTRAINT workflow_pkey PRIMARY KEY (uuid);


--
-- Name: action_item action_item_pkey; Type: CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.action_item
    ADD CONSTRAINT action_item_pkey PRIMARY KEY (uuid);


--
-- Name: note note_pkey; Type: CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.note
    ADD CONSTRAINT note_pkey PRIMARY KEY (uuid);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: batch batch_pkey; Type: CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.batch
    ADD CONSTRAINT batch_pkey PRIMARY KEY (uuid);


--
-- Name: generated_image generated_image_generated_image_uuid_key; Type: CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.generated_image
    ADD CONSTRAINT generated_image_generated_image_uuid_key UNIQUE (generated_image_uuid);


--
-- Name: generated_image generated_image_pkey; Type: CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.generated_image
    ADD CONSTRAINT generated_image_pkey PRIMARY KEY (uuid);


--
-- Name: completion_request updated_at; Type: TRIGGER; Schema: gpt; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON gpt.completion_request FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: latest_message updated_at; Type: TRIGGER; Schema: gpt; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON gpt.latest_message FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: message updated_at; Type: TRIGGER; Schema: gpt; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON gpt.message FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: composite_job updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.composite_job FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: file updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.file FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: job updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.job FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: oauth_token updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.oauth_token FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: user updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main."user" FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: workflow updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.workflow FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: action_item updated_at; Type: TRIGGER; Schema: productivity; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON productivity.action_item FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: note updated_at; Type: TRIGGER; Schema: productivity; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON productivity.note FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: batch updated_at; Type: TRIGGER; Schema: sd; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON sd.batch FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: generated_image updated_at; Type: TRIGGER; Schema: sd; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON sd.generated_image FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: completion_request completion_request_job_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.completion_request
    ADD CONSTRAINT completion_request_job_uuid_fkey FOREIGN KEY (job_uuid) REFERENCES main.job(uuid) ON DELETE CASCADE;


--
-- Name: completion_request completion_request_previous_message_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.completion_request
    ADD CONSTRAINT completion_request_previous_message_uuid_fkey FOREIGN KEY (previous_message_uuid) REFERENCES gpt.message(uuid) ON DELETE CASCADE;


--
-- Name: latest_message latest_message_latest_message_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.latest_message
    ADD CONSTRAINT latest_message_latest_message_uuid_fkey FOREIGN KEY (latest_message_uuid) REFERENCES gpt.message(uuid) ON DELETE CASCADE;


--
-- Name: latest_message latest_message_workflow_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.latest_message
    ADD CONSTRAINT latest_message_workflow_uuid_fkey FOREIGN KEY (workflow_uuid) REFERENCES main.workflow(uuid) ON DELETE CASCADE;


--
-- Name: message message_completion_request_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.message
    ADD CONSTRAINT message_completion_request_uuid_fkey FOREIGN KEY (completion_request_uuid) REFERENCES gpt.completion_request(uuid) ON DELETE CASCADE;


--
-- Name: message message_previous_message_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.message
    ADD CONSTRAINT message_previous_message_uuid_fkey FOREIGN KEY (previous_message_uuid) REFERENCES gpt.message(uuid) ON DELETE CASCADE;


--
-- Name: message message_text_uuid_fkey; Type: FK CONSTRAINT; Schema: gpt; Owner: -
--

ALTER TABLE ONLY gpt.message
    ADD CONSTRAINT message_text_uuid_fkey FOREIGN KEY (text_uuid) REFERENCES main.file(uuid) ON DELETE CASCADE;


--
-- Name: composite_job composite_job_user_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.composite_job
    ADD CONSTRAINT composite_job_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid);


--
-- Name: job job_previous_job_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.job
    ADD CONSTRAINT job_previous_job_uuid_fkey FOREIGN KEY (previous_job_uuid) REFERENCES main.job(uuid) ON DELETE CASCADE;


--
-- Name: job job_workflow_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.job
    ADD CONSTRAINT job_workflow_uuid_fkey FOREIGN KEY (workflow_uuid) REFERENCES main.workflow(uuid) ON DELETE CASCADE;


--
-- Name: oauth_token oauth_token_user_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.oauth_token
    ADD CONSTRAINT oauth_token_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid) ON DELETE CASCADE;


--
-- Name: workflow workflow_latest_job_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.workflow
    ADD CONSTRAINT workflow_latest_job_uuid_fkey FOREIGN KEY (latest_job_uuid) REFERENCES main.job(uuid) ON DELETE CASCADE;


--
-- Name: workflow workflow_user_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.workflow
    ADD CONSTRAINT workflow_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid) ON DELETE CASCADE;


--
-- Name: action_item action_item_next_action_item_uuid_fkey; Type: FK CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.action_item
    ADD CONSTRAINT action_item_next_action_item_uuid_fkey FOREIGN KEY (next_action_item_uuid) REFERENCES productivity.action_item(uuid);


--
-- Name: action_item action_item_note_uuid_fkey; Type: FK CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.action_item
    ADD CONSTRAINT action_item_note_uuid_fkey FOREIGN KEY (note_uuid) REFERENCES productivity.note(uuid);


--
-- Name: action_item action_item_previous_action_item_uuid_fkey; Type: FK CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.action_item
    ADD CONSTRAINT action_item_previous_action_item_uuid_fkey FOREIGN KEY (previous_action_item_uuid) REFERENCES productivity.action_item(uuid);


--
-- Name: action_item action_item_user_uuid_fkey; Type: FK CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.action_item
    ADD CONSTRAINT action_item_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid);


--
-- Name: note note_user_uuid_fkey; Type: FK CONSTRAINT; Schema: productivity; Owner: -
--

ALTER TABLE ONLY productivity.note
    ADD CONSTRAINT note_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid);


--
-- Name: batch batch_init_image_uuid_fkey; Type: FK CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.batch
    ADD CONSTRAINT batch_init_image_uuid_fkey FOREIGN KEY (init_image_uuid) REFERENCES main.file(uuid) ON DELETE CASCADE;


--
-- Name: batch batch_job_uuid_fkey; Type: FK CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.batch
    ADD CONSTRAINT batch_job_uuid_fkey FOREIGN KEY (job_uuid) REFERENCES main.job(uuid) ON DELETE CASCADE;


--
-- Name: batch batch_mask_image_uuid_fkey; Type: FK CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.batch
    ADD CONSTRAINT batch_mask_image_uuid_fkey FOREIGN KEY (mask_image_uuid) REFERENCES main.file(uuid);


--
-- Name: generated_image generated_image_batch_uuid_fkey; Type: FK CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.generated_image
    ADD CONSTRAINT generated_image_batch_uuid_fkey FOREIGN KEY (batch_uuid) REFERENCES sd.batch(uuid) ON DELETE CASCADE;


--
-- Name: generated_image generated_image_generated_image_uuid_fkey; Type: FK CONSTRAINT; Schema: sd; Owner: -
--

ALTER TABLE ONLY sd.generated_image
    ADD CONSTRAINT generated_image_generated_image_uuid_fkey FOREIGN KEY (generated_image_uuid) REFERENCES main.file(uuid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20230506142400'),
    ('20230615215500'),
    ('20230702095900'),
    ('20230702224100'),
    ('20230703111500'),
    ('20230708140800'),
    ('20230813171100'),
    ('20230819181100'),
    ('20231013005300'),
    ('20231227020400');
