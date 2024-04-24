import { Transaction } from "sequelize"
import { User, Workflow } from './models'
import { dbClient } from './dbClient'
import { Job } from './models/main/Job'

export const createWorkflowJob = async (userUuid: User["uuid"], workflowUuid?: Workflow["uuid"]) => {
  const workflow = await (
    workflowUuid
    ? Workflow.findOne({ where: { uuid: workflowUuid } })
    : Workflow.create({ user_uuid: userUuid })
  )

  if (!workflow?.uuid) return null

  const job = await Job.create({
    workflow_uuid: workflow.uuid,
    job_index: 0
  })

  if (workflow?.latest_job_uuid) {
    await executeTransaction<void>(async (transaction: Transaction) => {
      await job.update({ previous_job_uuid: workflow?.latest_job_uuid }, { transaction })
      await workflow.update({ latest_job_uuid: job.uuid }, { transaction })
    })
  } else {
    await workflow.update({ latest_job_uuid: job.uuid })
  }

  return {
    jobUuid: job.uuid,
    workflowUuid: workflow.uuid
  }
}

export const executeTransaction = async <ResponseType>(callback: (tx: Transaction) => Promise<ResponseType>) => {
  const transaction = await dbClient.transaction()
  try {
    const cbResponse = await callback(transaction)
    await transaction.commit()
    return cbResponse
  } catch (error) {
    await transaction.rollback()
    console.error({msg: 'Unexpected error during DB transaction', error})
    throw Error(`Unexpected error during DB transaction: ${error}`)
  }
}
