import { Logger, pino } from 'pino'
import ld from 'lodash'
import { LOG_LEVEL } from './config'

const EDGE_LIMIT = 200

export const formatLogObject = (object: any) => {
  if (typeof object !== 'object' || object instanceof Error || object === undefined || object === null) return object

  const copy = ld.cloneDeep(object)
  for (const key of Object.keys(object)) {
    if (typeof copy[key] === 'function') {
      copy[key] = copy[key].toString().split('\n')[0] + '...}'
    } else if (typeof copy[key] === 'object') {
      copy[key] = formatLogObject(copy[key])
    }
  }
  return copy
}

export const pinoConfig = (name: string) => ({
  level: LOG_LEVEL,
  name,
  edgeLimit: EDGE_LIMIT,
  timestamp: () => pino.stdTimeFunctions.isoTime(),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  //Beware: Leads to "Error: illegal invocation" with fastify's logger (due to different context)
  // formatters: { log: (o: object) => formatLogObject(o) }
})

export const logger: Logger = pino(pinoConfig('shinzo'))
