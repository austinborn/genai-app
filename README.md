# GenAI Content Management App
The GenAI Content Management App is an integrated web application to query genAI models like GPT and Stable Diffusion and manage the multi-modal generated content. This application can be deployed locally in a single command with proper configuration and setup. The code is provided as-is with no guarantees about functionality or future support.

<img height="400" alt="Zombie Halloween Party" src="https://github.com/austinborn/genai-app/assets/15525028/2f43d670-5c71-4793-a285-b7e2c142f4a3">
<img height="400" alt="Voxel Mansion" src="https://github.com/austinborn/genai-app/assets/15525028/27163eac-5467-42da-b622-d403ee525e9f">
<img width="984" alt="Business Questions" src="https://github.com/austinborn/genai-app/assets/15525028/e5961c97-a108-4ae0-a22c-cdc9f5469c78">


## Prerequisites
### Docker Deployment
- [Docker](https://docs.docker.com/get-started/#download-and-install-docker)

### DB Administration
- [Ubuntu PostgreSQL](https://ubuntu.com/server/docs/databases-postgresql)
- [DB Mate](https://github.com/amacneil/dbmate)

### Local Deployment
- [pnpm](https://pnpm.io/installation)
- [dotenv](https://www.npmjs.com/package/dotenv)

## Env Configs
Fill out env files with given variables:
- `.env`
- `backend/.env`
- `frontend/.env`
- `sd-generator/.env`

## Dockerized Deployment
### Add Database
Follow steps in [db/README.md](./db/README.md) to deploy a new `postgres` database instance in the Ubuntu server.

### Add Volumes
Follow steps in [sd-generator/README.md](./sd-generator/README.md) to create volume sources.

### Prep diffusers
A custom fork of `diffusers` is used for the stable diffusion generator, so follow the steps in [sd-generator/README.md](./sd-generator/README.md) to copy this into `sd-generator/`.

### Deploy all services
`docker-compose up --build -d`
`dbmate up`

### Bring down all services
`docker-compose down`

### Deploy specific service
`docker-compose up --build -d <backend|frontend|sd-generator>...`

### Deploy SD generator without GPU
`sudo docker-compose -f compose.no-gpu.yml up -d --build <backend|frontend|sd-generator>...`
### Configure HA Proxy
For final setup to a public domain, please follow the steps in [haproxy/README.md](./haproxy/README.md) and modify the URLs as needed for your domain.

### Troubleshooting
If the docker compose fails to start, try the following:
- If you are using `sudo`, ensure you use `sudo -E` to keep env vars like `PWD`.
- Ensure `pnpm` is up-to-date and all packages are on reasonable versions, or upgraded with:
```bash
pnpm up --latest
```
- If the backend fails to connect to the DB with some error about `ECONNREFUSED`, make sure the DB URL uses 172.17.0.1 instead of localhost. This is a quirk with docker's network configuration.


