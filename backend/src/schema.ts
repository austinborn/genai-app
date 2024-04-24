import {
  GEN_ACTION_ITEMS,
  GEN_ADVICE_TOOLTIPS,
  GPT3_5TURBO,
  SD0_4,
  SSO_PROVIDERS
} from './const'

import * as yup from 'yup'

// Input Pipes

export const outputPipeSchema = yup.array(
  yup.object({
    outputParsing: yup.object({
      style: yup.string().required().oneOf(['regex']),
      regex: yup.string().required().test('valid-regex', value => {
        try {
          new RegExp(value)
          return true
        } catch (e) {
          return false
        }
      }),
      max: yup.number().integer().positive(),
    }).required(),
    insertion: yup.object({
      param: yup.string().required(),
      style: yup.string().required().oneOf(['interpolation']),
      replacing: yup.string().required()
    }).required()
  }).required()
).required().min(1)

// SD

const sd04Schema = yup.object({
  prompt: yup.string().required(),
  negativePrompt: yup.string(),
  height: yup.number().integer().positive().test(
    'multiple-of-8',
    ({ height }) => `${height} height is not a multiple of 8`,
    async (value) => !!value && value % 8 === 0,
  ),
  width: yup.number().integer().positive().test(
    'multiple-of-8',
    ({ width }) => `${width} width is not a multiple of 8`,
    async (value) => !!value && value % 8 === 0,
  ),
  numSeeds: yup.number().integer().positive(),
  initImage: yup.string(),
  strength: yup.number(),
  steps: yup.number().integer().positive(),
  guidance: yup.number(),
  allowNsfw: yup.boolean()
})

export const generateImagesSchema = yup.object({
  workflowUuid: yup.string().required(),
  job: yup.object({
    params: sd04Schema.required()
  }).required()
})

// GPT

export const postGenJobsSchema = yup.array(yup.object({
  type: yup.string().oneOf([SD0_4, GEN_ACTION_ITEMS, GEN_ADVICE_TOOLTIPS]).required(),
  params: yup.object().when(
    'type',
    ([type]) => type === SD0_4
      ? sd04Schema
      : type === GEN_ACTION_ITEMS
      ? createActionItemSchema
      : createAdviceTooltipSchema
  ),
  outputPipes: outputPipeSchema
}))

export const gpt35TurboSchema = yup.object({
  prompt: yup.string().required(),
  maxChatHistoryLength: yup.number().integer().positive(),
  maxChatHistoryChars: yup.number().integer().positive(),
  jobDependencies: yup.array(yup.string().required())
})

export const generateMessageSchema = yup.object({
  workflowUuid: yup.string().required(),
  job: yup.object({
    params: gpt35TurboSchema.required(),
    postGenJobs: postGenJobsSchema
  }).required()
})

// Composite Jobs

const jobSchema = yup.array(yup.object({
  type: yup.string().oneOf([GPT3_5TURBO, SD0_4]).required(),
  params: yup.object().when(
    'type',
    ([type]) => type === GPT3_5TURBO ? gpt35TurboSchema : sd04Schema
  ),
  postGenJobs: postGenJobsSchema
})).required().min(1)

export const createCompositeJobSchema = yup.object({
  name: yup.string().required(),
  jobs: jobSchema
})

export const updateCompositeJobSchema = yup.object({
  compositeJobUuid: yup.string().required(),
  name: yup.string()
})

export const deleteCompositeJobSchema = yup.object({
  compositeJobUuid: yup.string().required()
})

export const runCompositeJobSchema = yup.object({
  workflowUuid: yup.string(),
  jobs: jobSchema
})

// Workflow

export const listJobsSchema = yup.object({
  headJobUuid: yup.string().required(),
  count: yup.number().min(1).required()
})

export const deleteWorkflowSchema = yup.object({
  workflowUuid: yup.string().required()
})

// Base Request

export const baseRequestBodySchema = yup.object({
  token: yup.string().required(),
  provider: yup.string().required().oneOf(SSO_PROVIDERS),
})

// Job Queue

export const cancelJobSchema = yup.object({
  uuid: yup.string().required()
})

// Notes

export const createNoteSchema = yup.object({
  body: yup.string()
})

export const updateNoteSchema = yup.object({
  noteUuid: yup.string().required(),
  body: yup.string()
})

export const deleteNoteSchema = yup.object({
  noteUuid: yup.string().required()
})

// Action Items

export const createActionItemSchema = yup.object({
  noteUuid: yup.string().required(),
  body: yup.string()
})

export const updateActionItemSchema = yup.object({
  actionItemUuid: yup.string().required(),
  body: yup.string(),
  estimate: yup.string(),
  priority: yup.string().oneOf(["lowest", "low", "medium", "high", "highest"]),
  status: yup.string().oneOf(["open", "in_progress", "closed"])
})

export const deleteActionItemSchema = yup.object({
  actionItemUuid: yup.string().required()
})

export const reorderActionItemSchema = yup.object({
  actionItemUuid: yup.string().required(),
  prevActionItemUuid: yup.string()
})

export const generateActionItemsSchema = yup.object({
  noteUuid: yup.string().required()
})

export const createAdviceTooltipSchema = yup.object({
  actionItemUuid: yup.string().required(),
  body: yup.string().required()
})

export const generateAdviceTooltipsSchema = yup.object({
  noteUuid: yup.string().required()
})
