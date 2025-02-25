# sd-generator
Python API service to support Stable Diffusion requests.

## Prerequisites
- [Python 3](https://www.python.org/downloads/)
- [Python virtualenvwrapper](https://virtualenvwrapper.readthedocs.io/en/latest/index.html)
- [git lfs](https://git-lfs.github.com/)
- Prep docker volumes in parent of `shinzo/`:
  - Create `users/` in `shinzo/`:
    - `mkdir users`
  - Create `/stable-diffusion-v1-4` weights in parent of `shinzo/`:
    - `cd ..`
    - `git clone https://huggingface.co/CompVis/stable-diffusion-v1-4`
- Prep diffusers module:
  - `git clone https://github.com/shinzo-labs/diffusers.git` in parent of root

## Local Development
### Start API (Note: does not work with current file paths. Only use dockerized deployment for now)
1. `mkvirtualenv stable-diffusion`
2. `workon stable-diffusion`
3. `pip3 install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu116` (for RTX 3060 Ti)
4. `python3 -m sanic server.app`
5. `deactivate`

## Example Usage
Test request (processes ~1 step/s with GTX 1060 6GB, ~6steps/s with RTX 3060 Ti):
```bash
curl -X POST http://localhost:8000/ -H 'Content-Type: application/json' -d '{"prompt": "robot killer monster"}'
```
