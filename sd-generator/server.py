from http.client import HTTPResponse
from sanic import Sanic
from sanic.response import HTTPResponse, json, file_stream
from sanic.request import Request
from stableDiffusion import generateAndSaveImage
from config import config
from http_redir import http_redir

app = Sanic("StableDiffusionAPI")

@app.on_request
async def confirmApiKey(request):
  apiKey = request.headers.get("X-Api-Key")

  serverApiKey = config['API_KEY']

  if apiKey != serverApiKey:
    return HTTPResponse("Forbidden", status=403)

"""
/generate - Generate an image or set of images
"""
@app.post("/generate")
async def stableDiffusionHandler(request: Request):
  print({ "endpoint": "/generate", "input": request.json })

  output = await generateAndSaveImage(request)

  print({ "endpoint": "/generate", "output": output})
  return json(output)

# https://sanic.dev/en/guide/how-to/tls.html#redirect-http-to-https-with-certificate-requests-still-over-http

@app.before_server_start
async def start(app, _):
  if (app.config.HTTP_VERSION is not True):
    app.ctx.redirect = await http_redir.create_server(
      host=app.config.HOST,
      port=int(app.config.HTTP_PORT),
      return_asyncio_server=True
    )
    app.add_task(runner(http_redir, app.ctx.redirect))

@app.before_server_stop
async def stop(app, _):
  if (app.ctx.redirect):
    await app.ctx.redirect.close()

async def runner(app, app_server):
  app.is_running = True
  try:
    app.signalize()
    app.finalize()
    app.state.is_started = True
    await app_server.serve_forever()
  finally:
    app.is_running = False
    app.is_stopping = True

if (app.config.HTTP_VERSION is True):
  app.run(host=app.config.HOST, port=int(app.config.HTTP_PORT))
else:
  app.run(host=app.config.HOST, port=int(app.config.HTTPS_PORT), ssl=app.config.HTTPS_CERT_PATH)
