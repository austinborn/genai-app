import { UserWithAuth, WorkflowJob } from './types'
import { getTextFromMessageUuid } from './handlers/gpt'
import { generateImages } from './handlers/stableDiffusion'
import { createActionItem, updateAdviceTooltip } from './handlers/productivity'
import { Message } from './models'
import { logger } from './logger'
import { postGenJobsSchema } from './schema'
import { GEN_ACTION_ITEMS, SD0_4 } from './const'
import * as yup from 'yup'

export const postProcessor = async (user: UserWithAuth, workflowJob: WorkflowJob, messageUuid: Message["uuid"], postGenJobs: yup.InferType<typeof postGenJobsSchema>) => {
  if (!postGenJobs) return

  const text = await getTextFromMessageUuid(messageUuid)

  for (const postGenJob of postGenJobs) {
    const { params, outputPipes, type } = postGenJob

    for (const outputPipe of outputPipes) {
      const { outputParsing, insertion } = outputPipe

      //@ts-expect-error for some reason params is type {}
      const baseParam = params[insertion.param]

      const insert = (insertText: string) => (insertion.style === 'interpolation')
        ? baseParam.replace(insertion.replacing, insertText)
        : baseParam

      if (outputParsing.style === 'regex') {
        logger.debug("Checking regex")
        const foundPrompts = (text.match(RegExp(outputParsing.regex, "g")) ?? []).slice(0, outputParsing.max)
        logger.debug(`Regex matches for ${outputParsing.regex}: ${foundPrompts.length}`)
        for (const foundPrompt of foundPrompts) {
          if (type === SD0_4) {
            const { response, error } = await generateImages(user, {
              workflowUuid: workflowJob.workflowUuid,
              job: {
                //@ts-expect-error for some reason params is type {}
                params: { ...params, [insertion.param]: insert(foundPrompt) }
              }
            })
            if (error) { logger.error(response) }
          } else if (type === GEN_ACTION_ITEMS) {
            const { response, error } = await createActionItem(user, {
              //@ts-expect-error for some reason params is type {}
              noteUuid: params.noteUuid,
              [insertion.param]: insert(foundPrompt)
            })
            if (error) { logger.error(response) }
          } else { // type === GEN_ADVICE_TOOLTIPS
            const { response, error } = await updateAdviceTooltip(user, {
              //@ts-expect-error for some reason params is type {}
              actionItemUuid: params.actionItemUuid,
              [insertion.param]: insert(foundPrompt)
            })
            if (error) { logger.error(response) }
          }
        }
      }
    }
  }
}
