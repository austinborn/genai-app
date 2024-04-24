import { useMemo, useState } from 'react'
import { Button, Card, MenuItem, Select, Switch, Typography } from '@mui/material'
import {
  buttonStyle,
  cardStyle,
  dropdownStyle,
  paperWrapperStyle,
  singlePageStyle,
  tightTextStyle,
  detailsHeaderStyle,
  switchButtonStyle,
  selectMenuProps
} from '../styles'
import {
  DeleteWorkflowResponse,
  DeleteWorkflowRequest,
  RequestWithAuth,
  UserProfiles,
  UserDetails,
  WorkflowList,
  WorkflowType
} from '../types'
import {
  authCreds
} from '../utils'
import { usePostBackend } from '../hooks/queryBackend'

import { generate as generateShortId } from 'shortid'

const formattedUserDetails = (userDetails: UserDetails) => (
  <div key={generateShortId()} style={{ margin: '6px 0 0 0' }}>
    <Typography variant='body2' sx={tightTextStyle} component={'span'}>
      <span>
        <strong style={detailsHeaderStyle}>{userDetails.header}</strong>
        {userDetails.body}
      </span>
    </Typography>
  </div>
)

type AccountSettingsPageArgs = {
  shinzoUser?: UserProfiles["body"]["shinzoUser"]
}

export const AccountSettingsPage = ({
  shinzoUser
}: AccountSettingsPageArgs) => {
  const {
    sendRequest: fetchWorkflows,
    loading: loadingWorkflows,
    response: workflows
  } = usePostBackend<RequestWithAuth, WorkflowList>('workflow/listWorkflows')

  const {
    sendRequest: deleteWorkflow,
    loading: loadingDelete,
    response: deletedWorkflow
  } = usePostBackend<DeleteWorkflowRequest, DeleteWorkflowResponse>('workflow/deleteWorkflow')

  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowType["uuid"] | null>(null)

  useMemo(() => fetchWorkflows(authCreds()), [fetchWorkflows])

  const userDetailsList = useMemo(() => {
    const detailsList: { header: string, body?: string | JSX.Element}[] = [
      { header: "E-Mail", body: shinzoUser?.email },
      { header: "Subscription", body: shinzoUser?.subscriptionName },
    ]
    if (shinzoUser?.authorizations.canSubmitNSFWSD) {
      detailsList.push({ header: "Default Allow NSFW", body: <Switch sx={switchButtonStyle} disabled={!shinzoUser?.authorizations.canSubmitNSFWSD} checked={shinzoUser?.defaultNsfwEnabled} /> })
    }
    return detailsList
}, [shinzoUser])

  return (
    <div style={singlePageStyle}>
      <div style={paperWrapperStyle}>
        {shinzoUser
          ? <Card sx={cardStyle}>
            {userDetailsList.map(formattedUserDetails)}
          </Card>
          : (
            <div></div>
          )
        }
      </div>
      <div style={paperWrapperStyle}>
        <Card sx={cardStyle}>
          <Typography variant='h6' sx={tightTextStyle}>Delete Workflow</Typography>
          <Select value={workflowToDelete} sx={dropdownStyle} MenuProps={selectMenuProps} onChange={(event) => setWorkflowToDelete(event.target.value as WorkflowType["uuid"])}>
            {workflows?.body?.length ? workflows.body.map(w => (<MenuItem value={w.uuid} key={w.uuid}>{w.preface}</MenuItem>)) : null}
          </Select>
          <Button sx={buttonStyle} disabled={!workflowToDelete} onClick={async () => {
            await deleteWorkflow({ ...authCreds(), workflowUuid: workflowToDelete ?? "" })
            await fetchWorkflows(authCreds())
          }}>
            Delete Workflow
            </Button>
        </Card>
      </div>
    </div>
  )
}

export default AccountSettingsPage
