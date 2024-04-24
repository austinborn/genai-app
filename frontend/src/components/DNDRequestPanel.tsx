import { useState } from 'react'
import { Button, TextField, Typography } from "@mui/material"
import { authCreds, GPT3_5TURBO, SD0_4 } from '../utils'
import {
  buttonStyle,
  spacedButtonDivStyle,
  leftBodyStyle,
  textFieldStyle
} from '../styles'
import {
  CompositeJobRequest,
  OutputPipe,
  UserProfiles,
  Job
} from '../types'

const OUTPUT_PIPE_TAG = '%%OUTPUT_PIPE%%'

const sdPromptTags = ['digital illustration artwork', 'high definition']
const sdNegativePromptTags = ['photograph', 'blurry', 'low definition']

const numberedListPromptInterpolation: OutputPipe =
{
  outputParsing: {
    style: 'regex',
    regex: "\\d{1,2}\\.? .*\\n.*(\\n\\n)?",
    max: 10
  },
  insertion: {
    param: 'prompt',
    style: 'interpolation',
    replacing: OUTPUT_PIPE_TAG
  }
}

const listElementUserMessage = (element: string) => `List all ${element.toLowerCase()} from the session with detailed visual descriptions.`

type DNDRequestPanelArgs = {
  workflowUuid?: string
  shinzoUser?: UserProfiles["body"]["shinzoUser"]
  pushRequestToQueue: (data?: CompositeJobRequest) => Promise<void>
}

export const DNDRequestPanel = ({ workflowUuid, shinzoUser, pushRequestToQueue }: DNDRequestPanelArgs) => {
  const [outline, setOutline] = useState<string>("")

  return (
    <div>
      <Typography variant='body1' sx={leftBodyStyle}>Session Overview:</Typography>
      <TextField sx={textFieldStyle} multiline maxRows={10} value={outline} onInput={(event) => setOutline((event.target as HTMLInputElement).value)} />
      <div style={spacedButtonDivStyle}>
        <Button sx={buttonStyle} onClick={() => pushRequestToQueue({
          ...authCreds(),
          workflowUuid,
          jobs: [
            {
              type: GPT3_5TURBO,
              params: {
                prompt: "Generate a Dungeons and Dragons campaign session with the following session outline: " + outline
              }
            },
            {
              type: GPT3_5TURBO,
              params: {
                prompt: listElementUserMessage("characters"),
              },
              postGenJobs: [
                {
                  type: SD0_4,
                  params: {
                    prompt: [`fantasy character portrait of ${OUTPUT_PIPE_TAG}`, ...sdPromptTags].join(', '),
                    negativePrompt: ['figurine', ...sdNegativePromptTags].join(', '),
                    numSeeds: 5,
                    height: 640,
                    width: 512,
                    steps: 30,
                    guidance: 9,
                    allowNsfw: !!shinzoUser?.defaultNsfwEnabled
                  },
                  outputPipes: [numberedListPromptInterpolation]
                }
              ]
            },
            {
              type: GPT3_5TURBO,
              params: {
                prompt: listElementUserMessage("locations"),
              },
              postGenJobs: [
                {
                  type: SD0_4,
                  params: {
                    prompt: [`fantasy location of ${OUTPUT_PIPE_TAG}`, ...sdPromptTags].join(', '),
                    negativePrompt: sdNegativePromptTags.join(', '),
                    numSeeds: 5,
                    height: 512,
                    width: 640,
                    steps: 30,
                    guidance: 9,
                    allowNsfw: !!shinzoUser?.defaultNsfwEnabled
                  },
                  outputPipes: [numberedListPromptInterpolation]
                }
              ]
            },
            {
              type: GPT3_5TURBO,
              params: {
                prompt: listElementUserMessage("enemies"),
              },
              postGenJobs: [
                {
                  type: SD0_4,
                  params: {
                    prompt: [`fantasy monster character portrait of ${OUTPUT_PIPE_TAG}`, ...sdPromptTags].join(', '),
                    negativePrompt: sdNegativePromptTags.join(', '),
                    numSeeds: 5,
                    height: 640,
                    width: 512,
                    steps: 30,
                    guidance: 9,
                    allowNsfw: !!shinzoUser?.defaultNsfwEnabled
                  },
                  outputPipes: [numberedListPromptInterpolation]
                }
              ]
            },
          ]
        })}>Generate Session</Button>
      </div>
    </div>
  )
}
