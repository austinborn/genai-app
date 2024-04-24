# Shinzo GenAI Content Management App
The Shinzo GenAI Content Management App is an integrated web application to query genAI models like GPT and Stable Diffusion and manage the multi-modal generated content. This application can be deployed locally in a single command with proper configuration and setup. The code is provided as-is with no guarantees about functionality or future support.

<img height="400" alt="Zombie Halloween Party" src="https://github.com/shinzo-labs/shinzo/assets/15525028/8a192a92-10b4-41a4-8034-b570a8345d4b">
<img height="400" alt="Voxel Mansion" src="https://github.com/shinzo-labs/shinzo/assets/15525028/9a67664c-7aee-4f34-8bf0-fe47deaccb27">
<img width="984" alt="Business Questions" src="https://github.com/shinzo-labs/shinzo/assets/15525028/2fc8c11d-4a7e-4443-b6a8-b4eab5a3d816">


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
