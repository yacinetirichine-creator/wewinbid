# Production Docker image for WeWinBid (Next.js)
# Uses a multi-stage build to keep the runtime image smaller.

FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install dependencies (uses package-lock.json)
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what we need to run
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Bind to all interfaces for container runtime
CMD ["npm","run","start","--","-p","3000","-H","0.0.0.0"]
