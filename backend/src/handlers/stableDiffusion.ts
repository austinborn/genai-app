import { logger } from '../logger'
import { STABLE_DIFFUSION_API_KEY, STABLE_DIFFUSION_API_URL } from '../config'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { existsSyncRelative, getRandomSeed, writeBase64FileRelative } from '../utils'
import { Batch, File, GeneratedImage, User } from '../models'
import { GenerateImageParams, RequestProcessor, SDItemData, RequestHandler, UserWithAuth } from '../types'
import { SD0_4 } from '../const'
import { dbClient } from '../dbClient'
import { pushRequest } from './jobQueue'
import { createWorkflowJob } from '../dbUtils'
import { generateImagesSchema } from '../schema'
import { rateLimitedRequest } from '../authorizations/modelAuth'

const DEFAULT_NUM_SEEDS = 10
const DEFAULT_GUIDANCE = 9
const DEFAULT_STEPS = 30
const DEFAULT_STRENGTH = 0.5
const DEFAULT_HEIGHT = 512
const DEFAULT_WIDTH = 512
const DEFAULT_ETA = 0.0

let sdRequestInProgress: string | null = null

export const getImages = async (batchUuid: string) => {
  const [imageList] = await dbClient.query(`\
    select f.uuid, f.path, gi.has_nsfw, gi.tags, f.created_at, gi.seed \
    from sd.generated_image gi \
    join main.file f on f.uuid = gi.generated_image_uuid \
    where gi.batch_uuid = '${batchUuid}' \
    order by f.created_at desc \
  `) as any[]
  return imageList
}

const downloadImage = async (user: UserWithAuth, base64Data: string) => {
  const path = `users/${user.uuid}/images/${randomUUID()}.png`

  base64Data = base64Data.replace(/^data:image\/png;base64,/, '')

  writeBase64FileRelative(path, base64Data)

  const image = await File.create({ type: 'image', path })

  return image.uuid
}

const generateSingleImage = async (userUuid: User["uuid"], batchUuid: Batch["uuid"], params: GenerateImageParams) => {
  const { prompt, negativePrompt, seed, height, width, steps, guidance, eta, allowNsfwSetting, strength, initImageUuid, batchIndex } = params

  let initImage
  if (initImageUuid) {
    initImage = await File.findOne({ where: { uuid: initImageUuid } })

    if (!(initImage && existsSyncRelative(initImage.path))) throw Error(`No initial image found at ${initImage?.path}`)
  }

  const generatedImage = await GeneratedImage.create({ seed, batch_uuid: batchUuid, batch_index: batchIndex })

  const sdRequestData = {
    prompt,
    negative_prompt: negativePrompt,
    seed,
    height,
    width,
    num_inference_steps: steps,
    guidance_scale: guidance,
    eta,
    allow_nsfw: allowNsfwSetting,
    init_image_path: initImage?.path,
    strength,
    user_uuid: userUuid
  }

  logger.debug({ sdRequestData })

  const sdResponse = await axios.post<{ file_path: string, has_nsfw: boolean }>(
    STABLE_DIFFUSION_API_URL + 'generate',
    sdRequestData,
    { headers: { 'X-Api-Key': STABLE_DIFFUSION_API_KEY } }
  )

  logger.debug({ sdResponseData: sdResponse.data })

  if (!sdResponse.data) throw Error(`No image response from Stable Diffusion Generator`)

  const { file_path, has_nsfw } = sdResponse.data

  if (!existsSyncRelative(file_path)) throw Error(`no generated image found at ${file_path}`)

  const image = await File.create({ type: 'image', path: file_path })

  await GeneratedImage.update({ generated_image_uuid: image.uuid, has_nsfw }, { where: { uuid: generatedImage.uuid } })

  return file_path
}

export const generateImages: RequestHandler<typeof generateImagesSchema, SDItemData> = async (user, request) => {
  if (!user.authorizations.canUseSD) return { response: "User does not have permission to access this resource", error: true }

  const { workflowUuid, job } = request

  const {
    prompt,
    negativePrompt,
    height,
    width,
    steps,
    guidance,
    allowNsfw,
    numSeeds,
    initImage,
    strength
  } = job.params

  if (allowNsfw && !user.authorizations.canSubmitNSFWSD) {
    return { response: "User cannot submit Stable Diffusion requests with NSFW setting", error: true }
  }

  const workflowJob = await createWorkflowJob(user.uuid, workflowUuid)
  if (!workflowJob) return { response: 'Unexpected error when creating job', error: true }

  const initImageUuid = initImage ? await downloadImage(user, initImage) : undefined

  const eta = DEFAULT_ETA

  const allowNsfwSetting = typeof allowNsfw === 'boolean' ? allowNsfw : user.defaultNsfwEnabled

  const batch = await Batch.create({
    prompt,
    negative_prompt: negativePrompt,
    height,
    width,
    steps,
    guidance,
    eta,
    num_seeds: numSeeds,
    init_image_uuid: initImageUuid,
    strength,
    job_uuid: workflowJob?.jobUuid,
    allow_nsfw: allowNsfwSetting
  })

  const itemData: SDItemData = {
    workflowJob,
    prompt,
    negativePrompt,
    steps: steps ?? DEFAULT_STEPS,
    guidance: guidance ?? DEFAULT_GUIDANCE,
    eta,
    allowNsfwSetting,
    numSeeds: numSeeds ?? DEFAULT_NUM_SEEDS,
    userUuid: user.uuid,
    imagesGenerated: 0,
    latestImageStartTime: 0,
    totalGenerationTime: 0,
    type: SD0_4,
    initImageUuid,
    batchUuid: batch.uuid,
    ...(
      initImage
        ? { strength: strength ?? DEFAULT_STRENGTH }
        : { height: height ?? DEFAULT_HEIGHT, width: width ?? DEFAULT_WIDTH }
    ),
    moreToProcess: true
  }

  const processor: RequestProcessor<SDItemData> = async (itemData: SDItemData) => {
    try {
      const {
        prompt,
        negativePrompt,
        height,
        width,
        steps,
        guidance,
        eta,
        allowNsfwSetting,
        numSeeds,
        strength,
        userUuid
      } = itemData

      itemData.latestImageStartTime = Date.now()

      const imagePath: string = await generateSingleImage(userUuid, itemData.batchUuid, {
        prompt,
        negativePrompt,
        seed: getRandomSeed(),
        height,
        width,
        steps,
        guidance,
        eta,
        allowNsfwSetting,
        initImageUuid: itemData.initImageUuid,
        strength,
        batchIndex: itemData.imagesGenerated
      })

      if (imagePath.length) {
        itemData.imagesGenerated += 1

        if (itemData.imagesGenerated >= numSeeds) {
          sdRequestInProgress = null
          return { ...itemData, moreToProcess: false }
        }
      }

      itemData.totalGenerationTime += Date.now() - itemData.latestImageStartTime

      return itemData
    } catch (error) {
      sdRequestInProgress = null
      return { ...itemData, moreToProcess: false }
    }
  }

  pushRequest<SDItemData>(
    user,
    workflowJob.jobUuid,
    {
      data: itemData,
      isBlocked: async (id, _) => {
        if (sdRequestInProgress) return { blocked: true }

        const msUntilNextAllow = rateLimitedRequest(SD0_4)

        const blocked = msUntilNextAllow > 0
        if (!blocked) sdRequestInProgress = id
        return { blocked }
      },
      processor,
      cancelCleanup: (id, _) => {
        if (sdRequestInProgress === id) sdRequestInProgress = null
      },
      jobDependencies: []
    }
  )

  return { response: itemData }
}
