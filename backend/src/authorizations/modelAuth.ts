import {
  GPT3_5TURBO,
  GPT4O_MINI,
  SD0_4
} from "../const"
import { RateLimiter } from "../classes/rateLimit"

import { v4 } from 'uuid'

const modelRateLimiters = {
  [GPT3_5TURBO]: new RateLimiter([ // https://platform.openai.com/docs/guides/rate-limits/what-are-the-rate-limits-for-our-api
    {
      window: 60_000,
      limit: 2_000
    }
  ]),
  [GPT4O_MINI]: new RateLimiter([ // https://platform.openai.com/docs/guides/rate-limits/what-are-the-rate-limits-for-our-api
    {
      window: 60_000,
      limit: 2_000
    }
  ]),
  [SD0_4]: new RateLimiter([])
}

export const rateLimitedRequest = (model: typeof GPT3_5TURBO | typeof GPT4O_MINI | typeof SD0_4) => {
  const rateLimiter = modelRateLimiters[model]

  const msUntilNextAllow = rateLimiter.msUntilNextAllow()

  if (msUntilNextAllow <= 0) rateLimiter.addRequest(v4(), Date.now())

  return msUntilNextAllow
}
