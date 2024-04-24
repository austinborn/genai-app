import {RequestWithAuth, JobService } from './types'

export const GPT3_5TURBO = 'gpt-3.5-turbo'
export const SD0_4 = 'sd-0.4'
export const DND_DM = 'dnd-dm'

export const typeName: Record<JobService, string>= {
  [SD0_4]: 'Stable Diffusion v0.4',
  [GPT3_5TURBO]: 'GPT 3.5-Turbo',
  [DND_DM]: 'Dungeons & Dragons DM'
}

const SECONDS_IN_MINUTE = 60
const MINUTES_IN_HOUR = 60
const HOURS_IN_DAY = 24
const DAYS_IN_WEEK = 7
const DAYS_IN_YEAR = 365
export const MS_PER_S = 1_000

const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR
const SECONDS_IN_DAY = SECONDS_IN_HOUR * HOURS_IN_DAY
const SECONDS_IN_YEAR = SECONDS_IN_DAY * DAYS_IN_YEAR

export const MS_IN_DAY = MS_PER_S * SECONDS_IN_DAY
export const MS_IN_WEEK = MS_IN_DAY * DAYS_IN_WEEK
export const MS_IN_YEAR = MS_IN_DAY * DAYS_IN_YEAR

export const secondsToReadableString = (seconds: number) => {
  const timescales = [
    { label: 'year', secondsIn: SECONDS_IN_YEAR },
    { label: 'day', secondsIn: SECONDS_IN_DAY },
    { label: 'hour', secondsIn: SECONDS_IN_HOUR },
    { label: 'minute', secondsIn: SECONDS_IN_MINUTE },
    { label: 'second', secondsIn: 1 }
  ]

  let readableString = ''
  let remainder = seconds
  for (const time of timescales) {
    const numOfTimescale = Math.floor(remainder / time.secondsIn)
    if (numOfTimescale > 0) {
      readableString += `${numOfTimescale} ${time.label}${numOfTimescale > 1 ? 's' : ''}, `
      remainder = remainder % time.secondsIn
    }
  }

  return readableString.slice(0, readableString.length - 2)
}

export const copyToClipboard = (c: string) => navigator.clipboard.writeText(c)

export const saveInLocalStorage = (name: string, data: any) => {
  window.localStorage.setItem(name, JSON.stringify(data))
}

export const fetchFromLocalStorage = (name: string) => {
  const item = window.localStorage.getItem(name)
  return item ? JSON.parse(item) : null
}

export const removeFromLocalStorage = (name: string) => {
  window.localStorage.removeItem(name)
}

export const authCreds: () => RequestWithAuth = () => ({ token: fetchFromLocalStorage('discordAccessToken'), provider: 'discord' })
