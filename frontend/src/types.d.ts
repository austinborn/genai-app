import {
  GEN_ACTION_ITEMS,
  GPT3_5TURBO,
  SD0_4,
  DND_DM
} from '../const'
import { ReactElement } from "react"

export type BaseResponse = {
  status: number
} & (
  { error: string | Record<string, any> }
)

// Authentication

export type RefreshTokenData = BaseResponse & {
  body?: {
    token?: string
  }
}

export type RequestWithAuth = {
  token: string
  provider: 'discord'
}

export type DiscordLoginParams = { code?: string }

export type AccessTokenData = BaseResponse & {
  body?: { token?: string }
}

export type UserProfiles = BaseResponse & {
  body: {
    shinzoUser: {
      uuid: string
      email: string
      defaultNsfwEnabled: boolean
      active: boolean
      subscriptionName: string
      subscriptionTier: string
      authorizations: {
        canUseGPT?: boolean
        canUseSD?: boolean
        canSubmitNSFWSD?: boolean
        canUseAdvandedUI?: boolean
        receivesWhiteGloveSupport?: boolean
      }
    }
    discordUser?: {
      accent_color: number // hex color
      avatar: string
      avatar_decoration: null
      banner: null
      banner_color: string // hex color
      discriminator: string // string int?
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
  }
}

// GPT

type GPTParams = {
  prompt: string
  maxChatHistoryLength?: number
  maxChatHistoryChars?: number
}

export interface GPTItemData extends QueueData {
  type: typeof GPT3_5TURBO
  workflowJob: {
    jobUuid: string
    workflowUuid: string
  }
  prompt: string
}

// SD

type SDParams = {
  prompt: string
  negativePrompt: string
  numSeeds: number
  initImageUuid?: string
  strength?: number
  height?: number
  width?: number
  steps: number
  guidance: number
  allowNsfw: boolean
}

export interface SDItemData extends QueueData {
  type: typeof SD0_4
  prompt: string
  negativePrompt?: string
  height: number
  width: number
  steps: number
  guidance: number
  eta: number
  allowNsfwSetting: boolean
  numSeeds: number
  initImageUuid?: string
  strength?: number
  userUuid: string
  imagesGenerated: number
  latestImageStartTime: number
  totalGenerationTime: number
}

export type ImageDimOptions = {
  label: string
  options: {
    label: string
    value: string
  }[]
}[]

// Jobs

export type JobService = typeof GPT3_5TURBO | typeof SD0_4 | 'dnd-dm'

export type Job = {
  uuid: string
  type: JobService
  batch?: {
    uuid: string
    prompt: string
    negativePrompt?: string
    height: string | null
    width: string | null
    steps: string
    guidance: string
    eta: string
    allowNsfw: boolean
    numSeeds: string
    initImagePath?: string
    strength?: string
  }
  completionRequestUuid: string | null
  createdAt: string
  previousJobUuid?: string | null
  images?: string[]
  chat?: {
    message: string
    previousMessage: string
  }[]
}

export type ListJobs = RequestWithAuth & {
  headJobUuid: string
  count: number
}

export type JobMessages = {
  gptResponse?: string
  userMessage?: string
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

type CompositeJob = {
  type: typeof GPT3_5TURBO | typeof SD0_4
  params: GPTParams | SDParams
  postGenJobs?: {
    type: typeof SD0_4 | typeof GEN_ACTION_ITEMS
    params: SDParams | ActionItemParams
    outputPipes: OutputPipe[]
  }[]
}

export type CompositeJobRequest = RequestWithAuth & {
  workflowUuid?: string
  jobs: CompositeJob[]
}

// Workflows

export type WorkflowType = {
  createdAt: string
  updatedAt: string
  uuid: string
  preface: string
  latestJobUuid?: string
  latestMessageUuid?: string
}

export type WorkflowList = BaseResponse & {
  body: WorkflowType[]
}

export type DeleteWorkflowRequest = RequestWithAuth & {
  workflowUuid: string
}

export type DeleteWorkflowResponse = BaseResponse & {
  body: string
}

export type BaseObjectList = {
  label: string
  cutoffTime: number
}

export type BaseWorkflowList = (BaseObjectList & {
  workflows: WorkflowType[]
})[]

export type UploadImageResponse = BaseResponse & {
  body: {
    uuid: string
  }
}

export type UploadImageRequest = RequestWithAuth & {
  url: string
}

// Action Items

type ActionItemPriority = "lowest" | "low" | "medium" | "high" | "highest"

type ActionItemStatus = "open" | "in_progress" | "closed"

export type ActionItem = {
  uuid: string
  createdAt: string
  updatedAt: string
  body: string
  estimate?: string
  priority?: ActionItemPriority
  status?: string
  previousActionItemUuid?: string
  nextActionItemUuid?: string
  noteUuid: string
  adviceTooltip?: string
}

type ActionItemParams = {
  noteUuid: string
  body: string
}

export type CreateActionItemRequest = RequestWithAuth & ActionItemParams

export type CreateActionItemResponse = BaseResponse & {
  body: ActionItem
}

export type UpdateActionItemRequest = RequestWithAuth & {
  actionItemUuid: string
  body: string
  estimate?: string
  priority?: ActionItemPriority
  status?: ActionItemStatus
}

export type UpdateActionItemResponse = BaseResponse & {
  body: ActionItem
}

export type DeleteActionItemRequest = RequestWithAuth & {
  actionItemUuid: string
}

export type DeleteActionItemResponse = BaseResponse & {
  body: string
}

export type ReorderActionItemRequest = RequestWithAuth & {
  actionItemUuid: string
  prevActionItemUuid?: string
}

export type ReorderActionItemResponse = BaseResponse & {
  response: string
}

export type GenerateActionItemsRequest = RequestWithAuth & {
  noteUuid: string
}

export type GenerateActionItemsResponse = BaseResponse & {
  response: string
}

export type GenerateAdviceTooltipsRequest = RequestWithAuth & {
  noteUuid: string
}

export type GenerateAdviceTooltipsResponse = BaseResponse & {
  response: string[]
}

// Notes

export type Note = {
  createdAt: string
  updatedAt: string
  uuid: string
  body: string
  actionItems: ActionItem[]
}

export type BaseNoteList = (BaseObjectList & {
  notes: Note[]
})[]

export type NoteList = BaseResponse & {
  body: Note[]
}

export type CreateNoteRequest = RequestWithAuth & {
  body: string
}

export type CreateNoteResponse = BaseResponse & {
  body: Note
}

export type UpdateNoteRequest = RequestWithAuth & {
  noteUuid: string
  body: string
}

export type UpdateNoteResponse = BaseResponse & {
  body: Note
}

export type DeleteNoteRequest = RequestWithAuth & {
  noteUuid: string
}

export type DeleteNoteResponse = BaseResponse & {
  body: string
}

export type ListNotes = BaseResponse & {
  body: Note[]
}

// Generics

export type InfiniteScrollResponse<Row> = BaseResponse & {
  body: {
    rows: Row[]
    hasMore: boolean
  }
}

export type RequestDataConfig<RequestType> = {
  queryConfig?: AxiosRequestConfig<RequestType>
  queryData?: RequestType
}

// Queue

export type QueueData = { type: JobService }

export type QueueItemProcessorData = GPTItemData | SDItemData

export type QueueItemType = {
  id: string
  data: QueueItemProcessorData
}

export type Queue = BaseResponse & {
  body: {
    processing: QueueItemType[]
    blocked: QueueItemType[]
  }
}

export type CancelQueueItemAxiosData = RequestWithAuth & { uuid: string }

export type JobDetails = {
  header: string
  margin?: string
  color?: string
  customBodyComponent?: ReactElement
  body?: string
}

export type UserDetails = {
  header: string
  body?: string | ReactElement
}
