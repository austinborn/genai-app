import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchFromLocalStorage, saveInLocalStorage } from '../utils'
import { AccessTokenData, DiscordLoginParams } from '../types'
import { REQUIRE_AUTH } from '../config'

type DiscordLoginArgs = {
  authenticateDiscordCode: (loginParams: DiscordLoginParams) => void
  authenticateDiscordCodeError: Error | null
  accessTokenData: AccessTokenData | null
  loadingAccessToken: boolean
}

export const DiscordLogin = ({
  authenticateDiscordCode,
  authenticateDiscordCodeError,
  accessTokenData,
  loadingAccessToken
}: DiscordLoginArgs) => {
  const navigate = useNavigate()

  const { search } = useLocation()

  const code = useMemo(() => {
    const query = new URLSearchParams(search)
    return REQUIRE_AUTH === 'false' ? 'DISCORD_CODE' : query.get('code')
  }, [search])

  useEffect(() => {
    const { status, body } = accessTokenData ?? {}

    const storedToken = fetchFromLocalStorage('discordAccessToken')
    if (!code || storedToken || authenticateDiscordCodeError || (status && status !== 200)) navigate('/')
    else if(!loadingAccessToken) {
      if (body?.token) {
        saveInLocalStorage('discordAccessToken', body?.token)
        navigate('/')
      } else authenticateDiscordCode({ code })
    }
  }, [accessTokenData, authenticateDiscordCodeError, loadingAccessToken])

  return <div></div>
}

export default DiscordLogin
