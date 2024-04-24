import { ActionItem, Batch, CompletionRequest, File, Job, Message, Note, User, Workflow } from "./models"
import { FastifyReply } from 'fastify'

import { GPT3_5TURBO, SD0_4 } from "./const"

import * as yup from 'yup'

// Authentication

export type DiscordUser = {
  accent_color: number // hex color
  avatar: string
  avatar_decoration: null
  banner: null
  banner_color: string // hex color
  discriminator: string // string int?
  email: string
  flags: number
  global_name: string
  id: string
  locale: string
  mfa_enabled: boolean
  premium_type: number
  public_flags: number
  username: string
  verified: boolean
}

export type AccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

// Authorization

type Authorizations = {
  canUseGPT?: boolean
  canUseSD?: boolean
  canSubmitNSFWSD?: boolean
  canUseAdvandedUI?: boolean
  receivesWhiteGloveSupport?: boolean
}

// GPT

export type WorkflowJob = {
  jobUuid: Job["uuid"]
  workflowUuid: Workflow["uuid"]
}

export type GPTMessage = {
  role: 'assistant' | 'system' | 'user'
  content: string
  name?: string
}

export type GPTItemData = RequestData & {
  prompt: string
}

export type CompletionResponse = {
  id: string
  object: string
  created: number
  choices: {
    index: number
    message: GPTMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type FormatMessages = (
  messages: Message[],
  maxChatHistoryChars?: number
) => GPTMessage[]

export type MessageWithTextPath = Message & { text_path?: string }

export type Chat = {
  message?: string
  previousMessage: string
}

type GPTParams = {
  prompt: string
  maxChatHistoryLength?: number
  maxChatHistoryChars?: number
}

// SD

export type GenerateImageParams = {
  prompt: string
  negativePrompt?: string
  seed: string
  height?: number
  width?: number
  steps: number
  guidance: number
  eta: number
  allowNsfwSetting: boolean
  strength?: number
  initImageUuid?: File["uuid"]
  batchIndex: number
}

export type SDItemData = RequestData & {
  prompt: string
  negativePrompt?: string
  height?: number
  width?: number
  steps: number
  guidance: number
  eta: number
  allowNsfwSetting: boolean
  numSeeds: number
  initImageUuid?: File["uuid"]
  initImagePath?: string
  strength?: number
  userUuid: User["uuid"]
  imagesGenerated: number
  latestImageStartTime: number
  totalGenerationTime: number
  batchUuid: Batch["uuid"]
}

type SDParams = {
  prompt: string
  negativePrompt?: string
  numSeeds: number
  initImageUuid?: string
  strength?: number
  height?: number
  width?: number
  steps: number
  guidance: number
  allowNsfw: boolean
}

// Productivity

export type ActionItemType = {
  uuid: string
  createdAt: number
  updatedAt: number
  body?: string
  estimate?: string
  priority?: string
  status: string
  previousActionItemUuid?: string
  nextActionItemUuid?: string
  noteUuid: string
}

export type NoteWithActionItems = {
  uuid: string
  createdAt: number
  updatedAt: number
  body?: string
  actionItems: {
      createdAt: number
      uuid: string
      updatedAt: number
      body?: string
      estimate?: string
      priority?: string
      status: string
  }[]
}

export type FormatActionItem = (actionItem: ActionItem) => ActionItemType

export type FormatNote = (note: Note, actionItems: ActionItem[]) => NoteWithActionItems

// Jobs

export type ListedJob = {
  uuid: Job["uuid"]
  previous_job_uuid: Job["previous_job_uuid"] | null
  rj_created_at: Job["created_at"]
  batch_uuid: Batch["uuid"] | null
  batch_prompt: Batch["prompt"] | null
  batch_negative_prompt: Batch["negative_prompt"] | null
  batch_height: Batch["height"] | null
  batch_width: Batch["width"] | null
  batch_steps: Batch["steps"] | null
  batch_guidance: Batch["guidance"] | null
  batch_eta: Batch["eta"] | null
  batch_allow_nsfw: Batch["allow_nsfw"] | null
  batch_num_seeds: Batch["num_seeds"] | null
  batch_init_image_path: File["path"] | null
  batch_strength: Batch["strength"] | null
  completion_request_uuid: CompletionRequest["uuid"] | null
}

export type JobWithData = {
  type: string
  uuid: Job["uuid"]
  previousJobUuid?: Job["uuid"] | null
  batch?: {
    uuid: Batch["uuid"] | null
    prompt: Batch["prompt"] | null
    negativePrompt: Batch["negative_prompt"] | null
    height: Batch["height"] | null
    width: Batch["width"] | null
    steps: Batch["steps"] | null
    guidance: Batch["guidance"] | null
    eta: Batch["eta"] | null
    allowNsfw: Batch["allow_nsfw"] | null
    numSeeds: Batch["num_seeds"] | null
    initImagePath: File["path"] | null
    strength: Batch["strength"] | null
  }
  completionRequestUuid: CompletionRequest["uuid"] | null
  chat?: Chat[]
  createdAt: Job["created_at"]
  images?: string[]
}

// Workflows

export type ListedWorkflow = {
  uuid: Workflow["uuid"]
  created_at: string
  updated_at: string
  sd_prompt: string | null
  gpt_message_path: string | null
  gpt_prev_message_path: string | null
  latest_job_uuid: Job["uuid"] | null
  latest_message_uuid: Message["uuid"] | null
}

export type WorkflowWithPreface = {
  createdAt: string
  updatedAt: string
  uuid: string
  preface: string
  latestJobUuid: string | null
  latestMessageUuid: string | null
}

// Rate Limits
export type RateLimits = {
  window: number
  limit: number
}[]

// Subscriptions

export type SubscriptionTier = {
  name: string
  billing: {
    monthly?: number
    yearly?: number
    perpetual?: number
  }
  rateLimits: RateLimits
  storage: number // bytes
  compositeJobs: number | 'unlimited'
  authorizations: Authorizations
}

export type UserWithAuth = {
  uuid: string
  email: string
  defaultNsfwEnabled: boolean
  active: boolean
  subscriptionName: string
  subscriptionTier: string
  authorizations: Authorizations
}

export type UserProfiles = {
  shinzoUser: UserWithAuth
  discordUser?: DiscordUser
}

// Requests

export type SendReply = {
  body: string | Record<string, any>
  reply: FastifyReply
  status?: number
  error?: boolean
}

export type Request = {
  body: any
  params: any
  query: any
}

export type Response<ResponseBody extends any> = {
  response: ResponseBody | string
  error?: boolean
  status?: number
}

export type RequestHandler<RequestBodySchema extends yup.ISchema<any, any, any, any>, ResponseBody> = (user: UserWithAuth, request: yup.InferType<RequestBodySchema>) => Promise<Response<ResponseBody>>

export type RequestWithAuth = {
  token: string
  provider: 'discord'
}

export type OutputPipe = {
  outputParsing: {
    style: 'regex'
    regex: string
    max?: number
  }
  insertion: {
    param: string
    style: 'interpolation'
    replacing: string
  }
}

export type PostGenJob = {
  params: SDParams
  outputPipes: OutputPipe[]
}

type CompositeJob = RequestData & {
  params: GPTParams | SDParams
  postGenJobs?: PostGenJob[]
}

export type CompositeJobRequest = {
  workflowUuid?: string
  compositeJob: CompositeJob[]
}

export type RequestMiddlewareOptions = {
  keepAuthData?: boolean
  rateLimit?: boolean
}

// Queue

export type RequestData = {
  moreToProcess: boolean
  type: typeof GPT3_5TURBO | typeof SD0_4
  userUuid: User["uuid"]
  workflowJob: WorkflowJob
}

export type ServiceItemData = GPTItemData | SDItemData

export type RequestItemData = RequestData & ServiceItemData

export type RequestProcessor<ItemData extends RequestData> = (data: ItemData) => Promise<ItemData>

export type RequestQueueItem<ItemData extends RequestData> = {
  data: ItemData
  isBlocked?: (id: string, data: ItemData) => Promise<{
    blocked: boolean
    newItemData?: ItemData
  }>
  jobDependencies?: string[]
  processor: RequestProcessor<ItemData>
  cancelCleanup?: (id: string, data: ItemData) => void
}

export type RequestItem = {
  id: string
  data: RequestQueueItem<RequestItemData>
}

export type FetchJobQueueResponse = {
  processing: {
    id: string
    data: RequestItemData
  }[]
  blocked: {
    id: string
    data: RequestItemData
  }[]
}
