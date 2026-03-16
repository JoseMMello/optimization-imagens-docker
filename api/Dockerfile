# ---- Stage 1: Builder ----
# Instala todas as deps (dev + prod) e compila o TypeScript
# O esbuild faz o bundle de tudo num único arquivo — express incluso
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies: esbuild, typescript, @types/*)
RUN npm install

COPY src ./src

# Compila e empacota tudo num único arquivo dist/index.js
# O express fica embutido no bundle — sem necessidade de node_modules em produção
RUN npm run build

# ---- Stage 2: Production ----
# Imagem final minimalista: só o Node runtime + o arquivo bundlado
# Sem node_modules. Sem devDependencies. Sem typescript. Sem esbuild.
FROM node:20-alpine

WORKDIR /app

# Copia apenas o bundle gerado pelo esbuild
COPY --from=builder /app/dist/index.js ./index.js

EXPOSE 3000

CMD ["node", "index.js"]
