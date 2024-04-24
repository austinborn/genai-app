import {existsSyncRelative, readFileSyncRelative, unlinkSyncRelative } from '../utils'
import { Chat, JobWithData, ListedJob, ListedWorkflow, RequestHandler, WorkflowWithPreface } from '../types'
import { dbClient } from '../dbClient'
import { GPT3_5TURBO, SD0_4 } from '../const'
import { deleteWorkflowSchema, listJobsSchema } from "../schema"

const MAX_PREFACE_LENGTH = 40

export const deleteWorkflow: RequestHandler<typeof deleteWorkflowSchema, string> = async (user, request) => {
  const { workflowUuid } = request

  if (typeof workflowUuid !== 'string') {
    return { response: "Expected argument 'workflowUuid' to have type 'string'", error: true }
  }

  const [fileList] = await dbClient.query(`\
    select coalesce(sd_f.path, gpt_f.path) as gen_file_path, gpt_pf.path as user_file_path  \
    from main.workflow w \
    left join main.job j on j.workflow_uuid = w.uuid \
    left join sd.batch b on b.job_uuid = j.uuid \
    left join sd.generated_image gi on gi.batch_uuid = b.uuid \
    left join gpt.completion_request cr on cr.job_uuid = j.uuid \
    left join gpt.message m on m.completion_request_uuid = cr.uuid \
    left join gpt.message pm on pm.uuid = cr.previous_message_uuid \
    left join main.file sd_f on sd_f.uuid = gi.generated_image_uuid \
    left join main.file gpt_f on gpt_f.uuid = m.text_uuid \
    left join main.file gpt_pf on gpt_pf.uuid = pm.text_uuid \
    where j.workflow_uuid = '${workflowUuid}' \
  `) as { gen_file_path: string, user_file_path: string }[][]

  for (const file of fileList) {
    if (file.gen_file_path && existsSyncRelative(file.gen_file_path)) {
      unlinkSyncRelative(file.gen_file_path)
    }
    if (file.user_file_path && existsSyncRelative(file.user_file_path)) {
      unlinkSyncRelative(file.user_file_path)
    }
  }

  await dbClient.query(`\
    with file_list as (
      select coalesce(sd_f.uuid, gpt_f.uuid) as gen_file_uuid, gpt_pf.uuid as user_file_uuid \
      from main.workflow w \
      left join main.job j on j.workflow_uuid = w.uuid \
      left join sd.batch b on b.job_uuid = j.uuid \
      left join sd.generated_image gi on gi.batch_uuid = b.uuid \
      left join main.file sd_f on sd_f.uuid = gi.generated_image_uuid \
      left join gpt.completion_request cr on cr.job_uuid = j.uuid \
      left join gpt.message m on m.completion_request_uuid = cr.uuid \
      left join gpt.message pm on pm.uuid = cr.previous_message_uuid \
      left join main.file gpt_f on gpt_f.uuid = m.text_uuid \
      left join main.file gpt_pf on gpt_pf.uuid = pm.text_uuid \
      where j.workflow_uuid = '${workflowUuid}' \
    ) \
    delete from main.file f \
    where f.uuid in (select gen_file_uuid from file_list) \
    or f.uuid in (select user_file_uuid from file_list)
  `)

  await dbClient.query(`\
    delete from main.workflow \
    where uuid = '${workflowUuid}' \
  `)

  return { response: `workflow ${workflowUuid} deleted` }
}

export const listWorkflows: RequestHandler<any, WorkflowWithPreface[]> = async (user) => {
  const [workflowList] = await dbClient.query(`\
    select w.uuid, w.created_at, w.updated_at, w.latest_job_uuid, b.prompt as sd_prompt, f.path as gpt_message_path, pf.path as gpt_prev_message_path, lm.latest_message_uuid \
    from main.workflow w \
    left join main.job j on j.uuid = w.latest_job_uuid \
    left join sd.batch b on b.job_uuid = j.uuid \
    left join gpt.completion_request cr on cr.job_uuid = j.uuid \
    left join gpt.message m on m.completion_request_uuid = cr.uuid \
    left join main.file f on f.uuid = m.text_uuid \
    left join gpt.message pm on pm.uuid = cr.previous_message_uuid \
    left join main.file pf on pf.uuid = pm.text_uuid \
    left join gpt.latest_message lm on lm.workflow_uuid = w.uuid \
    where w.user_uuid = '${user.uuid}' \
    order by w.updated_at desc \
  `) as ListedWorkflow[][]

  const workflowData = workflowList.map(w => {
    const workflow = {
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      uuid: w.uuid,
      preface: '',
      latestJobUuid: w.latest_job_uuid,
      latestMessageUuid: w.latest_message_uuid
    }
    if (w.gpt_message_path && existsSyncRelative(w.gpt_message_path)) {
      workflow.preface = readFileSyncRelative(w.gpt_message_path).toString()
    } else if (w.gpt_prev_message_path && existsSyncRelative(w.gpt_prev_message_path)) {
      workflow.preface = readFileSyncRelative(w.gpt_prev_message_path).toString()
    } else {
      workflow.preface = w.sd_prompt ?? ''
    }
    if (workflow.preface === '') workflow.preface = 'New Workflow'
    if (workflow.preface.length > MAX_PREFACE_LENGTH) workflow.preface = workflow.preface.slice(0,MAX_PREFACE_LENGTH-2) + '...'

    return workflow
  })

  return { response: workflowData }
}

export const listJobs: RequestHandler<typeof listJobsSchema, { rows: JobWithData[], hasMore: boolean }> = async (user, request) => {
  const { headJobUuid, count } = request

  const [jobList] = await dbClient.query(`\
    select * from ( \
      with recursive recursive_job (uuid) as ( \
        select j.uuid, j.previous_job_uuid, j.created_at \
        from main.job j \
        where j.uuid = '${headJobUuid}' \
        union all \
        select j.uuid, j.previous_job_uuid, j.created_at \
        from main.job j \
        join recursive_job rj on rj.previous_job_uuid = j.uuid \
      ) \
      select rj.uuid, rj.previous_job_uuid, rj.created_at as rj_created_at, \
      b.uuid as batch_uuid, b.prompt as batch_prompt, b.negative_prompt as batch_negative_prompt, \
      b.height as batch_height, b.width as batch_width, b.steps as batch_steps, \
      b.guidance as batch_guidance, b.eta as batch_eta, b.allow_nsfw as batch_allow_nsfw, \
      b.num_seeds as batch_num_seeds, bf.path as batch_init_image_path, b.strength as batch_strength, \
      cr.uuid as completion_request_uuid \
      from recursive_job rj \
      left join sd.batch b on b.job_uuid = rj.uuid \
      left join main.file bf on b.init_image_uuid = bf.uuid \
      left join gpt.completion_request cr on cr.job_uuid = rj.uuid \
      order by rj_created_at desc \
      limit ${count} \
    ) as j order by j.rj_created_at asc \
  `) as ListedJob[][]

  const rows = await Promise.all(jobList.map(async j => {
    const jobWithData: JobWithData = {
      uuid: j.uuid,
      batch: j.batch_uuid ? {
        uuid: j.batch_uuid,
        prompt: j.batch_prompt,
        negativePrompt: j.batch_negative_prompt,
        height: j.batch_height,
        width: j.batch_width,
        steps: j.batch_steps,
        guidance: j.batch_guidance,
        eta: j.batch_eta,
        allowNsfw: j.batch_allow_nsfw,
        numSeeds: j.batch_num_seeds,
        initImagePath: j.batch_init_image_path,
        strength: j.batch_strength,
      } : undefined,
      completionRequestUuid: j.completion_request_uuid,
      createdAt: j.rj_created_at,
      previousJobUuid: j.previous_job_uuid,
      type: ""
    }

    if (j.batch_uuid) {
      jobWithData.type = SD0_4 // TODO update Job with a type or service field
      const [imagePaths] = await dbClient.query(`\
        select f.path as image_path \
        from sd.generated_image gi \
        join main.file f on f.uuid = gi.generated_image_uuid \
        where gi.batch_uuid = '${j.batch_uuid}' \
        order by gi.batch_index asc \
      `) as { image_path: string }[][]

      jobWithData.images = imagePaths.map(i => i.image_path)
    }

    if (j.completion_request_uuid) { //TODO figure out how to be able to return latest user message when completion request isn't present yet?
      jobWithData.type = GPT3_5TURBO
      const [messagePaths] = await dbClient.query(`\
        select m.uuid as message_uuid, f.path as text_path, pf.path as previous_text_path \
        from gpt.completion_request cr \
        join gpt.message pm on pm.uuid = cr.previous_message_uuid \
        left join gpt.message m on m.completion_request_uuid = cr.uuid \
        left join main.file pf on pf.uuid = pm.text_uuid \
        left join main.file f on f.uuid = m.text_uuid \
        where cr.uuid = '${j.completion_request_uuid}' \
        order by m.completion_index asc \
      `) as { message_uuid: string, text_path: string, previous_text_path: string }[][]

      jobWithData.chat = messagePaths.map(m => {
        const chat: Chat = { previousMessage: readFileSyncRelative(m.previous_text_path).toString() }
        if (existsSyncRelative(m.text_path)) chat.message = readFileSyncRelative(m.text_path).toString()
        return chat
      })
    }

    return jobWithData
  }))

  return { response: { rows, hasMore: !!rows[0].previousJobUuid } }
}
