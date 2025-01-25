import { Workflow } from '../models'
import { GPTItemData, RequestHandler, Response, SDItemData, ServiceItemData } from '../types'
import { GPT3_5TURBO, GPT4O_MINI, SD0_4 } from '../const'
import { generateMessage } from './gpt'
import { generateImages } from './stableDiffusion'
import {
  createCompositeJobSchema,
  deleteCompositeJobSchema,
  runCompositeJobSchema,
  updateCompositeJobSchema
} from '../schema'

const jobCallbacks = {
  [GPT3_5TURBO]: generateMessage,
  [GPT4O_MINI]: generateMessage,
  [SD0_4]: generateImages
}

export const createCompositeJob: RequestHandler<typeof createCompositeJobSchema, string> = async (user, request) => {
  const { jobs, name } = request

  return { response: "TODO save jobs as composite job for user" }
}

export const updateCompositeJob: RequestHandler<typeof updateCompositeJobSchema, string> = async (user, request) => {
  const { compositeJobUuid, name } = request

  return { response: "TODO update name for compositeJobUuid" }
}

export const deleteCompositeJob: RequestHandler<typeof deleteCompositeJobSchema, string> = async (user, request) => {
  const { compositeJobUuid } = request

  return { response: "TODO delete composite job with compositeJobUuid" }
}

export const runCompositeJob: RequestHandler<typeof runCompositeJobSchema, ServiceItemData[]> = async (user, request) => {
  let { workflowUuid, jobs } = request

  // TODO enable accepting a custom composite job ID instead of the job itself)

  if (!workflowUuid) {
    const workflow = await Workflow.create({ user_uuid: user.uuid })

    if (!workflow) return { response: 'Could not create workflow', error: true }

    workflowUuid = workflow.uuid
  }

  const responses: ServiceItemData[] = []

  const gptDependencies: string[] = []

  for (const [idx, job] of jobs.entries()) {
    const request = { workflowUuid, job }

    const callback = jobCallbacks[job.type]

    if ([GPT3_5TURBO, GPT4O_MINI].includes(job.type)) {
      //@ts-expect-error for some reason params is type {}
      request.job.params.jobDependencies = [...gptDependencies]
    }

    //@ts-expect-error same issue with request params being {}
    const { response, status, error } = await callback(user, request)

    if (error || typeof response === 'string') return { response: `Error when running job idx ${idx}: ${response}`, status, error: true }
    else if ([GPT3_5TURBO, GPT4O_MINI].includes(job.type)) {
      gptDependencies.push(response.workflowJob.jobUuid)
    }

    responses.push(response)
  }

  return { response: responses }
}
