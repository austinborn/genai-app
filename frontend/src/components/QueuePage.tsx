import { useEffect, useMemo, useState } from 'react'
import { usePostBackend } from '../hooks/queryBackend'
import { Button, Card, Typography } from '@mui/material'
import { authCreds, MS_PER_S, GPT3_5TURBO, GPT4O_MINI, SD0_4, secondsToReadableString, typeName } from '../utils'
import {
  buttonStyle,
  cardStyle,
  centerBodyStyle,
  leftBodyStyle,
  paperWrapperStyle,
  rightHeaderStyle,
  singlePageStyle
} from '../styles'

import {
  CancelQueueItemAxiosData,
  SDItemData,
  GPTItemData,
  Queue,
  QueueItemType,
  RequestWithAuth
} from '../types'

import { Decimal } from 'decimal.js'

type SDItemArgs = {
  data: SDItemData
  idx: number
}

const SDItem = (args: SDItemArgs) => {
  const data = useMemo(() => args.data, [args])

  const estimatedTimeRemaining = useMemo(() => {
    const { numSeeds, imagesGenerated, latestImageStartTime, totalGenerationTime } = data
    if (!imagesGenerated) return "pending"

    const avgGenTimeMs = new Decimal(totalGenerationTime).div(imagesGenerated)
    const imagesRemaining = new Decimal(numSeeds).sub(imagesGenerated)
    let timeRemaining = avgGenTimeMs.mul(imagesRemaining)
    if (args.idx === 0) timeRemaining = timeRemaining.add(latestImageStartTime).sub(Date.now())

    const timeRemainingSec = timeRemaining.div(MS_PER_S).toNumber()
    return secondsToReadableString(timeRemainingSec)
  }, [data])

  return (
    <table>
      <tbody>
        <tr>
          <th></th>
          <th></th>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Prompt</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.prompt}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Negative Prompt</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.negativePrompt ?? "N/A"}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Initial Image UUID</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.initImageUuid ?? "N/A"}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Strengths</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.strength ?? "N/A"}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Number of Seeds</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.numSeeds}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Steps</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.steps}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Guidance</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.guidance}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Height</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.height}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Width</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.width}</Typography></td>
        </tr>
        {data.allowNsfwSetting &&
          <tr>
            <td><Typography variant='h6' sx={rightHeaderStyle}>Allow NSFW</Typography></td>
            <td><Typography variant='body1' sx={leftBodyStyle}>{data.allowNsfwSetting ? "True" : "False"}</Typography></td>
          </tr>
        }
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Eta</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.eta}</Typography></td>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Progress</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{`${data.imagesGenerated}/${data.numSeeds} (Est. time remaining: ${estimatedTimeRemaining})`}</Typography></td>
        </tr>
      </tbody>
    </table>
  )
}

type GPTItemArgs = {
  data: GPTItemData
  idx: number
}

const GPTItem = (args: GPTItemArgs) => {
  const data = useMemo(() => args.data, [args])

  return (
    <table>
      <tbody>
        <tr>
          <th></th>
          <th></th>
        </tr>
        <tr>
          <td><Typography variant='h6' sx={rightHeaderStyle}>Prompt</Typography></td>
          <td><Typography variant='body1' sx={leftBodyStyle}>{data.prompt}</Typography></td>
        </tr>
      </tbody>
    </table>
  )
}

type QueueItemArgs = {
  item: QueueItemType,
  idx: number,
  cancelQueueItem: (data: CancelQueueItemAxiosData) => Promise<void>
}

const QueueItem = ({
  item,
  idx,
  cancelQueueItem
}: QueueItemArgs) => {
  return (
    <div style={paperWrapperStyle}>
      <Card sx={cardStyle}>
        <Typography variant='h5' sx={centerBodyStyle}>Priority: {idx + 1}</Typography>
        <Typography variant='h6' sx={rightHeaderStyle}>Type: {typeName[item.data.type]}</Typography>
        {(item.data.type === SD0_4) &&
          //@ts-expect-error
          <SDItem data={item.data} idx={idx} />
        }
        {([GPT3_5TURBO, GPT4O_MINI].includes(item.data.type)) &&
          //@ts-expect-error
          <GPTItem data={item.data} idx={idx} />}
        {/* <TimedProgressBar totalSeconds={totalSecs} barSteps={totalSecs} /> */}
        <Button sx={buttonStyle} onClick={() => cancelQueueItem({ ...authCreds(), uuid: item.id })}>Cancel</Button>
      </Card>
    </div>
  )
}

export const QueuePage = () => {
  const [queue, setQueue] = useState<Queue | null>(null)

  const {
    sendRequest: fetchBatchQueue,
    loading: fetchingBatchQueue,
    response: batchQueue,
    error: fetchBatchQueueError
  } = usePostBackend<RequestWithAuth, Queue>('queue/fetchJobQueue')

  const {
    sendRequest: cancelQueueItem,
    loading: cancellingQueueItem,
    response: postCancelQueue,
    error: cancelQueueItemError
  } = usePostBackend<CancelQueueItemAxiosData, Queue>('queue/cancelJob')

  useMemo(() => fetchBatchQueue(authCreds()), [fetchBatchQueue])

  useEffect(() => { if (!(fetchingBatchQueue || fetchBatchQueueError)) setQueue(batchQueue) }, [fetchingBatchQueue])
  useEffect(() => { if (!(cancellingQueueItem || cancelQueueItemError)) fetchBatchQueue(authCreds()) }, [cancellingQueueItem])

  return (
    <div style={singlePageStyle}>
      <div>
        <Typography variant='h6' sx={centerBodyStyle}>Requests processing: {queue?.body?.processing.length ?? 0}</Typography>
      </div>
      {queue?.body?.processing.map((item: QueueItemType, idx: number) => (
        <QueueItem
          key={item.id}
          item={item}
          idx={idx}
          cancelQueueItem={cancelQueueItem}
        />)
      )}
      <div>
        <Typography variant='h6' sx={centerBodyStyle}>Requests blocked: {queue?.body?.blocked.length ?? 0}</Typography>
      </div>
      {queue?.body?.blocked.map((item: QueueItemType, idx: number) => (
        <QueueItem
          key={item.id}
          item={item}
          idx={idx}
          cancelQueueItem={cancelQueueItem}
        />)
      )}
    </div>
  )
}

export default QueuePage
