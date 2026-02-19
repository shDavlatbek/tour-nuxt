# ---------- Stage 1: base ----------
FROM node:22-alpine AS base
WORKDIR /app

# ---------- Stage 2: install dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 3: build ----------
FROM deps AS build
COPY . .
RUN npm run build

# ---------- Stage 4: production runtime ----------
FROM base AS runtime

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Copy only the built output (Nitro server bundle includes everything needed)
COPY --from=build /app/.output /app/.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
