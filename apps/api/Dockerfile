FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm ci -w @doomsday/shared -w @doomsday/api --include-workspace-root

RUN npm run build -w @doomsday/shared && npm run build -w @doomsday/api

ENV NODE_ENV=production PORT=3001
EXPOSE 3001
# apply migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]
