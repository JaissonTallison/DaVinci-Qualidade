# Imagem de produção de qualquer parte do sistema (web, gateway e serviços), uma por serviço no Railway.
# PACOTE = nome do pacote no monorepo (ex.: @davinci/qualidade); o Railway passa como variável de build.
#   docker build -f infra/docker/servico.Dockerfile --build-arg PACOTE=@davinci/qualidade .
FROM node:24-alpine AS base
RUN npm install -g pnpm@11 turbo@2 && apk add --no-cache libc6-compat
ARG PACOTE
ENV PACOTE=${PACOTE}

# 1. Cópia enxuta do monorepo só com o pacote e as dependências internas dele
FROM base AS poda
WORKDIR /app
COPY . .
RUN test -n "$PACOTE" && turbo prune "$PACOTE" --docker

# 2. Dependências (camada em cache enquanto o lockfile não muda) e build
FROM base AS build
WORKDIR /app
COPY --from=poda /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=poda /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN turbo run build --filter="$PACOTE"

# 3. Execução. As dependências de desenvolvimento ficam: o pre-deploy roda as migrações com o drizzle-kit.
FROM build AS final
ENV NODE_ENV=production
CMD ["sh", "-c", "pnpm --filter \"$PACOTE\" start:prod"]
