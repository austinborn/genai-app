import { ActionItemType, FormatActionItem, FormatNote, GPTItemData, NoteWithActionItems, RequestHandler } from '../types'
import { ActionItem, Note } from '../models'
import {
  createActionItemSchema,
  createNoteSchema,
  deleteActionItemSchema,
  deleteNoteSchema,
  generateActionItemsSchema,
  generateAdviceTooltipsSchema,
  postGenJobsSchema,
  reorderActionItemSchema,
  updateActionItemSchema,
  updateNoteSchema,
} from '../schema'
import { executeTransaction } from '../dbUtils'
import { GPT4O_MINI, GEN_ACTION_ITEMS, GEN_ADVICE_TOOLTIPS } from '../const'
import { runCompositeJob } from './compositeJob'

const OUTPUT_PIPE_TAG = '%%OUTPUT_PIPE%%'

type GPTCompositeJob = {
  type: typeof GPT4O_MINI
  params: { prompt: string, type: typeof GPT4O_MINI }
  postGenJobs: (typeof postGenJobsSchema)[]
}

type GenAdviceTooltipJob = (ai: ActionItem) => GPTCompositeJob

const formatActionItem: FormatActionItem = (actionItem: ActionItem) => ({
  uuid: actionItem.uuid,
  createdAt: actionItem.created_at,
  updatedAt: actionItem.updated_at,
  body: actionItem.body,
  estimate: actionItem.estimate,
  priority: actionItem.priority,
  status: actionItem.status,
  previousActionItemUuid: actionItem.previous_action_item_uuid,
  nextActionItemUuid: actionItem.next_action_item_uuid,
  noteUuid: actionItem.note_uuid,
  adviceTooltip: actionItem.advice_tooltip
})

const formatNote: FormatNote = (note: Note, actionItems: ActionItem[]) => ({
  uuid: note.uuid,
  createdAt: note.created_at,
  updatedAt: note.updated_at,
  body: note.body,
  actionItems: actionItems.map(ai => formatActionItem(ai))
})

const getOrderedActionItems = async (noteUuid: Note["uuid"]) => {
  const actionItems = await ActionItem.findAll({ where: { note_uuid: noteUuid } })

  const actionItemByUuid = actionItems.reduce((acc: Record<string, ActionItem>, ai) => {
    acc[ai.uuid] = ai
    return acc
  }, {})

  const headActionItem = actionItems.find(ai =>
    ai.previous_action_item_uuid === null ||
    ai.previous_action_item_uuid === undefined
  )

  const orderedActionItems = headActionItem ? [headActionItem] : []

  if (orderedActionItems.length) {
    let nextActionItemUuid = headActionItem?.next_action_item_uuid

    while (nextActionItemUuid) {
      const actionItem = actionItemByUuid[nextActionItemUuid]
      orderedActionItems.push(actionItem)
      nextActionItemUuid = actionItem?.next_action_item_uuid
    }
  }

  return orderedActionItems
}

export const listNotes: RequestHandler<any, NoteWithActionItems[]> = async (user) => {
  const notes = await Note.findAll({ where: { user_uuid: user.uuid }, order: [['updated_at', 'DESC']] })

  const notesWithActionItems = await Promise.all(notes.map(async note => {
    const actionItems = await getOrderedActionItems(note.uuid)

    return formatNote(note, actionItems)
  }))

  return { response: notesWithActionItems }
}

export const createNote: RequestHandler<typeof createNoteSchema, NoteWithActionItems> = async (user, request) => {
  const { body } = request

  const note = await Note.create({ body, user_uuid: user.uuid })

  return { response: formatNote(note, []) }
}

export const updateNote: RequestHandler<typeof updateNoteSchema, NoteWithActionItems> = async (_, request) => {
  const { noteUuid, body } = request

  const [updateCount, notes] = await Note.update({ body }, { where: { uuid: noteUuid }, returning: true })

  if (updateCount === 0) return { response: 'Note not found', error: true }

  return { response: formatNote(notes[0], []) }
}

export const deleteNote: RequestHandler<typeof deleteNoteSchema, string> = async (_, request) => {
  const { noteUuid } = request

  const note = await Note.findOne({ where: { uuid: noteUuid } })

  if (!note) return { response: 'Note not found', error: true }

  await executeTransaction(async (transaction) => {
    await ActionItem.destroy({
      where: { note_uuid: noteUuid },
      transaction
    })

    await Note.destroy({ where: { uuid: noteUuid }, transaction })
  })

  return { response: `${noteUuid} deleted` }
}

export const createActionItem: RequestHandler<typeof createActionItemSchema, ActionItemType> = async (user, request) => {
  const { noteUuid, body } = request

  const previousActionItem = await ActionItem.findOne({
    where: {
      note_uuid: noteUuid,
      next_action_item_uuid: null
    }
  })

  const txActionItem = await executeTransaction(async (transaction) => {
    const actionItem = await ActionItem.create({
      user_uuid: user.uuid,
      body,
      status: 'open',
      previous_action_item_uuid: previousActionItem?.uuid,
      note_uuid: noteUuid
    }, { transaction })

    if (previousActionItem) {
      previousActionItem.next_action_item_uuid = actionItem.uuid
      await previousActionItem.save({ transaction })
    }

    return actionItem
  })

  return { response: formatActionItem(txActionItem) }
}

export const updateActionItem: RequestHandler<typeof updateActionItemSchema, ActionItemType> = async (user, request) => {
  const { actionItemUuid, body, estimate, priority, status } = request

  const [updateCount, actionItems] = await ActionItem.update({
    body,
    estimate,
    priority,
    status,
  }, { where: { uuid: actionItemUuid }, returning: true })

  if (updateCount === 0) return { response: 'Action item not found', error: true }

  return { response: formatActionItem(actionItems[0]) }
}

export const deleteActionItem: RequestHandler<typeof deleteActionItemSchema, string> = async (user, request) => {
  const { actionItemUuid } = request

  const actionItem = await ActionItem.findOne({ where: { uuid: actionItemUuid } })

  if (!actionItem) return { response: 'Action item not found', error: true }

  await executeTransaction(async (transaction) => {
    await ActionItem.update({ next_action_item_uuid: actionItem?.next_action_item_uuid }, { where: { uuid: actionItem.previous_action_item_uuid }, transaction })
    await ActionItem.update({ previous_action_item_uuid: actionItem?.previous_action_item_uuid }, { where: { uuid: actionItem.next_action_item_uuid }, transaction })
  })

  await ActionItem.destroy({ where: { uuid: actionItemUuid } })

  return { response: `${actionItemUuid} deleted` }
}

export const reorderActionItem: RequestHandler<typeof reorderActionItemSchema, string> = async (user, request) => {
  const { actionItemUuid, prevActionItemUuid } = request

  if (actionItemUuid === prevActionItemUuid) return { response: 'Action item and prevActionItemUuid cannot be the same', error: true }

  const actionItem = await ActionItem.findOne({ where: { uuid: actionItemUuid } })
  if (!actionItem) return { response: 'Action item not found', error: true }

  await executeTransaction(async (transaction) => {
    if (actionItem.previous_action_item_uuid) await ActionItem.update(
      { next_action_item_uuid: actionItem.next_action_item_uuid ?? null },
      { where: { uuid: actionItem.previous_action_item_uuid }, transaction }
    )
    if (actionItem.next_action_item_uuid) await ActionItem.update(
      { previous_action_item_uuid: actionItem.previous_action_item_uuid ?? null },
      { where: { uuid: actionItem.next_action_item_uuid }, transaction }
    )
    if (prevActionItemUuid) await ActionItem.update(
      { next_action_item_uuid: actionItem.uuid },
      { where: { uuid: prevActionItemUuid }, transaction }
    )

    const nextActionItem = await ActionItem.findOne({ where: { previous_action_item_uuid: prevActionItemUuid ?? null, note_uuid: actionItem.note_uuid } })
    if (nextActionItem) await ActionItem.update(
      { previous_action_item_uuid: actionItemUuid },
      { where: { uuid: nextActionItem?.uuid }, transaction }
    )

    await ActionItem.update(
      {
        previous_action_item_uuid: prevActionItemUuid ?? null,
        next_action_item_uuid: nextActionItem?.uuid ?? null
      },
      { where: { uuid: actionItem.uuid }, transaction }
    )
  })

  return { response: `${actionItemUuid} reordered` }
}

export const generateActionItems: RequestHandler<typeof generateActionItemsSchema, string> = async (user, request) => {
  const { noteUuid } = request

  const note = await Note.findOne({ where: { uuid: noteUuid } })
  if (!note) return { response: 'Note not found', error: true }

  const actionItems = await getOrderedActionItems(noteUuid)

  const prompt = "Given the following context:\n" +
    `"${note.body ?? ""}"\n\n` +
    "Extend the following list of items:\n" +
    `${actionItems.map(ai => ai.body ?? "").join("\n")}`

  const jobs: GPTCompositeJob[] = [{
    type: GPT4O_MINI,
    params: { prompt, type: GPT4O_MINI },
    postGenJobs: [{
      type: GEN_ACTION_ITEMS,
      //@ts-expect-error for some reason params is type {}
      params: {
        noteUuid,
        body: OUTPUT_PIPE_TAG
      },
      outputPipes: [{
        outputParsing: {
          style: 'regex',
          regex: ".+",
          max: 1000
        },
        insertion: {
          param: 'body',
          style: 'interpolation',
          replacing: OUTPUT_PIPE_TAG
        }
      }]
    }]
  }]

  //@ts-expect-error for some reason params is type {}
  const compositeJobResponse = await runCompositeJob(user, { jobs })

  const { response } = compositeJobResponse
  if (typeof response === 'string') return { response }
  else {
    const compositeJob = response[0]
    const jobUuid = compositeJob.workflowJob.jobUuid

    return {
      response: jobUuid
    }
  }
}

export const updateAdviceTooltip: RequestHandler<typeof updateActionItemSchema, string> = async (user, request) => {
  const { actionItemUuid, body } = request

  const actionItem = await ActionItem.findOne({ where: { uuid: actionItemUuid } })
  if (!actionItem) return { response: 'Action item not found', error: true }

  await ActionItem.update({ advice_tooltip: body }, { where: { uuid: actionItemUuid } })

  return { response: `${actionItemUuid} updated` }
}

export const generateAdviceTooltips: RequestHandler<typeof generateAdviceTooltipsSchema, string[]> = async (user, request) => {
  const { noteUuid } = request

  const note = await Note.findOne({ where: { uuid: noteUuid } })
  if (!note) return { response: 'Note not found', error: true }

  const actionItems = await getOrderedActionItems(noteUuid)

  const prompt = (body?: string) => "Given the following context:\n" +
    `"${note.body ?? ""}"\n` +
    "And the following item:\n" +
    `"${body ?? ""}"\n\n` +
    "Offer 1 or 2 sentences of specific advice about how to accomplish the task"

  //@ts-expect-error for some reason params is type {}
  const genAdviceTooltipJob: GenAdviceTooltipJob = (ai: ActionItem) => ({
    type: GPT4O_MINI,
    params: { prompt: prompt(ai.body), type: GPT4O_MINI },
    postGenJobs: [{
      type: GEN_ADVICE_TOOLTIPS,
      params: {
        actionItemUuid: ai.uuid,
        body: OUTPUT_PIPE_TAG
      },
      outputPipes: [{
        outputParsing: {
          style: 'regex',
          regex: "(.|\\n)+",
          max: 1000
        },
        insertion: {
          param: 'body',
          style: 'interpolation',
          replacing: OUTPUT_PIPE_TAG
        }
      }]
    }]
  })

  const jobs: GPTCompositeJob[] = actionItems.filter(ai => ai.body).map(ai => genAdviceTooltipJob(ai))

  const responses: string[] = []
  for (const job of jobs) {
    //@ts-expect-error for some reason params is type {}
    const { response } = await runCompositeJob(user, { jobs: [job] })
    if (typeof response === 'string') responses.push(response)
    else {
      const compositeJob = response[0]
      const jobUuid = compositeJob.workflowJob.jobUuid
      responses.push(jobUuid)
    }
  }

  return { response: responses }
}
