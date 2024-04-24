import torch
from config import config
from random import randint
from typing import List, Literal, Optional, Union
from sanic.request import Request
from diffusers import DiffusionPipeline, StableDiffusionPipeline, StableDiffusionImg2ImgPipeline, StableDiffusionInpaintPipeline
from utils import getFilePath
from os.path import exists
import PIL
from enum import Enum
import time

torch_generator = None
base_pipe = None
text2img = None
img2img = None
inpaint = None

if (config['MOCK_SD'] != 'true'):
  torch_generator = torch.Generator('cuda')

  base_pipe =  DiffusionPipeline.from_pretrained("./stable-diffusion-v1-4", revision="fp16", torch_dtype=torch.float16).to("cuda")

  sub_models = {k: v for k,v in vars(base_pipe).items() if not k.startswith("_")}

  text2img = StableDiffusionPipeline(**sub_models)
  img2img = StableDiffusionImg2ImgPipeline(**sub_models)
  inpaint = StableDiffusionInpaintPipeline(**sub_models)

class PipeType(Enum):
  TXT2IMG = 1
  IMG2IMG = 2
  INPAINT = 3

def getPipeline(type: Literal[PipeType.TXT2IMG, PipeType.IMG2IMG, PipeType.INPAINT]):
  if (type == PipeType.TXT2IMG):
    return text2img
  elif (type == PipeType.IMG2IMG):
    return img2img
  elif (type == PipeType.INPAINT):
    return inpaint
  else:
    return None

async def generateAndSaveImage(request: Request) -> Optional[Union[str, List[str]]]:
  prompt = request.json.get('prompt')
  if not prompt:
    return None

  user_uuid = request.json.get('user_uuid')
  if not isinstance(user_uuid, str):
    return None

  seed = request.json.get('seed') if isinstance(request.json.get('seed'), str) else None
  height = request.json.get('height') if isinstance(request.json.get('height'), int) else None
  width = request.json.get('width') if isinstance(request.json.get('width'), int) else None
  num_inference_steps = request.json.get('num_inference_steps') if isinstance(request.json.get('num_inference_steps'), int) else 30
  guidance_scale = float(request.json.get('guidance_scale')) if (isinstance(request.json.get('guidance_scale'), int) or isinstance(request.json.get('guidance_scale'), float)) else 9
  eta = float(request.json.get('eta')) if (isinstance(request.json.get('eta'), int) or isinstance(request.json.get('eta'), float)) else 0.0
  allow_nsfw = request.json.get('allow_nsfw') if isinstance(request.json.get('allow_nsfw'), bool) else False
  init_image_path = request.json.get('init_image_path') if isinstance(request.json.get('init_image_path'), str) else None
  strength = request.json.get('strength') if isinstance(request.json.get('strength'), int) or isinstance(request.json.get('strength'), float) else None
  output_type = request.json.get('output_type') if isinstance(request.json.get('output_type'), str) else 'pil'
  return_dict = request.json.get('return_dict') if isinstance(request.json.get('return_dict'), bool) else True
  negative_prompt = request.json.get('negative_prompt') if isinstance(request.json.get('negative_prompt'), str) else None

  print({ "generatorInputs": {
    "prompt": prompt,
    "seed": seed,
    "height": height,
    "width": width,
    "num_inference_steps": num_inference_steps,
    "guidance_scale": guidance_scale,
    "eta": eta,
    "allow_nsfw": allow_nsfw,
    "init_image_path": init_image_path,
    "strength": strength,
    "output_type": output_type,
    "return_dict": return_dict,
    "negative_prompt": negative_prompt
  } })

  if (config['MOCK_SD'] == 'true'):
    width = 512
    height = 512

    if (init_image_path):
      if (not exists(init_image_path)):
        print({ "error": "No image found at init_image_path=${init_image_path}" })
        return None

      init_image = PIL.Image.open(init_image_path)
      width = init_image.width
      height = init_image.height

    time.sleep(float(config['MOCK_GEN_S']))

    image = PIL.Image.new('RGB', (width, height), (randint(0,255),randint(0,255),randint(0,255)))

    filePath = getFilePath(user_uuid)
    image.save(filePath)

    return { "file_path": filePath, "has_nsfw": False }

  generator = torch_generator.manual_seed(int(seed) if seed is not None else torch_generator.initial_seed())

  result = None
  if (init_image_path):
    if (not exists(init_image_path)):
      print({ "error": "No image found at init_image_path=${init_image_path}" })
      return None

    pipe = getPipeline(PipeType.IMG2IMG)

    init_image = PIL.Image.open(init_image_path)

    strength = strength or 0

    result = pipe(
      prompt,
      init_image,
      strength=strength,
      num_inference_steps=num_inference_steps,
      guidance_scale=guidance_scale,
      eta=eta,
      generator=generator,
      output_type=output_type,
      return_dict=return_dict,
      allow_nsfw=allow_nsfw,
      negative_prompt=negative_prompt
    )

  else:
    pipe = getPipeline(PipeType.TXT2IMG)

    height = height or 512
    width = width or 512

    result = pipe(
      prompt,
      height=height,
      width=width,
      num_inference_steps=num_inference_steps,
      guidance_scale=guidance_scale,
      eta=eta,
      generator=generator,
      output_type=output_type,
      return_dict=return_dict,
      allow_nsfw=allow_nsfw,
      negative_prompt=negative_prompt
    )

  image = result.images[0]
  has_nsfw = result.nsfw_content_detected[0]

  filePath = getFilePath(user_uuid)
  image.save(filePath)

  return { "file_path": filePath, "has_nsfw": has_nsfw }

# print(torch.cuda.memory_summary()) # TODO manage memory limits from cards
