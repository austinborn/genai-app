import { SubscriptionTier, UserWithAuth } from '../types'
import { User } from '../models'
import { RateLimiter } from "../classes/rateLimit"
import {
  EXPLORER,
  TINKERER,
  CREATOR,
  GROUNDBREAKER
} from "../const"

import { v4 } from 'uuid'

const B_MAGNITUDE = 2 ** 10

const B_PER_MB = B_MAGNITUDE ** 2
const B_PER_GB = B_MAGNITUDE ** 3
const B_PER_TB = B_MAGNITUDE ** 4

const userRateLimits: { [userUuid: string]: RateLimiter } = {}

const subscriptionTiers: Record<string, SubscriptionTier> = {
  [EXPLORER]: { // Max Loss: $1.79/yr, 90% of users?
    name: "Explorer",
    billing: {
      perpetual: 0
    },
    rateLimits: [
      {
        window: 60_000, // minute
        limit: 2
      },
      {
        window: 86_400_000, // day
        limit: 10
      },
      {
        window: 2_592_000_000, // month
        limit: 50
      }
    ],
    storage: 100 * B_PER_MB, // Max cost: $0.0075/yr
    compositeJobs: 0,
    authorizations: {
      canUseGPT: true,
      canUseSD: true,
      canSubmitNSFWSD: false,
      canUseAdvandedUI: false,
      receivesWhiteGloveSupport: false
    }
  },
  [TINKERER]: { // Min Profit: $88.73/yr, 7.5% of users?
    name: "Tinkerer",
    billing: {
      monthly: 8 // Revenue: $96/yr
    },
    rateLimits: [
      {
        window: 60_000, // minute
        limit: 5
      },
      {
        window: 86_400_000, // day
        limit: 30
      },
      {
        window: 2_592_000_000, // month
        limit: 200
      }
    ],
    storage: B_PER_GB, // Max cost: $0.075/yr
    compositeJobs: 3,
    authorizations: {
      canUseGPT: true,
      canUseSD: true,
      canSubmitNSFWSD: true
    }
  },
  [CREATOR]: { // Min Profit: $269.25/yr, 2% of users?
    name: "Creator",
    billing: {
      monthly: 30, // Revenue: $360/yr
      yearly: 30 * 12 * 0.95 // 10% discount, Revenue: $324/yr
    },
    rateLimits: [
      {
        window: 60_000, // minute
        limit: 10
      },
      {
        window: 86_400_000, // day
        limit: 200
      },
      {
        window: 2_592_000_000, // month
        limit: 1_500
      }
    ],
    storage: 10 * B_PER_GB, // Max cost: ~$0.75/yr
    compositeJobs: 10,
    authorizations: {
      canUseGPT: true,
      canUseSD: true,
      canSubmitNSFWSD: true,
      canUseAdvandedUI: true
    }
  },
  [GROUNDBREAKER]: { // Min Profit: $5025/yr, 0.5% of users?
    name: "Groundbreaker",
    billing: {
      monthly: 600, // Revenue: ~$7200/yr
      yearly: 600 * 12 * 0.9, // 10% discount, Revenue: $6480/yr
      perpetual: 600 * 12 * 0.8 * 20 // 20% discount, Revenue: $105,200 lump sum
    },
    rateLimits: [
      {
        window: 60_000, // minute
        limit: 30
      },
      {
        window: 86_400_000, // day
        limit: 1_200
      },
      {
        window: 2_592_000_000, // month
        limit: 30_000
      }
    ],
    storage: 5 * B_PER_TB, // Max cost: ~$375/yr
    compositeJobs: 'unlimited',
    authorizations: {
      canUseGPT: true,
      canUseSD: true,
      canSubmitNSFWSD: true,
      canUseAdvandedUI: true,
      receivesWhiteGloveSupport: true
    }
  }
}

export const getUserWithAuth = (user: User) => {
  const subscriptionTier = subscriptionTiers[user.subscription_tier]
  const userWithAuth: UserWithAuth = {
    uuid: user.uuid,
    email: user.email,
    defaultNsfwEnabled: user.default_nsfw_enabled,
    active: user.active,
    subscriptionName: subscriptionTier.name,
    subscriptionTier: user.subscription_tier,
    authorizations: subscriptionTier.authorizations
  }

  return userWithAuth
}

export const rateLimitedRequest = (user: UserWithAuth) => {
  let userLimits = userRateLimits[user.uuid]

  if (!userLimits) {
    userLimits = new RateLimiter(subscriptionTiers[user.subscriptionTier].rateLimits)
    userRateLimits[user.uuid] = userLimits
  }

  const msUntilNextAllow = userLimits.msUntilNextAllow()

  if (msUntilNextAllow <= 0) userLimits.addRequest(v4(), Date.now())

  return msUntilNextAllow
}

// TODO figure out how to count storage limits when adding files
