import React, { useEffect, useState, useCallback } from 'react'
import { Button, Dialog, DialogContent, ListSubheader, MenuItem, Select, Switch, TextField } from "@mui/material"
import { DropzoneArea } from 'material-ui-dropzone'
import { ReactCrop, Crop, centerCrop } from 'react-image-crop'
//@ts-expect-error //TODO pnpm i --save-dev @types/pngjs/browser
import { PNG } from 'pngjs/browser'
import { Buffer } from 'buffer'
import { authCreds, SD0_4 } from '../utils'
import {
  UserProfiles,
  CompositeJobRequest,
  Job
} from '../types'
import {
  buttonStyle,
  spacedButtonDivStyle,
  dropdownStyle,
  selectMenuProps,
  textFieldStyle,
  dropdownHeaderStyle,
  switchButtonStyle,
  dialogStyle,
  thumbnailStyle
} from '../styles'
import { BACKEND_URL } from '../config'

import 'react-image-crop/dist/ReactCrop.css'

const DEFAULT_PROMPT = ''
const DEFAULT_NEGATIVE_PROMPT = ''
const DEFAULT_NUM_SEEDS = '10'
const DEFAULT_STEPS_TXT2IMG = '30'
const DEFAULT_STEPS_IMG2IMG = '50'
const DEFAULT_GUIDANCE = '9'
const DEFAULT_STRENGTH = '0.5'
const DEFAULT_IMG_DIM = 512
const DEFAULT_DIM = `${DEFAULT_IMG_DIM},${DEFAULT_IMG_DIM}`
const DEFAULT_SCALE_DIMS = { width: 0, height: 0, pixelRatio: 1 }
const DEFAULT_CROP: Crop = { unit: 'px', x: 0, y: 0, width: DEFAULT_IMG_DIM, height: DEFAULT_IMG_DIM }
const PIXEL_INCREMENT = 8
const MAX_TOTAL_PIXELS = 400_000

const imageDimConfig = [
  {
    label: "Square",
    dims: [
      ['512', '512'], // 262144
      ['640', '640'] // 409600
    ]
  },
  {
    label: 'Portrait',
    dims: [
      ['640', '512'], // 327680
      ['768', '512'], // 393216
      ['1024', '384'] // 393216
    ]
  },
  {
    label: 'Landscape',
    dims: [
      ['512', '640'], // 327680
      ['512', '768'], // 393216
      ['384', '1024'] // 393216
    ]
  }
]

const clipToIncrement = (dim: number, inc: number, scale: number) => Math.floor(dim / scale / inc) * inc

const dataURLWithoutAlpha = (dataURL: string) => {
  const prefix = "data:image/png;base64,"
  const dataBuffer = Buffer.from(dataURL.slice(22), 'base64')
  const png = PNG.sync.read(dataBuffer)
  const buffer = PNG.sync.write(png, { colorType: 2 })
  const outputURL = prefix + buffer.toString('base64')
  return outputURL
}

const DimMenuItem = (h: string, w: string) => <MenuItem value={h + ',' + w} key={h + ',' + w}>{h + ' x ' + w}</MenuItem>

const imgFromUrl = (url: string) => {
  const img = new Image()
  img.src = url
  return img
}

const ImageDimList = imageDimConfig.reduce((imageDimList: React.ReactElement[], dimConfig) => {
  imageDimList.push(<ListSubheader key={dimConfig.label} style={dropdownHeaderStyle}>{dimConfig.label}</ListSubheader>)
  for (const dim of dimConfig.dims) {
    imageDimList.push(DimMenuItem(dim[0], dim[1]))
  }
  return imageDimList
}, [])

type StableDiffusionRequestPanelArgs = {
  workflowUuid?: string
  shinzoUser?: UserProfiles["body"]["shinzoUser"]
  pushRequestToQueue: (data?: CompositeJobRequest) => Promise<void>
  pushingRequestToQueue: boolean
  repeatJob: Job | null
}

export const StableDiffusionRequestPanel = ({ workflowUuid, shinzoUser, pushingRequestToQueue, pushRequestToQueue, repeatJob }: StableDiffusionRequestPanelArgs) => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT)
  const [numSeeds, setNumSeeds] = useState(DEFAULT_NUM_SEEDS)
  const [steps, setSteps] = useState(DEFAULT_STEPS_TXT2IMG)
  const [guidance, setGuidance] = useState(DEFAULT_GUIDANCE)
  const [allowNsfw, setAllowNsfw] = useState(!!shinzoUser?.defaultNsfwEnabled)
  const [strength, setStrength] = useState(DEFAULT_STRENGTH)
  const [imgDim, setImgDim] = useState(DEFAULT_DIM)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [image, setImage] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [scaleDims, setScaleDims] = useState<{ width: number, height: number, pixelRatio: number }>(DEFAULT_SCALE_DIMS)
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP)
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  useEffect(() => setAllowNsfw(!!shinzoUser?.defaultNsfwEnabled), [shinzoUser])

  useEffect(() => {
    const setFields = async () => {
      if (repeatJob?.batch) {
        const {
          prompt,
          negativePrompt,
          numSeeds,
          steps,
          guidance,
          allowNsfw,
          strength,
          initImagePath,
          height,
          width
        } = repeatJob?.batch
        setPrompt(prompt)
        setNegativePrompt(negativePrompt ?? DEFAULT_NEGATIVE_PROMPT)
        setNumSeeds(numSeeds)
        setSteps(steps)
        setGuidance(guidance)
        setAllowNsfw(allowNsfw)
        setStrength(strength ?? DEFAULT_STRENGTH)
        setImgDim(`${height ?? DEFAULT_IMG_DIM},${width ?? DEFAULT_IMG_DIM}`)
        setImageDialogOpen(false)
        setScaleDims(DEFAULT_SCALE_DIMS)

        if (initImagePath) {
          const imageData = await fetch(BACKEND_URL + initImagePath)
          const imageBlob = await imageData.blob()
          setImageAndUrl(imageBlob)
        } else {
          setImage(null)
          setImageUrl(null)
          setCrop(DEFAULT_CROP)
          setCroppedImage(null)
          setCroppedImageUrl(null)
        }
      }
    }

    setFields().catch((e) => console.error(e))
  }, [repeatJob])

  const setImageAndUrl = useCallback((image: Blob | File | null) => {
    if (!image) {
      setImageUrl(null)
      setImage(null)
      return
    }

    new Promise<string | ArrayBuffer | null>((resolve, reject) => {
      const reader = new FileReader()
      reader.onabort = () => console.log('File reading was aborted')
      reader.onerror = () => console.log('File reading has failed')
      reader.onload = () => { resolve(reader.result) }
      reader.readAsDataURL(image)
    }).then((imageDataUrl) => setImageUrl(typeof imageDataUrl === 'string' ? imageDataUrl : null))

    setImage(image)
  }, [image])

  const resetImageAndCrop = useCallback(() => {
    setImageAndUrl(null)
    setSteps(DEFAULT_STEPS_TXT2IMG)
    setCrop(DEFAULT_CROP)
    setCroppedImage(null)
    setCroppedImageUrl(null)
  }, [])

  const handleCrop = useCallback(() => {
    if (imageUrl) {
      const scaledCropX = crop.x / scaleDims.width
      const scaledCropY = crop.y / scaleDims.height
      const scaledCropWidth = clipToIncrement(crop.width, PIXEL_INCREMENT, scaleDims.width)
      const scaledCropHeight = clipToIncrement(crop.height, PIXEL_INCREMENT, scaleDims.height)

      const canvas = document.createElement('canvas')
      canvas.width = scaledCropWidth
      canvas.height = scaledCropHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = imgFromUrl(imageUrl)

      // Canvas based on https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage

      ctx.drawImage(
        img,
        scaledCropX,
        scaledCropY,
        scaledCropWidth,
        scaledCropHeight,
        0,
        0,
        scaledCropWidth,
        scaledCropHeight
      )

      setCroppedImageUrl(dataURLWithoutAlpha(canvas.toDataURL('image/png')))
    }

    setImageDialogOpen(false)
  }, [imageUrl, crop])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget

    const scaledWidth = img.width / img.naturalWidth
    const scaledHeight = img.height / img.naturalHeight

    setScaleDims({ width: scaledWidth, height: scaledHeight, pixelRatio: window.devicePixelRatio })

    const loadCrop = centerCrop(
      { unit: 'px', width: Math.min(img.width, crop.width * scaledWidth), height: Math.min(img.height, crop.height * scaledHeight) },
      img.width,
      img.height,
    )

    setCrop(loadCrop)
  }

  return (
    <div>
      <TextField placeholder={"Prompt"} multiline maxRows={10} value={prompt} sx={textFieldStyle} onInput={(event) => setPrompt((event.target as HTMLInputElement).value)} />
      <TextField placeholder={"Negative Prompt"} multiline maxRows={10} value={negativePrompt} sx={textFieldStyle} onInput={(event) => setNegativePrompt((event.target as HTMLInputElement).value)} />
      <div style={spacedButtonDivStyle}>
      <Button sx={buttonStyle} onClick={() => setImageDialogOpen(true)}>Image Editor</Button>
      </div>
      <Dialog open={imageDialogOpen}>
        <div style={dialogStyle}>
          <DialogContent>
            {!imageUrl
              ? (
                <DropzoneArea
                  onDrop={(files: File[]) => {
                    if (!files.length) return
                    setImageAndUrl(files[0])
                    setSteps(DEFAULT_STEPS_IMG2IMG)
                    setImgDim(DEFAULT_DIM)
                  }}
                  acceptedFiles={['image/png']}
                  showPreviews={true}
                  clearOnUnmount={true}
                />
              ) : (
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => {
                    const maxPixels = MAX_TOTAL_PIXELS * scaleDims.width * scaleDims.height
                    newCrop.height = Math.min(newCrop.height, maxPixels / newCrop.width)
                    setCrop(newCrop)
                  }}
                  keepSelection={true}
                >
                  {imageUrl && <img src={imageUrl} onLoad={onImageLoad} />}
                </ReactCrop>
              )}
            <Button sx={buttonStyle} onClick={handleCrop}>Close</Button>
            <Button disabled={!image} sx={buttonStyle} onClick={resetImageAndCrop}>Delete Image</Button>
          </DialogContent>
        </div>
      </Dialog>
      {imageUrl && !croppedImageUrl && <img style={thumbnailStyle} src={imageUrl} />}
      {croppedImageUrl && <img style={thumbnailStyle} src={croppedImageUrl} />}
      <TextField disabled={!image} placeholder={"Strength"} sx={textFieldStyle} value={strength} onInput={(event) => setStrength((event.target as HTMLInputElement).value)} />
      <TextField placeholder={"Number of Images"} sx={textFieldStyle} value={numSeeds} onInput={(event) => {
        setNumSeeds((event.target as HTMLInputElement).value)
      }} />
      <TextField placeholder={"Steps"} sx={textFieldStyle} value={steps} onInput={(event) => setSteps((event.target as HTMLInputElement).value)} />
      <TextField placeholder={"Guidance"} sx={textFieldStyle} value={guidance} onInput={(event) => setGuidance((event.target as HTMLInputElement).value)} />
      <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 0 0' }}>
        {"Dimensions"}
        <div style={{ width: '100%', justifyContent: 'right', display: 'flex' }}>
          <Select value={imgDim} sx={{
            ...dropdownStyle,
            width: '12em'
          }} disabled={!!image} MenuProps={selectMenuProps} onChange={(event) => setImgDim((event.target as HTMLInputElement).value)}>
            {ImageDimList}
          </Select>
        </div>
      </div>
      {shinzoUser?.authorizations.canSubmitNSFWSD &&
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 0 0', color: !shinzoUser?.authorizations.canSubmitNSFWSD ? 'gray' : 'white' }}>
          {"Allow NSFW"}
          <Switch sx={switchButtonStyle} disabled={!shinzoUser?.authorizations.canSubmitNSFWSD} checked={allowNsfw} onChange={() => setAllowNsfw(allowNsfw => !allowNsfw)} />
        </div>
      }
      <div style={spacedButtonDivStyle}>
        <Button sx={buttonStyle} onClick={() => pushRequestToQueue({
          ...authCreds(),
          workflowUuid,
          jobs: [
            {
              type: SD0_4,
              params: {
                prompt,
                negativePrompt,
                ...(
                  (croppedImage ?? image)
                    ? {
                      initImage: croppedImageUrl ?? imageUrl,
                      strength: parseFloat(strength)
                    }
                    : {
                      height: parseInt(imgDim.split(',')[0]),
                      width: parseInt(imgDim.split(',')[1])
                    }
                ),
                steps: parseInt(steps),
                guidance: parseFloat(guidance),
                allowNsfw,
                numSeeds: parseInt(numSeeds),
              }
            },
          ]
        })}>Generate</Button>
      </div>
      <div>
        {/* TODO update Generator request job messages */}
        {pushingRequestToQueue ? "Pushing job..." : ""}
      </div>
    </div>
  )
}
