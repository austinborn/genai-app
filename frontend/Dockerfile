FROM node:lts

WORKDIR /app

RUN curl -f https://get.pnpm.io/v6.32.js | node - add --global pnpm

COPY --chown=node:node ["./package.json", "./pnpm-lock.yaml", "./"]

RUN pnpm fetch
RUN pnpm install -r --offline

COPY --chown=node:node ["./", "./"]

RUN pnpm run build

# USER node

ENTRYPOINT ["pnpm", "run", "start"]
