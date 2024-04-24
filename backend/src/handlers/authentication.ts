import { APP_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, REQUIRE_AUTH } from '../config'
import { FastifyReply } from 'fastify'
import axios, { AxiosResponse } from 'axios'
import { randomUUID } from 'crypto'
// import { OAuth2Client } from 'google-auth-library'
import { OAuthToken, User } from '../models/index'
import { AccessTokenResponse, DiscordUser, Request, RequestHandler, UserWithAuth, UserProfiles } from '../types'
import { logger } from '../logger'
import { mkdirSyncRelative, sendReply } from '../utils'
import { dbClient } from '../dbClient'
import { getUserWithAuth } from '../authorizations/userAuth'
import { baseRequestBodySchema } from '../schema'
import { EXPLORER } from '../const'

// const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

const getDevTokenData: () => AccessTokenResponse = () => {
  const uuid = randomUUID()
  
  return {
    access_token: `ACCESS_TOKEN-${uuid}`,
    token_type: "Bearer",
    expires_in: 9999999999,
    refresh_token: `REFRESH_TOKEN-${uuid}`,
    scope: "identify email"
  }
}

const devDiscordUser: AxiosResponse<DiscordUser, any> = {
  data: {
    accent_color: 3153181,
    avatar: "c35125e54a11ec12aabef103d3c08d64",
    avatar_decoration: null,
    banner: null,
    banner_color: '#78A43D',
    discriminator: "0",
    email: "EMAIL",
    flags: 0,
    global_name: "GLOBAL_NAME",
    id: "189152971353882624",
    locale: "en-US",
    mfa_enabled: false,
    premium_type: 0,
    public_flags: 0,
    username: "USERNAME",
    verified: true
  },
  status: 200,
  statusText: "success",
  headers: {},
  config: {}
}

const fetchDiscordUser = async (type: string, token: string) => {
  if (REQUIRE_AUTH === 'false') return devDiscordUser

  return await axios.get<DiscordUser>(
    "https://discord.com/api/v10/users/@me",
    { headers: { Authorization: `${type} ${token}` } }
  )
}

export const getAuthenticatedUser = async (requestBody: Request["body"]): Promise<UserWithAuth | null> => {
  await baseRequestBodySchema.validate(requestBody)

  const { token, provider } = requestBody

  // TODO change token to be a separate, internal parallel token 

  let user: UserWithAuth | null = null

  switch (provider) {
    case 'discord': {
      const [users] = await dbClient.query(`\
        select u.* from main.user u \
        right join main.oauth_token oat on oat.user_uuid = u.uuid \
        where oat.provider = 'discord' \
        and oat.access_token = '${token}' \
        and oat.expires_at > CURRENT_TIMESTAMP \
      `) as [(User | undefined)[], unknown]
      logger.debug({ users })
      
      if (users[0]) user = getUserWithAuth(users[0])
      break
    }
    case 'google': {
      // TODO support google SSO
      break
    }

    default: {
      break
    }
  }

  return user
}

export const getUserProfiles: RequestHandler<typeof baseRequestBodySchema, UserProfiles> = async (user, request) => {
  const { token, provider } = request

  const userProfiles: UserProfiles = { shinzoUser: user }

  switch (provider) {
    case 'discord': {
      const oauthToken = await OAuthToken.findOne({
        where: {
          provider: 'discord',
          user_uuid: user.uuid,
          access_token: token
        }
      })

      if (!oauthToken) return { response: `No OAuth Token entry for token=${token}`, error: true }

      const { data } = await fetchDiscordUser(oauthToken.token_type, token)

      if (user.email !== data.email) {
        await User.update({ email: data.email }, { where: { uuid: user.uuid } })
        userProfiles.shinzoUser.email = data.email
      }

      userProfiles.discordUser = data
      break
    }
    default: {
      return { response: `SSO Provider ${provider} is not supported at this time`, error: true }
    }
  }

  return { response: userProfiles }
}

export const refreshDiscordToken: RequestHandler<any, { token: string }> = async (user: UserWithAuth) => {
  const [oauthRefreshTokens] = await dbClient.query(`\
    select refresh_token \
    from main.oauth_token \
    where user_uuid = '${user.uuid}' \
    order by created_at desc \
    limit 1 \
  `) as { refresh_token: string }[][]

  const latestOauthToken = oauthRefreshTokens[0]

  if (!latestOauthToken) return { response: `No OAuth Token entry for token=${latestOauthToken}`, error: true }

  let tokenData

  if (REQUIRE_AUTH === 'false') {
    tokenData = getDevTokenData()
  } else {
    tokenData = (await axios.post<AccessTokenResponse>(
      "https://discord.com/api/v10/oauth2/token",
      new URLSearchParams({
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": latestOauthToken.refresh_token
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )).data
  }

  let newOauthToken = await OAuthToken.findOne({
    where: {
      provider: 'discord',
      user_uuid: user.uuid,
      access_token: tokenData.access_token
    }
  })

  if (!newOauthToken) {
    await OAuthToken.create({
      provider: 'discord',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1_000).toISOString(),
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      user_uuid: user.uuid
    })
  }

  return { response: { token: tokenData.access_token } }
}

export const authenticateDiscordCode = async (request: Request, reply: FastifyReply) => {
  try {
    logger.trace({ request })
    const { body, params, query } = request
    logger.debug({ body, params, query })

    if ((!body?.code || typeof body.code !== 'string') && REQUIRE_AUTH !== 'false') {
      sendReply({ body: "Expected argument 'code' to have type 'string'", error: true, reply })
      return
    }

    let tokenData

    if (REQUIRE_AUTH === 'false') {
      tokenData = getDevTokenData()
    }
    else {
      tokenData = (await axios.post<AccessTokenResponse>(
        "https://discord.com/api/v10/oauth2/token",
        new URLSearchParams({
          "client_id": DISCORD_CLIENT_ID,
          "client_secret": DISCORD_CLIENT_SECRET,
          "grant_type": "authorization_code",
          "code": body.code,
          "redirect_uri": APP_URL + 'authenticateDiscordCode'
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )).data
    }

    const { data: userData } = await fetchDiscordUser(tokenData.token_type, tokenData.access_token)

    let user = await User.findOne({ where: { discord_id: userData.id } })

    if (!user) {
      user = await User.create({
        discord_id: userData.id,
        default_nsfw_enabled: false,
        email: userData.email,
        subscription_tier: EXPLORER,
        active: true
      })

      mkdirSyncRelative(`users/${user.uuid}/images`)
      mkdirSyncRelative(`users/${user.uuid}/text`)
    }

    let oauthToken = await OAuthToken.findOne({
      where: {
        provider: 'discord',
        user_uuid: user.uuid,
        access_token: tokenData.access_token
      }
    })

    if (!oauthToken) {
      await OAuthToken.create({
        provider: 'discord',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1_000).toISOString(),
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        user_uuid: user.uuid
      })
    }

    sendReply({ body: { token: tokenData.access_token }, reply })
    return
  } catch (error) {
    logger.error(error)
    sendReply({ body: 'Unknown Error', reply, status: 500, error: true })
    return
  }
}
