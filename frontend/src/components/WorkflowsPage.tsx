import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePostBackend } from '../hooks/queryBackend'
import { Button, IconButton, ImageList, ImageListItem, ListSubheader, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import { AutoMode, ExpandMore } from '@mui/icons-material'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { authCreds, DND_DM, GPT3_5TURBO, GPT4O_MINI, MS_IN_DAY, MS_IN_WEEK, MS_IN_YEAR, SD0_4, typeName } from '../utils'
import { StableDiffusionRequestPanel } from './StableDiffusionRequestPanel'
import { DNDRequestPanel } from './DNDRequestPanel'
import { BACKEND_URL } from '../config'
import { InfiniteScrollWindow } from './InfiniteScrollWindow'
import {
  RequestWithAuth,
  CompositeJobRequest,
  InfiniteScrollResponse,
  BaseWorkflowList,
  Job,
  JobService,
  Queue,
  WorkflowType,
  WorkflowList,
  ListJobs,
  UserProfiles,
  JobDetails
} from '../types'
import {
  buttonStyle,
  spacedButtonDivStyle,
  contentHeaderStyle,
  jobPaperStyle,
  textFieldStyle,
  thumbnailStyle,
  requestPanelStyle,
  contentWindowStyle,
  imageListStyle,
  pageStyle,
  leftPanelStyle,
  topDropdownStyle,
  selectMenuProps,
  dropdownHeaderStyle,
  tightTextStyle,
  colorPalette,
  detailsHeaderStyle
} from '../styles'
import { generate as generateShortId } from 'shortid'

const DEFAULT_PROMPT = ''

const JOB_FETCH_SIZE = 10

const JOB_SERVICES: JobService[] = [GPT3_5TURBO, GPT4O_MINI, SD0_4, DND_DM]

const jobServices: { label: string, value: JobService }[] = JOB_SERVICES.map(service => ({
  label: typeName[service],
  value: service
}))

type GetBaseWorkflowList = () => BaseWorkflowList

const baseWorkflowList: GetBaseWorkflowList = () => {
  const curTime = Date.now()
  return [
    {
      label: 'Last 24 Hours',
      cutoffTime: curTime - MS_IN_DAY,
      workflows: []
    },
    {
      label: 'Last Week',
      cutoffTime: curTime - MS_IN_WEEK,
      workflows: []
    },
    {
      label: 'Last 2 Weeks',
      cutoffTime: curTime - MS_IN_WEEK * 2,
      workflows: []
    },
    {
      label: 'Last 4 Weeks',
      cutoffTime: curTime - MS_IN_WEEK * 4,
      workflows: []
    },
    {
      label: 'Last 3 Months',
      cutoffTime: curTime - MS_IN_DAY * 90,
      workflows: []
    },
    {
      label: 'Last Year',
      cutoffTime: curTime - MS_IN_YEAR,
      workflows: []
    },
    {
      label: 'Historical',
      cutoffTime: 0,
      workflows: []
    }
  ]
}

const buildRequestDataConfig = (headJobUuid: string) => ({
  queryData: {
    ...authCreds(),
    headJobUuid,
    count: JOB_FETCH_SIZE
  }
})

type GPTRequestPanelParams = {
  model: typeof GPT3_5TURBO | typeof GPT4O_MINI
  workflowUuid?: string
  pushRequestToQueue: (data?: CompositeJobRequest) => Promise<void>
  repeatJob: Job | null
}

const GPTRequestPanel = ({ model, workflowUuid, pushRequestToQueue, repeatJob }: GPTRequestPanelParams) => {
  const [userMessage, setUserMessage] = useState<string>(DEFAULT_PROMPT)

  useEffect(() => {
    if (repeatJob?.chat?.[0]) {
      setUserMessage(repeatJob?.chat[0].previousMessage)
    }
  }, [repeatJob])

  return (
    <div>
      <TextField value={userMessage} sx={textFieldStyle} multiline maxRows={10} onInput={(event) => setUserMessage((event.target as HTMLInputElement).value)} />
      <div style={spacedButtonDivStyle}>
        <Button sx={buttonStyle} onClick={() => pushRequestToQueue({
          ...authCreds(),
          workflowUuid,
          jobs: [
            {
              type: model,
              params: {
                type: model,
                prompt: userMessage,
                maxChatHistoryLength: 50,
                maxChatHistoryChars: 10_000
              }
            }
          ]
        })}>Send</Button>
      </div>
    </div>
  )
}

const formattedDetails = (jobDetails: JobDetails) => {
  const textBlocks: ({ type: 'code', language: string, code: string } | { type: 'text', text: string })[] = []

  let BodyComponent
  if (jobDetails.body) {
    const regex = /(?:([\s\S]+?)(?:```(\w*)\n([\s\S]+?)```|$))/g

    let body = jobDetails.body
    let match
    while ((match = regex.exec(body)) !== null) {
      const text = match[1] && match[1].trim()
      const language = match[2]
      const code = match[3]

      if (text) textBlocks.push({ type: 'text', text })
      if (code) textBlocks.push({ type: 'code', language, code })
    }

    BodyComponent = textBlocks.map(b => (
      b.type === 'code'
        ? <SyntaxHighlighter key={generateShortId()} wrapLongLines={true} language={b.language} style={dracula}>{b.code}</SyntaxHighlighter>
        : <React.Fragment key={generateShortId()}>{b.text.split('\n').map(line => (
          <React.Fragment key={generateShortId()}>{line}<br /></React.Fragment>
        ))}</React.Fragment>
    ))
  } else {
    BodyComponent = jobDetails.customBodyComponent
  }

  return (
    <div key={generateShortId()} style={{ margin: jobDetails.margin ?? '6px 0 0 0' }}>
      <Typography variant='body2' sx={tightTextStyle} component={'span'}>
        <span>
          <strong style={{ ...detailsHeaderStyle, color: jobDetails.color ?? colorPalette.headerButton }}>
            {jobDetails.header}
          </strong>
          {BodyComponent}
        </span>
      </Typography>
    </div>
  )
}

const FormattedJob = (
  discordUser: UserProfiles["body"]["discordUser"],
  rowStates: boolean[],
  updateRowState: (i: number, newState: boolean) => void,
  setRepeatJob: React.Dispatch<React.SetStateAction<Job | null>>
) => (j: Job, i: number, onLoad: () => void) => {
  let details: JobDetails[] = []
  let additionalDetails: JobDetails[] = []
  let additionalContent

  if (j.batch) {
    details = [
      { header: "Prompt", body: j.batch.prompt, color: colorPalette.headerButton, margin: '0' },
      { header: "Negative Prompt", body: j.batch.negativePrompt ?? "" },
      { header: "Generated", body: `${Math.floor(100 * (j.images ?? []).length / Number.parseInt(j.batch.numSeeds))}% (${(j.images ?? []).length}/${j.batch.numSeeds})` }
    ]
    additionalDetails = [
      ...(j.batch?.initImagePath ? [] : [
        { header: "Height", body: j.batch.height ?? "N/A" },
        { header: "Width", body: j.batch.width ?? "N/A" }
      ]),
      { header: "Steps", body: j.batch.steps },
      { header: "Guidance", body: j.batch.guidance },
      { header: "Eta", body: j.batch.eta },
      ...(j.batch.allowNsfw ? [{ header: "Allow NSFW", body: j.batch.allowNsfw ? 'True' : 'False' }] : []),
      ...(j.batch?.initImagePath ? [
        { header: "Strength", body: j.batch.initImagePath ? (j.batch.strength ?? "") : "N/A" },
        { header: "Initial Image", customBodyComponent: <img style={thumbnailStyle} src={BACKEND_URL + j.batch.initImagePath} /> }
      ] : [])
    ]
    additionalContent = (
      <div style={{ width: '100%' }}>
        <ImageList sx={imageListStyle}>
          {(j.images ?? []).map((img, imgIdx) => (
            <ImageListItem key={img}>
              <img style={thumbnailStyle} src={BACKEND_URL + img} loading={imgIdx < 3 ? "eager" : "lazy"} />
            </ImageListItem>
          ))}
        </ImageList>
      </div>
    )
  } else if (j.completionRequestUuid) {
    details = [
      { header: discordUser?.username ?? "", body: j.chat?.[0].previousMessage ?? "", margin: '0' },
      { header: j.chat?.[0].model ?? 'GPT', body: j.chat?.[0].message ?? "", color: colorPalette.button }
    ]
  }

  return (
    <div key={j.uuid}>
      <Paper style={jobPaperStyle} elevation={3}>
        <table>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <IconButton onClick={() => setRepeatJob(j)}>
                  <AutoMode />
                </IconButton>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <Typography variant='body1' sx={contentHeaderStyle}>
                  {typeName[j.type] ?? "Unknown Service"}
                </Typography>
                <Typography variant='body1' sx={contentHeaderStyle}>
                  {(new Date(j.createdAt)).toLocaleString()}
                </Typography>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ width: '56em' }}>
                  {details.map(formattedDetails)}
                  {!!additionalDetails.length && (
                    <div style={{ display: 'flex' }}>
                      <div>
                        <IconButton onClick={() => updateRowState(i, !rowStates[i])}>
                          <ExpandMore style={{ transform: !rowStates[i] ? 'rotate(270deg)' : 'rotate(0deg)' }} />
                        </IconButton>
                      </div>
                      {rowStates[i] && (<div>{additionalDetails.map(formattedDetails)}</div>)}
                    </div>
                  )}
                  {additionalContent}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </Paper>
    </div>
  )
}

type JobRequestPanelArgs = {
  workflow?: WorkflowType
  shinzoUser?: UserProfiles["body"]["shinzoUser"]
  repeatJob: Job | null
}

const JobRequestPanel = ({ workflow, shinzoUser, repeatJob }: JobRequestPanelArgs) => {
  const [jobService, setJobService] = useState<JobService>(GPT4O_MINI)

  useEffect(() => {
    if (repeatJob) setJobService(repeatJob.type)
  }, [repeatJob])

  const {
    sendRequest: pushCompositeJobRequestToQueue,
    loading: pushingCompositeJobRequestToQueue
  } = usePostBackend<CompositeJobRequest, Queue>('compositeJob/run')

  return (
    <div>
      <Select value={jobService} sx={topDropdownStyle} MenuProps={selectMenuProps} onChange={(event) => setJobService(event.target.value as JobService)}>
        {jobServices.map(j => (<MenuItem value={j.value} key={j.value}>{j.label}</MenuItem>))}
      </Select>
      <div style={requestPanelStyle}>
        {(jobService === GPT3_5TURBO) && <GPTRequestPanel model={GPT3_5TURBO} workflowUuid={workflow?.uuid} repeatJob={repeatJob} pushRequestToQueue={pushCompositeJobRequestToQueue} />}
        {(jobService === GPT4O_MINI) && <GPTRequestPanel model={GPT4O_MINI} workflowUuid={workflow?.uuid} repeatJob={repeatJob} pushRequestToQueue={pushCompositeJobRequestToQueue} />}
        {(jobService === SD0_4) && <StableDiffusionRequestPanel workflowUuid={workflow?.uuid} shinzoUser={shinzoUser} repeatJob={repeatJob} pushingRequestToQueue={pushingCompositeJobRequestToQueue} pushRequestToQueue={pushCompositeJobRequestToQueue} />}
        {(jobService === DND_DM) && <DNDRequestPanel workflowUuid={workflow?.uuid} shinzoUser={shinzoUser} pushRequestToQueue={pushCompositeJobRequestToQueue} />}
      </div>
    </div>
  )
}

type JobListArgs = {
  allJobs: Job[]
  setAllJobs: React.Dispatch<React.SetStateAction<Job[]>>
  setRepeatJob: React.Dispatch<React.SetStateAction<Job | null>>
  workflow?: WorkflowType
  discordUser: UserProfiles["body"]["discordUser"]
}

const JobList = ({ allJobs, setAllJobs, setRepeatJob, workflow, discordUser }: JobListArgs) => {
  const [rowStates, setRowStates] = useState<boolean[]>([])

  const { sendRequest, loading, response, error } = usePostBackend<ListJobs, InfiniteScrollResponse<Job>>('workflow/listJobs')

  useMemo(() => {
    if (!workflow?.latestJobUuid) return
    const { queryData } = buildRequestDataConfig(allJobs[0]?.previousJobUuid ?? workflow.latestJobUuid)
    sendRequest(queryData)
  }, [workflow])

  useEffect(() => {
    const responseRows = response?.body?.rows ?? []
    if (responseRows.length) {
      setAllJobs(prevRows => [...responseRows, ...prevRows])
      const newRowStates = new Array(responseRows.length).fill(false)
      setRowStates(prevRowStates => [...newRowStates, ...prevRowStates])
    }
  }, [response])

  const updateRowState = useCallback((i: number, newState: boolean) => {
    setRowStates(prevRowStates => {
      const newRowState = [...prevRowStates]
      newRowState[i] = newState
      return newRowState
    })
  }, [setRowStates])

  const loadMoreJobs = useCallback(() => {
    if (!loading && workflow?.latestJobUuid && (!response || response.body.hasMore)) {
      const { queryData } = buildRequestDataConfig(allJobs[0]?.previousJobUuid ?? workflow.latestJobUuid)
      sendRequest(queryData)
    }
  }, [loading, response, workflow, allJobs])

  return (
    <InfiniteScrollWindow<Job>
      sx={contentWindowStyle}
      loading={loading}
      loadMore={loadMoreJobs}
      formattedRow={FormattedJob(discordUser, rowStates, updateRowState, setRepeatJob)}
      allRows={allJobs}
      direction={'backwards'}
    />
  )
}

type WorkflowsPageArgs = {
  userProfiles?: UserProfiles["body"]
}

export const WorkflowsPage = ({ userProfiles }: WorkflowsPageArgs) => {
  const {
    sendRequest: fetchWorkflows,
    loading: loadingWorkflows,
    response: workflows
  } = usePostBackend<RequestWithAuth, WorkflowList>('workflow/listWorkflows')

  const [allJobs, setAllJobs] = useState<Job[]>([])

  const [repeatJob, setRepeatJob] = useState<Job | null>(null)

  const workflowSet = useMemo(() => workflows?.body ?? [], [workflows])

  const workflowMap = useMemo(() => workflowSet.reduce((mappedWorkflows: { [uuid: string]: WorkflowType }, workflow) => {
    mappedWorkflows[workflow.uuid] = workflow
    return mappedWorkflows
  }, {}), [workflows])

  const WorkflowMenuList = useMemo(() => {
    const workflowMenuSet = workflowSet.reduce((workflowList: BaseWorkflowList, workflow) => {
      const lastUpdatedTime = new Date(workflow.updatedAt).getTime()
      for (const window of workflowList) {
        if (lastUpdatedTime > window.cutoffTime) {
          window.workflows.push(workflow)
          break
        }
      }
      return workflowList
    }, baseWorkflowList())

    const workflowMenuList = workflowMenuSet.reduce((list: React.ReactElement[], window) => {
      if (!window.workflows.length) return list

      list.push(<ListSubheader style={dropdownHeaderStyle} key={window.label}>{window.label}</ListSubheader>)
      for (const w of window.workflows) {
        list.push(<MenuItem value={w.uuid} key={w.uuid}>{w.preface}</MenuItem>)
      }
      return list
    }, [])

    return workflowMenuList
  }, [workflows])

  const [openWorkflow, setOpenWorkflow] = useState<WorkflowType | undefined>(undefined)

  useMemo(() => fetchWorkflows(authCreds()), [fetchWorkflows])

  useMemo(() => setOpenWorkflow(workflowSet[0]), [workflowSet])

  useMemo(() => setAllJobs([]), [openWorkflow])

  return (
    <div style={pageStyle}>
      <div style={leftPanelStyle}>
        <Select value={openWorkflow?.uuid ?? 'new'} sx={topDropdownStyle} disabled={workflowSet.length === 0} MenuProps={selectMenuProps} onChange={(event) => setOpenWorkflow(workflowMap[event.target.value])}>
          <MenuItem value={"new"}><i>New Workflow</i></MenuItem>
          {WorkflowMenuList}
        </Select>
        <JobRequestPanel workflow={openWorkflow} shinzoUser={userProfiles?.shinzoUser} repeatJob={repeatJob} />
      </div>
      {userProfiles?.discordUser && <JobList allJobs={allJobs} setAllJobs={setAllJobs} setRepeatJob={setRepeatJob} workflow={openWorkflow} discordUser={userProfiles.discordUser} />}
    </div>
  )
}

export default WorkflowsPage
