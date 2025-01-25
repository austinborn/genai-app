import { logger } from '../logger'
import { MOCK_GPT, MOCK_GPT_GEN_S, OPENAI_API_KEY, OPENAI_API_URL } from '../config'
import axios, { AxiosResponse } from 'axios'

import { existsSyncRelative, getTextPath, readFileSyncRelative, sleep, writeFileRelative } from '../utils'
import { CompletionRequest, File, LatestMessage, Message, User, Workflow } from '../models'
import { CompletionResponse, FormatMessages, GPTItemData, MessageWithTextPath, RequestHandler, RequestProcessor, GPTMessage } from '../types'
import { createWorkflowJob, executeTransaction } from '../dbUtils'
import { pushRequest } from './jobQueue'
import { dbClient } from '../dbClient'
import { generateMessageSchema } from '../schema'
import { postProcessor } from '../inputPipe'
import { rateLimitedRequest } from '../authorizations/modelAuth'

const DEFAULT_TEMPERATURE = 1
const DEFAULT_TOP_P = 1
const DEFAULT_NUM_COMPLETIONS = 1

let mockGPTNumber = 0

const mockGPTOptions = [
  "Hello there!",
  "Hello there?",
  "My name is Shinzo GPT",
  "Master gave dobby a sock?",
  "uwu senpaiiiiii",
  "Hi, how's it going?",
  "Oh hey",
  "Sup",
  "Yo",
  "ohaiyoo",
  "guten morgen",
  "hola, como estas?",
  "bonjour",
  "1000101011101001000110"
]

type GetMockGPTResponse = () => Promise<AxiosResponse<CompletionResponse>>

const getMockGPTResponse: GetMockGPTResponse = async () => {
  await sleep(parseFloat(MOCK_GPT_GEN_S) * 1_000)

  const content = `This is GPT response #${mockGPTNumber}: ${mockGPTOptions[Math.floor(Math.random() * mockGPTOptions.length)]}`
  mockGPTNumber++
  return {
    data: {
      id: "GPT_RESPONSE_ID",
      object: "GPT_RESPONSE_OBJECT",
      created: Date.now(),
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content
          },
          finish_reason: "STOP"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    },
    status: 200,
    statusText: "success",
    headers: {},
    config: {}
  }
}

export const getTextFromMessageUuid = async (messageUuid: Message["uuid"]) => {
  const message = await Message.findOne({ where: { uuid: messageUuid } })
  const file = await File.findOne({ where: { uuid: message?.text_uuid } })

  if (!file) throw Error(`No file found for message.uuid ${messageUuid}`)

  if (!(file.path && existsSyncRelative(file.path))) throw Error(`No file found at ${file.path}`)

  return readFileSyncRelative(file.path).toString()
}

const writeMessage = async (userUuid: User["uuid"], role: GPTMessage["role"], text: string, workflowUuid: Workflow["uuid"], completionRequestUuid?: CompletionRequest["uuid"]) => {
  const path = getTextPath(userUuid)

  writeFileRelative(path, text)

  const txMessage = await executeTransaction(async (transaction) => {
    const file = await File.create({ type: 'text', path }, { transaction })

    const latestMessage = await LatestMessage.findOne({ where: { workflow_uuid: workflowUuid }, transaction })

    const message = await Message.create({
      role,
      text_uuid: file.uuid,
      completion_request_uuid: completionRequestUuid,
      previous_message_uuid: latestMessage?.latest_message_uuid,
      completion_index: 0 // Assumes using DEFAULT_NUM_COMPLETIONS
    }, { transaction })

    if (!latestMessage) {
      await LatestMessage.create({
        workflow_uuid: workflowUuid,
        latest_message_uuid: message.uuid
      }, { transaction })
    } else {
      latestMessage.latest_message_uuid = message.uuid
      await latestMessage.save({ transaction })
    }

    return message
  })

  return txMessage
}

const listAllMessages = async (messageUuid: Message["uuid"], maxChatHistoryLength?: number) => {
  const [messages] = await dbClient.query(`\
  with recursive recursive_message (uuid) as ( \
    select m.* \
    from gpt.message m \
    where m.uuid = '${messageUuid}' \
    union all \
    select m.* \
    from gpt.message m \
    join recursive_message rm on rm.previous_message_uuid = m.uuid \
  ) \
  select rm.*, f.path as text_path \
  from recursive_message rm \
  join main.file f on f.uuid = rm.text_uuid \
  order by created_at desc \
  ${typeof maxChatHistoryLength === 'number'
      ? `limit ${maxChatHistoryLength}`
      : ""
    } \
`) as MessageWithTextPath[][]
  logger.debug({ messages })
  return messages
}

const formatMessages: FormatMessages = (messages: MessageWithTextPath[], maxChatHistoryChars?: number) => {
  let totalChars = 0

  const formattedMessages: GPTMessage[] = []

  for (const message of messages) {
    if (!(message.text_path && existsSyncRelative(message.text_path))) throw Error(`No file found at ${message.text_path}`)

    const content = readFileSyncRelative(message.text_path).toString()

    totalChars += content.length

    if (maxChatHistoryChars !== undefined && totalChars > maxChatHistoryChars) break

    formattedMessages.push({ role: message.role, content })
  }

  return formattedMessages.reverse()
}

const gptCompletionRequest = async (
  userUuid: User["uuid"],
  workflowJob: GPTItemData["workflowJob"],
  type: string,
  messages: MessageWithTextPath[],
  maxChatHistoryLength?: number,
  maxChatHistoryChars?: number
) => {
  const latestMessage = messages[0]

  const formattedMessages = formatMessages(messages, maxChatHistoryChars)

  const completionRequest = await CompletionRequest.create({
    model: type,
    temperature: DEFAULT_TEMPERATURE,
    top_p: DEFAULT_TOP_P,
    completions: DEFAULT_NUM_COMPLETIONS,
    job_uuid: workflowJob.jobUuid,
    previous_message_uuid: latestMessage.uuid,
    max_chat_history_length: maxChatHistoryLength,
    max_chat_history_chars: maxChatHistoryChars
  })

  const gptRequestData = {
    model: type,
    messages: formattedMessages,
    temperature: DEFAULT_TEMPERATURE,
    top_p: DEFAULT_TOP_P,
    n: DEFAULT_NUM_COMPLETIONS
  }

  logger.debug({ gptRequestData })

  let gptResponse

  if (MOCK_GPT === 'true') {
    gptResponse = await getMockGPTResponse()
  } else {
    gptResponse = await axios.post<CompletionResponse>(
      OPENAI_API_URL + 'chat/completions',
      gptRequestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    )
  }

  logger.debug({ gptResponseData: gptResponse.data })

  if (!gptResponse.data) throw Error(`No response from Chat GPT`)

  const { choices } = gptResponse.data

  const responseChoice = choices[0].message

  const responseMessage = await writeMessage(userUuid, responseChoice.role, responseChoice.content, workflowJob.workflowUuid, completionRequest.uuid)

  return responseMessage.uuid
}

export const generateMessage: RequestHandler<typeof generateMessageSchema, GPTItemData> = async (user, request) => {
  if (!user.authorizations.canUseGPT) return { response: "User does not have permission to access this resource", error: true }

  const { workflowUuid, job } = request

  const {
    prompt,
    type,
    maxChatHistoryLength,
    maxChatHistoryChars,
    jobDependencies
  } = job.params

  const workflowJob = await createWorkflowJob(user.uuid, workflowUuid)

  if (!workflowJob) return { response: 'Unexpected error when creating job', error: true }

  const processor: RequestProcessor<GPTItemData> = async (itemData: GPTItemData) => {
    const { workflowJob, prompt } = itemData

    const userMessage = await writeMessage(user.uuid, 'user', prompt, workflowJob.workflowUuid)

    const messages = await listAllMessages(userMessage.uuid, maxChatHistoryLength)

    const responseMessageUuid = await gptCompletionRequest(user.uuid, workflowJob, type, messages, maxChatHistoryLength, maxChatHistoryChars)

    if (!responseMessageUuid) logger.error("No response message UUID from completion request handler")

    await postProcessor(user, workflowJob, responseMessageUuid, job.postGenJobs)

    return { ...itemData, moreToProcess: false }
  }

  const itemData: GPTItemData = {
    workflowJob,
    prompt,
    type,
    moreToProcess: true,
    userUuid: user.uuid
  }

  pushRequest<GPTItemData>(
    user,
    workflowJob.jobUuid,
    {
      data: itemData,
      isBlocked: async () => {
        const msUntilNextAllow = rateLimitedRequest(type)
        return { blocked: msUntilNextAllow > 0 }
      },
      processor,
      jobDependencies
    }
  )

  return { response: itemData }
}
