import fastify, { FastifyReply } from 'fastify'
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors'
import { PORT, USER_DIR_PWD } from './config'
import { createCompositeJob, deleteCompositeJob, runCompositeJob, updateCompositeJob } from './handlers/compositeJob'
import { deleteWorkflow, listJobs, listWorkflows } from './handlers/workflows'
import { cancelJob, fetchJobQueue } from './handlers/jobQueue'
import { logger, pinoConfig } from './logger'
import {
  authenticateDiscordCode,
  getAuthenticatedUser,
  getUserProfiles,
  refreshDiscordToken
} from './handlers/authentication'
import {
  createActionItem,
  createNote,
  deleteActionItem,
  deleteNote,
  generateActionItems,
  generateAdviceTooltips,
  listNotes,
  reorderActionItem,
  updateActionItem,
  updateNote
} from './handlers/productivity'
import {
  createCompositeJobSchema,
  deleteCompositeJobSchema,
  deleteWorkflowSchema,
  runCompositeJobSchema,
  updateCompositeJobSchema,
  cancelJobSchema,
  baseRequestBodySchema,
  listJobsSchema,
  createActionItemSchema,
  createNoteSchema,
  deleteActionItemSchema,
  deleteNoteSchema,
  reorderActionItemSchema,
  updateActionItemSchema,
  updateNoteSchema,
  generateActionItemsSchema,
  generateAdviceTooltipsSchema
} from './schema'
import fastifyStatic from '@fastify/static'
import { Request, RequestHandler, RequestMiddlewareOptions, UserWithAuth } from './types'
import { sendReply } from './utils'
import { rateLimitedRequest } from './authorizations/userAuth'

import * as yup from 'yup'

const server = fastify({
  logger: pinoConfig('sd-backend'),
  bodyLimit: 1024 * 1024 * 16, // 16 MiB
})

// // Added per https://www.fastify.io/docs/latest/Reference/ContentTypeParser/
// server.addContentTypeParser('*', function (request, payload, done) {
//   done(null)
// })

server.register(fastifyCors, () => (request: any, callback: any) => {
  try {
    logger.trace({ request })
    const corsOptions: FastifyCorsOptions = {
      origin: (origin, cb) => {
        logger.debug({ origin })
        //TODO update to prevent CORS hacks
        // new URL(origin || '').hostname === "localhost" ?
        cb(null, true)
        // : cb(new Error("Not allowed"), false)
      }
    }
    logger.debug({ corsOptions })
    callback(null, corsOptions)
  } catch (error) {
    callback(error as Error, { origin: false })
  }
})

const requestMiddleware = <T extends yup.ISchema<any, any, any, any>>(requestHandler: RequestHandler<T, any>, requestBodySchema: T, options?: RequestMiddlewareOptions) => async (request: Request, reply: FastifyReply) => {
  try {
    logger.trace({ request })
    const { body, params, query } = request
    logger.debug({ body, params, query })

    const user: UserWithAuth | null = await getAuthenticatedUser(request.body)
    logger.debug({ user })

    if (!user) {
      sendReply({ body: 'Forbidden', error: true, status: 403, reply })
      return
    }

    if (options?.rateLimit) {
      const msToNextRequest = await rateLimitedRequest(user)

      if (msToNextRequest > 0) {
        sendReply({ body: `Too many requests, wait ${msToNextRequest}ms`, error: true, status: 429, reply })
        return
      }
    }

    if (!options?.keepAuthData) {
      delete request.body.token
      delete request.body.provider
    }

    await requestBodySchema.validate(request.body)

    const { response, error, status } = await requestHandler(user, request.body)
    sendReply({ body: response, error, status, reply })
  } catch (error: any) {
    logger.error(error)
    sendReply({ body: error, reply, status: 500, error: true })
    return
  }
}

// User Authentication Methods
server.post('/auth/getUserProfiles', requestMiddleware<typeof baseRequestBodySchema>(getUserProfiles, baseRequestBodySchema, { keepAuthData: true }))
server.post('/auth/authenticateDiscordCode', authenticateDiscordCode)
server.post('/auth/refreshDiscordToken', requestMiddleware<any>(refreshDiscordToken, yup.object()))

// Main Workflow Methods
server.post('/workflow/listWorkflows', requestMiddleware<any>(listWorkflows, yup.object()))
server.post('/workflow/listJobs', requestMiddleware<typeof listJobsSchema>(listJobs, listJobsSchema))
server.post('/workflow/deleteWorkflow', requestMiddleware<typeof deleteWorkflowSchema>(deleteWorkflow, deleteWorkflowSchema))

// Composite Job Methods
server.post('/compositeJob/run', requestMiddleware<typeof runCompositeJobSchema>(runCompositeJob, runCompositeJobSchema, { rateLimit: true }))
server.post('/compositeJob/create', requestMiddleware<typeof createCompositeJobSchema>(createCompositeJob, createCompositeJobSchema))
server.post('/compositeJob/update', requestMiddleware<typeof updateCompositeJobSchema>(updateCompositeJob, updateCompositeJobSchema))
server.post('/compositeJob/delete', requestMiddleware<typeof deleteCompositeJobSchema>(deleteCompositeJob, deleteCompositeJobSchema))

// Queue Methods
server.post('/queue/cancelJob', requestMiddleware<typeof cancelJobSchema>(cancelJob, cancelJobSchema))
server.post('/queue/fetchJobQueue', requestMiddleware<any>(fetchJobQueue, yup.object()))

// Note Methods
server.post('/note/listNotes', requestMiddleware<any>(listNotes, yup.object()))
server.post('/note/createNote', requestMiddleware<typeof createNoteSchema>(createNote, createNoteSchema))
server.post('/note/updateNote', requestMiddleware<typeof updateNoteSchema>(updateNote, updateNoteSchema))
server.post('/note/deleteNote', requestMiddleware<typeof deleteNoteSchema>(deleteNote, deleteNoteSchema))

// Action Item Methods
server.post('/actionItem/createActionItem', requestMiddleware<typeof createActionItemSchema>(createActionItem, createActionItemSchema))
server.post('/actionItem/updateActionItem', requestMiddleware<typeof updateActionItemSchema>(updateActionItem, updateActionItemSchema))
server.post('/actionItem/deleteActionItem', requestMiddleware<typeof deleteActionItemSchema>(deleteActionItem, deleteActionItemSchema))
server.post('/actionItem/reorderActionItem', requestMiddleware<typeof reorderActionItemSchema>(reorderActionItem, reorderActionItemSchema))
server.post('/actionItem/generateActionItems', requestMiddleware<typeof generateActionItemsSchema>(generateActionItems, generateActionItemsSchema))
server.post('/actionItem/generateAdviceTooltips', requestMiddleware<typeof generateAdviceTooltipsSchema>(generateAdviceTooltips, generateAdviceTooltipsSchema))

// User image Hosting
server.register(fastifyStatic, { root: USER_DIR_PWD ? `${USER_DIR_PWD}users` : '/app/users', prefix: '/users' })

// Start server
const start = async () => {
  try {
    logger.info({ msg: `Starting service on port ${PORT}` })

    // TODO fetch queue state from DB and start processing

    await server.listen({ port: parseInt(PORT), host: '0.0.0.0' })
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

start()
