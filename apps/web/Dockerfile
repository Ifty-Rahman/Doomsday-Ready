FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm ci -w @doomsday/shared -w @doomsday/web --include-workspace-root
RUN npm run build -w @doomsday/shared && npm run build -w @doomsday/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
