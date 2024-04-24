import { forwardRef, ReactElement, Ref, useCallback, useEffect, useMemo, useState } from 'react'
import { usePostBackend } from '../hooks/queryBackend'
import { WorkflowsPage } from './WorkflowsPage'
import { NotesPage } from './NotesPage'
import { DiscordLogin } from './DiscordLogin'
import { QueuePage } from './QueuePage'
import { createTheme } from '@mui/material/styles'
import { TransitionProps } from '@mui/material/transitions'
import { Avatar, Button, Dialog, DialogContent, DialogContentText, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, Slide } from "@mui/material"
import { Logout, Person } from '@mui/icons-material'
import { MuiThemeProvider } from "@material-ui/core"
import CssBaseline from "@material-ui/core/CssBaseline"
import { Link, Outlet, Route, Routes, useNavigate, useLocation } from "react-router-dom"
import { authCreds, saveInLocalStorage, fetchFromLocalStorage, removeFromLocalStorage } from '../utils'
import { DISCORD_AUTH_RETURN_HOST, DISCORD_AUTH_RETURN_PROTOCOL, REQUIRE_AUTH } from '../config'
import { buttonDivStyle, buttonStyle, centerBodyStyle, colorPalette, headerButtonStyle, headerStyle, leftHeaderStyle, dialogStyle, iconStyle, logoutButtonStyle } from '../styles'
import { AccessTokenData, DiscordLoginParams, RequestWithAuth, RefreshTokenData, UserProfiles } from '../types'
import { AxiosRequestConfig } from 'axios'
import AccountSettingsPage from './AccountSettingsPage'

const discordLoginForward = `https://discord.com/api/oauth2/authorize?client_id=1081617291462062301&redirect_uri=${DISCORD_AUTH_RETURN_PROTOCOL}%3A%2F%2F${DISCORD_AUTH_RETURN_HOST}%2FauthenticateDiscordCode&response_type=code&scope=identify%20email`

const theme = createTheme({
  palette: {
    background: { default: colorPalette.appBackground },
    text: { primary: colorPalette.text }
  }
})

const App = () => {
  const {
    sendRequest: refreshDiscordToken,
    loading: refreshingDiscordToken,
    response: refreshedAccessTokenData,
    error: refreshDiscordTokenError
  } = usePostBackend<RequestWithAuth, RefreshTokenData>('auth/refreshDiscordToken')

  const {
    sendRequest: authenticateDiscordCode,
    loading: loadingAccessToken,
    response: accessTokenData,
    error: authenticateDiscordCodeError
  } = usePostBackend<DiscordLoginParams, AccessTokenData>('auth/authenticateDiscordCode')

  const {
    sendRequest: fetchUserProfiles,
    loading: fetchingUserProfiles,
    response: userProfiles,
    error: fetchUserProfilesError
  } = usePostBackend<RequestWithAuth, UserProfiles>('auth/getUserProfiles')

  useMemo(() => {
    if (!refreshedAccessTokenData) {
      const discordAccessToken = fetchFromLocalStorage('discordAccessToken')
      if (discordAccessToken) refreshDiscordToken(authCreds())
    }
  }, [refreshedAccessTokenData, refreshDiscordToken])

  useEffect(() => {
    if (refreshDiscordTokenError) removeFromLocalStorage('discordAccessToken')
    else if (!refreshingDiscordToken && refreshedAccessTokenData?.body?.token) saveInLocalStorage('discordAccessToken', refreshedAccessTokenData?.body?.token)
  }, [refreshedAccessTokenData, refreshingDiscordToken, refreshDiscordTokenError])

  useMemo(async () => {
    const token = refreshedAccessTokenData?.body?.token ?? accessTokenData?.body?.token
    if (token) fetchUserProfiles({ token, provider: 'discord' })
  }, [accessTokenData, refreshedAccessTokenData])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<NavBar userProfiles={userProfiles?.body} fetchUserProfiles={fetchUserProfiles} fetchUserProfilesError={!!fetchUserProfilesError || !!refreshDiscordTokenError} />}>
          <Route path="notes" element={<NotesPage userProfiles={userProfiles?.body} />} />
          <Route path="workflows" element={<WorkflowsPage userProfiles={userProfiles?.body} />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="account" element={<AccountSettingsPage shinzoUser={userProfiles?.body.shinzoUser} />} />
        </Route>
        <Route path="authenticateDiscordCode" element={<DiscordLogin authenticateDiscordCode={authenticateDiscordCode} authenticateDiscordCodeError={authenticateDiscordCodeError} accessTokenData={accessTokenData} loadingAccessToken={loadingAccessToken} />} />
      </Routes>
    </MuiThemeProvider>
  )
}

const Transition = forwardRef(
  function Transition(
    props: TransitionProps & { children: ReactElement<any, any> },
    ref: Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />
  }
)

type UserButtonArgs = {
  discordUser?: UserProfiles["body"]["discordUser"]
  hidden: boolean
  onClickAccount?: () => void
  onClickLogout?: () => void
}

const UserButton = ({ hidden, discordUser, onClickAccount, onClickLogout }: UserButtonArgs) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const closeMenu = useCallback(() => setMenuAnchor(null), [])

  return (
    <div>
      {!hidden && <IconButton
        onClick={event => setMenuAnchor(event.currentTarget)}
        size="small"
        sx={{ ml: 2, marginRight: '35px', marginTop: '5px' }}
      >
        <Avatar sx={iconStyle}><img style={iconStyle} src={`https://cdn.discordapp.com/avatars/${discordUser?.id}/${discordUser?.avatar}`} /></Avatar>
      </IconButton>}
      <Menu
        anchorEl={menuAnchor}
        id="account-menu"
        open={!!menuAnchor}
        onClose={closeMenu}
        onClick={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={onClickAccount}>
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          Account
        </MenuItem>
        <MenuItem onClick={onClickLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </div>
  )
}

type NavBarArgs = {
  userProfiles: UserProfiles["body"] | undefined
  fetchUserProfiles: (data?: RequestWithAuth | undefined, config?: AxiosRequestConfig<RequestWithAuth> | undefined) => Promise<void>
  fetchUserProfilesError: boolean
}

const NavBar = ({ userProfiles, fetchUserProfiles, fetchUserProfilesError }: NavBarArgs) => {
  const navigate = useNavigate()
  const location = useLocation()

  const token = fetchFromLocalStorage('discordAccessToken')

  const login = () => {
    if (REQUIRE_AUTH === 'false') {
      navigate("authenticateDiscordCode")
    } else {
      window.location.href = discordLoginForward
    }
  }

  const logout = () => {
    removeFromLocalStorage('discordAccessToken')
    navigate("/")
  }

  useEffect(() => {
    location.pathname === '/' && navigate("/notes")
  }, [location])

  return (
    <div>
      <div style={headerStyle}>
        <Button sx={headerButtonStyle} component={Link} to="/notes">Notes</Button>
        <Button sx={headerButtonStyle} component={Link} to="/workflows">Workflows</Button>
        <Button sx={headerButtonStyle} component={Link} to="/queue">Queue</Button>
        <div style={{ position: 'fixed', right: '0px' }}>
          <UserButton onClickLogout={logout} onClickAccount={() => navigate('/account')} discordUser={userProfiles?.discordUser} hidden={!token || !userProfiles?.discordUser} />
        </div>
      </div>
      <Dialog
        open={!token || fetchUserProfilesError}
        TransitionComponent={Transition}
        keepMounted
      >
        <div style={dialogStyle}>
          <DialogTitle style={centerBodyStyle}>{"Login"}</DialogTitle>
          <DialogContent>
            <DialogContentText style={leftHeaderStyle}>
              Please log in with Discord to use Shinzo. Additional login options coming soon.
            </DialogContentText>
          </DialogContent>
          <div style={buttonDivStyle}>
            <Button sx={buttonStyle} onClick={login}>{"Login with Discord"}</Button>
          </div>
        </div>
      </Dialog>
      <Outlet />
    </div>
  )
}

export default App
