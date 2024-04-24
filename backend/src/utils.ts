import { Decimal } from 'decimal.js'
import { logger } from './logger'
import { SendReply } from './types'
import { v4 } from 'uuid'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFile } from 'fs'
import { USER_DIR_PWD } from './config'

export const getRandomSeed = () => (new Decimal(Math.random()).mul(new Decimal(2).pow(64))).floor().minus(new Decimal(2).pow(63)).toString()

export const sendReply = ({ body, status, error, reply }: SendReply) => {
  const replyMessage = error
    ? { status: status ?? 400, error: body }
    : { status: status ?? 200, body }

  logger.debug({ replyMessage })
  reply.send(replyMessage)
}

export const getImagePath = (userUuid: string, imageUuid: string) => `users/${userUuid}images/${imageUuid}.png`

export const getTextPath = (userUuid: string) => `users/${userUuid}/text/${v4()}.txt`

/** Note the paramLengths must be in intended loop order (first dimensions loop the slowest) */
export const decodeMultiArray = (absIdx: number, paramLengths: number[]): number[] => {
  const decodedIndices: number[] = []

  let total = paramLengths.reduce((acc, l) => l * acc, 1)

  for (const length of paramLengths) {
    total /= length
    const idx = Math.floor(absIdx / total)
    absIdx %= total
    decodedIndices.push(idx)
  }

  return decodedIndices
}

export const sleep = async (ms: number) => new Promise((r) => setTimeout(r, ms))

export const existsSyncRelative = (relPath: string) => existsSync(`${USER_DIR_PWD}${relPath}`)

export const mkdirSyncRelative = (relPath: string) => mkdirSync(`${USER_DIR_PWD}${relPath}`, { recursive: true })

export const readFileSyncRelative = (relPath: string) => readFileSync(`${USER_DIR_PWD}${relPath}`)

export const writeFileRelative = (relPath: string, text: string) => writeFile(`${USER_DIR_PWD}${relPath}`, text, (err) => { if (err) throw err })

export const writeBase64FileRelative = (relPath: string, base64Data: string) => writeFile(`${USER_DIR_PWD}${relPath}`, base64Data, 'base64', (err) => { if (err) throw err })

export const unlinkSyncRelative = (relPath: string) => unlinkSync(`${USER_DIR_PWD}${relPath}`)
