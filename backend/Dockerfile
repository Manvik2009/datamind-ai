FROM node:20-alpine AS base

WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health/live || exit 1

CMD ["node", "dist/index.js"]
