import { useEffect, useState } from 'react'
import { Box, LinearProgress } from '@mui/material'
import {
  progressBarStyle,
  progressBarBoxStyle
} from '../styles'

type TimeProgressBar = { totalSeconds: number, barSteps?: number }

const DEFAULT_BAR_STEPS = 40
const PROGRESS_COMPLETE = 100 //%
const SECOND = 1_000 //ms

export const TimedProgressBar = ({ totalSeconds, barSteps = DEFAULT_BAR_STEPS }: TimeProgressBar) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setProgress(
      progress => Math.min(progress + (PROGRESS_COMPLETE / barSteps), PROGRESS_COMPLETE)
    ), SECOND * totalSeconds / barSteps)

    return () => clearInterval(timer)
  }, [])

  return (
    <Box sx={progressBarBoxStyle}>
      <LinearProgress sx={progressBarStyle} variant="determinate" value={progress} />
    </Box>
  )
}

export default TimedProgressBar
