# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base

# ----- deps: instala dependências (com cache do npm) -----
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ----- builder: gera Prisma client e build do Next -----
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ----- runner: imagem final mínima -----
FROM base AS runner
RUN apk add --no-cache openssl tini wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copia o output standalone do Next + arquivos públicos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Garante que o Prisma client, CLI e engines estejam disponíveis em runtime
# (client pra app rodar; CLI + engines pra `prisma migrate deploy` rodar nesta imagem)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# bcryptjs e usado pelo seed standalone (Next standalone bundla inline pra app
# mas o pacote nao fica disponivel pra `node prisma/seed.js`)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Recria o symlink .bin/prisma -> ../prisma/build/index.js (COPY de arquivo unico
# deferencia symlink; sem isso, __dirname resolve pra .bin/ e o CLI nao acha
# prisma_schema_build_bg.wasm que vive em prisma/build/)
RUN mkdir -p /app/node_modules/.bin \
 && ln -sf ../prisma/build/index.js /app/node_modules/.bin/prisma \
 && chown -h nextjs:nodejs /app/node_modules/.bin/prisma

# Estrutura de uploads (bind mount cobre isso em runtime, mas garante existência)
RUN mkdir -p /app/public/uploads/videos /app/public/uploads/images \
 && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
