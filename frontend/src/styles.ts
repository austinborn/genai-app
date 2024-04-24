export const colorPalette = {
  button: '#78A480',
  buttonBackground: '#3b3838',
  dropdownGroupLabel: '#2b2828',
  headerButton: '#78A43D',
  text: '#ffffff',
  background: '#3b3838',
  appBackground: "#222222"
}

const headerPixels = 60
const avatarIconPixels = headerPixels - 20

const actionItemIconTopMargin = 30
const actionitemIconRightMargin = 8
const iconButtonDim = 35

const avatarDim = `${avatarIconPixels}px`
const headerHeight = `${headerPixels}px`

const wideFlexStyle = { display: 'flex', width: '100%' }

const textStyle = { color: colorPalette.text, margin: '1em', display: 'flex' }

export const tightTextStyle = { color: colorPalette.text, marginRight: '0.5em', display: 'flex' }

export const buttonStyle = { color: colorPalette.button, background: colorPalette.buttonBackground, float: 'center' }

export const headerButtonStyle = { color: colorPalette.headerButton }

export const logoutButtonStyle = {
  ...headerButtonStyle,
  position: 'fixed',
  margin: '3px',
  right: '0px',
  top: '0px'
}

export const headerStyle: React.CSSProperties = { ...wideFlexStyle, height: headerHeight, justifyContent: 'center', position: 'fixed' }

export const switchButtonStyle = {
  '& .Mui-checked+.MuiSwitch-track': {
    backgroundColor: `${colorPalette.background} !important`
  },
  '& .MuiButtonBase-root': {
    color: `${colorPalette.button} !important`
  }
}

export const toggleButtonStyle = {
  color: colorPalette.button,
  background: colorPalette.buttonBackground,
  '& .Mui-checked+.MuiSwitch-track': {
    backgroundColor: `${colorPalette.background} !important`
  },
  '& .MuiButtonBase-root': {
    color: `${colorPalette.button} !important`
  }
}

export const helpIconInactiveStyle = {
  cursor: 'pointer',
  margin: `${actionItemIconTopMargin}px ${actionitemIconRightMargin}px 0 0`
}

export const actionItemIconStyle = {
  cursor: 'pointer',
  margin: `${actionItemIconTopMargin}px ${actionitemIconRightMargin}px 0 0`,
  color: colorPalette.button
}

export const actionItemIconEmptyStyle = {
  margin: `${actionItemIconTopMargin + iconButtonDim}px ${actionitemIconRightMargin + iconButtonDim}px 0 0`
}

export const iconButtonBaseStyle = {
  color: colorPalette.button
}

export const autoIconStyle = {
  position: 'absolute',
  top: 10,
  right: 10,
  width: '30%',
  height: '30%',
  color: "white"
}

export const textFieldStyle = {
  width: '100%',
  background: colorPalette.background,
  '& .MuiOutlinedInput-input': {
    color: colorPalette.text
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `${colorPalette.button} !important`
  },
  marginTop: '16px'
}

export const cardStyle = { backgroundColor: colorPalette.background, color: colorPalette.text, margin: '1em', padding: '1em', width: '800px', maxWidth: '800px', height: 'fit-content' }

export const paperWrapperStyle = { display: 'flex', justifyContent: 'center' }

export const leftBodyStyle = { ...textStyle, justifyContent: 'left', whiteSpace: 'pre-line' }

export const centerBodyStyle = { ...textStyle, justifyContent: 'center' }

export const rightHeaderStyle = { ...textStyle, justifyContent: 'right' }

export const leftHeaderStyle = { ...textStyle, justifyContent: 'left' }

export const selectMenuProps = {
  PaperProps: {
    style: {
      color: colorPalette.text,
      backgroundColor: colorPalette.background
    }
  }
}

export const dropdownStyle = {
  backgroundColor: `${colorPalette.background} !important`,
  '& .MuiOutlinedInput-input': {
    color: colorPalette.text
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `${colorPalette.button} !important`
  },
  width: '100%',
  margin: '0 0 0 0'
}

export const topDropdownStyle = {
  ...dropdownStyle,
  height: 'fit-content',
  margin: '16px 0 0 0'
}

export const dropdownHeaderStyle = {
  backgroundColor: colorPalette.dropdownGroupLabel,
  color: colorPalette.text
}

export const progressBarStyle = {
  backgroundColor: colorPalette.background,
  '& .MuiLinearProgress-bar': {
    backgroundColor: colorPalette.button
  }
}

export const contentHeaderStyle = { color: colorPalette.button, width: '12em', minWidth: '12em' }

export const dialogStyle = { background: colorPalette.background }

export const jobPaperStyle = { background: colorPalette.background, color: colorPalette.text, margin: '0 0 6px 0', padding: '6px', width: 'fit-content' }

export const thumbnailStyle = { margin: '1em', width: '200px', height: 'auto' }

export const iconStyle = { height: avatarDim, width: avatarDim }

export const contentWindowStyle: React.CSSProperties = { overflow: 'scroll', position: 'fixed', margin: '0em 1em 0em 1em', top: headerHeight, bottom: '0px', left: '400px', right: '0px', width: 'unset' }

export const progressBarBoxStyle = { width: '80%', padding: '2em', alignItems: 'center' }

export const imageListStyle = {
  gridAutoFlow: "column",
  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr)) !important",
  gridAutoColumns: "minmax(200px, 1fr)"
}

export const pageStyle: React.CSSProperties = { ...wideFlexStyle, top: headerHeight, bottom: '0px', position: 'fixed' }

export const singlePageStyle: React.CSSProperties = { ...pageStyle, overflow: 'scroll', display: 'revert' }

export const leftPanelStyle: React.CSSProperties = { padding: '0 16px 0 16px', top: headerHeight, left: '0px', width: '400px', bottom: '0px', position: 'fixed' }

export const singleRowStyle: React.CSSProperties = { display: 'flex', width: '100%' }

export const requestPanelStyle: React.CSSProperties = {
  overflow: 'scroll',
  position: 'fixed',
  bottom: '0px',
  width: '368px',
  top: '200px'
}

export const buttonDivStyle = { justifyContent: 'center', display: 'flex', margin: '16px' }

export const spacedButtonDivStyle = { ...buttonDivStyle, margin: '16px 0 0 0' }

export const detailsHeaderStyle = { color: colorPalette.headerButton, margin: '0 0.5em 0 0', verticalAlign: 'top' }