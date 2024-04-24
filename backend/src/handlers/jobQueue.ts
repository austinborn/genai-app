import { DataLinkedList } from '../classes/dataLinkedList'
import { FetchJobQueueResponse, RequestItemData, RequestHandler, RequestItem, RequestQueueItem, UserWithAuth } from '../types'
import { ProcessorState } from '../const'
import { logger } from '../logger'
import { BLOCKED_LIST_CHECK_INTERVAL_MS } from '../config'
import { cancelJobSchema } from '../schema'
import { Job } from '../models'

const userQueues = new DataLinkedList<DataLinkedList<RequestQueueItem<RequestItemData>>>()
const blockedList = new DataLinkedList<RequestQueueItem<RequestItemData>>()
const userBlockedLists: Record<string, DataLinkedList<RequestQueueItem<RequestItemData>>> = {}
const userProcessingLists: Record<string, DataLinkedList<RequestQueueItem<RequestItemData>>> = {}

let processorState: ProcessorState = ProcessorState.IDLE

// TODO ensure all spin-off async methods have try-catches to avoid crashing the server

setInterval(async () => {
  let blockedItems = blockedList.list()

  for (const blockedItem of blockedItems) {
    const { blocked, newItemData, jobDependencies } = await itemIsBlocked(blockedItem)
    if (newItemData) blockedItem.data.data = newItemData
    blockedItem.data.jobDependencies = jobDependencies

    if (!blocked) {
      const { id, data: itemData } = blockedItem
      const { data } = itemData
      const { userUuid } = data

      blockedList.remove(id)

      userBlockedLists[userUuid]?.remove(id)
      if (userBlockedLists[userUuid] && !userBlockedLists[userUuid].getHead()) delete userBlockedLists[userUuid]

      if (!userProcessingLists[userUuid]) userProcessingLists[userUuid] = new DataLinkedList<RequestQueueItem<RequestItemData>>()
      userProcessingLists[userUuid].append(id, itemData)

      processItem(blockedItem)
    }
  }
}, parseInt(BLOCKED_LIST_CHECK_INTERVAL_MS))

const itemIsBlocked = async (item: RequestItem) => {
  const { id, data: itemData } = item
  let removedCounter = 0
  const newItemData: RequestQueueItem<RequestItemData> = { ...itemData }

  newItemData.jobDependencies = [...(itemData?.jobDependencies ?? [])]

  for (const [idx, jobUuid] of (itemData?.jobDependencies ?? []).entries()) {
    if (
      userBlockedLists[itemData.data.userUuid]?.fetchData(jobUuid) ||
      userProcessingLists[itemData.data.userUuid]?.fetchData(jobUuid)
    ) {
      return { blocked: true, jobDependencies: newItemData.jobDependencies }
    }

    newItemData.jobDependencies.splice(idx - removedCounter, 1)
    removedCounter++
  }

  const blockerCheck = await newItemData.isBlocked?.(id, newItemData.data)

  return {
    blocked: blockerCheck?.blocked ?? false,
    newItemData: blockerCheck?.newItemData ?? newItemData.data,
    jobDependencies: newItemData.jobDependencies
  }
}

const processItem = async (item: RequestItem) => {
  const { id, data: itemData } = item
  let { data, processor } = itemData
  const { userUuid } = data

  while (data.moreToProcess) {
    try {
      if (!userProcessingLists[userUuid]?.fetchData(id)) break

      data = await processor(data)
    } catch (error: any) {
      logger.error(error)
      logger.error(`Error occurred while processing previously blocked item. Removing ${id}.`)
      break
    }
  }

  if (userProcessingLists[userUuid]?.fetchData(id)) userProcessingLists[userUuid].remove(id)
  if (userProcessingLists[userUuid] && !userProcessingLists[userUuid].getHead()) delete userProcessingLists[userUuid]
}

const processRequests = async () => {
  if (processorState === ProcessorState.PROCESSING) return

  processorState = ProcessorState.PROCESSING

  let userQueue = userQueues.getHead()

  while (userQueue) {
    const item = userQueue.data.getHead()

    if (item) {
      const { blocked, newItemData, jobDependencies } = await itemIsBlocked(item)
      if (newItemData) item.data.data = newItemData
      item.data.jobDependencies = jobDependencies

      const { id, data: itemData } = item
      const { data } = itemData
      const { userUuid } = data

      if (blocked) {
        if (!userBlockedLists[userUuid]) userBlockedLists[userUuid] = new DataLinkedList<RequestQueueItem<RequestItemData>>()
        userBlockedLists[userUuid].append(id, itemData)

        blockedList.append(item.id, item.data)
      } else {
        if (!userProcessingLists[userUuid]) userProcessingLists[userUuid] = new DataLinkedList<RequestQueueItem<RequestItemData>>()
        userProcessingLists[userUuid].append(id, itemData)

        processItem(item)
      }

      userQueue.data.remove(item.id)

      userQueues.remove(userUuid)

      if (userQueue.data.getHead()) userQueues.append(userUuid, userQueue.data)
    } else {
      userQueues.remove(userQueue.id)
    }

    userQueue = userQueues.getHead()
  }

  processorState = ProcessorState.IDLE
}

export const pushRequest = <ItemData extends RequestItemData>(
  user: UserWithAuth,
  jobUuid: Job["uuid"],
  itemData: RequestQueueItem<ItemData>,
) => {
  let userQueue = userQueues.fetchData(user.uuid)

  if (!userQueue) {
    userQueue = new DataLinkedList<RequestQueueItem<RequestItemData>>()
    userQueues.append(user.uuid, userQueue)
  }

  //@ts-expect-error itemData is not constrainable between GPTItemData and SDItemData. TODO fix
  userQueue.append(jobUuid, itemData) // TODO turn into DB ops
  processRequests()
}

export const fetchJobQueue: RequestHandler<any, FetchJobQueueResponse> = async (user: UserWithAuth) => {
  const userProcessingList = userProcessingLists[user.uuid]?.list() ?? []
  const userBlockedList = userBlockedLists[user.uuid]?.list() ?? []
  return {
    response: {
      processing: userProcessingList.map(item => ({ id: item.id, data: item.data.data })),
      blocked: userBlockedList.map(item => ({ id: item.id, data: item.data.data })),
    }
  }
}

const removeDependentItems = (userUuid: string, jobUuid: string) => {
  const userBlockedList = userBlockedLists[userUuid]
  if (!userBlockedList) return
  for (const userBlockedListItem of userBlockedList.list()) {
    if (userBlockedListItem.data.jobDependencies?.includes(jobUuid)) {
      blockedList.remove(userBlockedListItem.id)
      userBlockedList.remove(userBlockedListItem.id)
      userBlockedListItem.data.cancelCleanup?.(userBlockedListItem.id, userBlockedListItem.data.data)
    }
  }
}

export const cancelJob: RequestHandler<typeof cancelJobSchema, string> = async (user, request) => {
  const { uuid } = request

  const userQueue = userQueues.fetchData(user.uuid)
  const userQueueItem = userQueue?.fetchData(uuid)
  if (userQueueItem) {
    userQueue.remove(uuid)
    userQueueItem.cancelCleanup?.(uuid, userQueueItem.data)
    if (!userQueue.getHead()) userQueues.remove(user.uuid)
    removeDependentItems(user.uuid, userQueueItem.data.workflowJob.jobUuid)
    return { response: uuid }
  }

  const userProcessingList = userProcessingLists[user.uuid]
  const userProcessingListItem = userProcessingList?.fetchData(uuid)
  if (userProcessingListItem) {
    userProcessingList.remove(uuid)
    userProcessingListItem.cancelCleanup?.(uuid, userProcessingListItem.data)
    if (!userProcessingList.getHead()) delete userProcessingLists[user.uuid]
    removeDependentItems(user.uuid, userProcessingListItem.data.workflowJob.jobUuid)
    return { response: uuid }
  }

  const userBlockedList = userBlockedLists[user.uuid]
  const userBlockedListItem = userBlockedList?.fetchData(uuid)
  if (userBlockedListItem) {
    blockedList.remove(uuid)
    userBlockedList.remove(uuid)
    userBlockedListItem.cancelCleanup?.(uuid, userBlockedListItem.data)
    if (!userBlockedList.getHead()) delete userBlockedLists[user.uuid]
    removeDependentItems(user.uuid, userBlockedListItem.data.workflowJob.jobUuid)
    return { response: uuid }
  }

  return { response: `Could not find request ${uuid}`, error: true }
}
