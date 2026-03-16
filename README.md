# 🐳 Docker Image Optimization

Demonstração prática de como reduzir drasticamente o tamanho de imagens Docker usando **multi-stage builds** — aplicado a uma API Node.js (TypeScript + esbuild) e um frontend React (Vite + nginx).

---

## 📊 Comparação de Tamanhos

| Imagem | Estratégia | Tamanho |
|--------|-----------|---------|
| `node:20` + node_modules + devDeps | ❌ Ingênua (sem otimização) | ~1.2 GB |
| `node:20-alpine` + apenas prod deps | ⚠️ Single-stage otimizada | ~230 MB |
| `node:20-alpine` + bundle esbuild | ✅ Multi-stage + bundle | ~195 MB |
| `nginx:alpine` + `/dist` estático | ✅ Multi-stage React | ~25 MB |

> A imagem do frontend caiu de ~500MB para ~25MB — **uma redução de 95%**.

---

## 🏗️ Como funciona o Multi-Stage Build

A ideia central é usar **múltiplos estágios** no Dockerfile. Cada estágio parte de uma imagem base diferente, e apenas os artefatos necessários são copiados para o estágio seguinte.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│       Stage: builder         │        │      Stage: production        │
│  node:20-alpine              │        │  nginx:alpine (React)         │
│                              │   →    │  node:20-alpine (API)         │
│  ✔ node_modules              │  copia │                               │
│  ✔ devDependencies           │  só o  │  ✔ /dist  ou  bundle.js       │
│  ✔ TypeScript, esbuild...    │  build │  ✖ node_modules               │
│                              │        │  ✖ devDependencies            │
└─────────────────────────────┘        │  ✖ código-fonte TypeScript    │
                                        └──────────────────────────────┘
```

---

## 🗂️ Estrutura do Projeto

```
image-optimization/
├── api/                      # API Node.js com TypeScript + esbuild
│   ├── src/
│   │   └── index.ts          # Express: GET / e GET /health
│   ├── package.json
│   └── Dockerfile            # Multi-stage: builder → node:20-alpine
│
├── web/                      # Frontend React com Vite
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile            # Multi-stage: builder → nginx:alpine
│
└── docker-compose.yml        # Sobe os dois serviços
```

---

## 🔍 Estratégia por Serviço

### API — TypeScript + esbuild

O esbuild compila o TypeScript e empacota todas as dependências num **único arquivo JS**. A imagem final não precisa de `node_modules` pois o Express já está embutido no bundle.

```dockerfile
# Stage 1: compila tudo
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install                          # instala devDeps + deps
COPY src ./src
RUN npm run build                        # gera dist/index.js com express embutido

# Stage 2: apenas o runtime + o bundle
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/index.js ./index.js
# ✖ node_modules não existe aqui
EXPOSE 3000
CMD ["node", "index.js"]
```

### Frontend — React + Vite → nginx

O Vite gera arquivos estáticos otimizados em `/dist`. O nginx serve esses arquivos sem precisar de Node ou `node_modules`.

```dockerfile
# Stage 1: build do React
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                        # gera /dist com HTML, CSS, JS minificados

# Stage 2: nginx serve os arquivos estáticos
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# ✖ Node não existe aqui
# ✖ node_modules não existe aqui
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🚀 Como rodar

**Pré-requisito:** Docker Desktop instalado.

```bash
# Clona o repositório
git clone https://github.com/JoseMMello/optimization-imagens-docker.git
cd optimization-imagens-docker

# Sobe os dois serviços
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend React | http://localhost:8080 |
| API Node | http://localhost:3000 |
| Health check | http://localhost:3000/health |

---

## 🔬 Verificando na prática

Após o build, compare os tamanhos:

```bash
docker images | grep optimization
```

Confirme que o `node_modules` **não existe** no container de produção:

```bash
# Frontend: não existe /app — apenas arquivos estáticos no nginx
docker exec -it <web-container> sh
ls /usr/share/nginx/html

# API: não existe node_modules — apenas o bundle
docker exec -it <api-container> sh
ls /app
# → index.js   (só isso)
```

---

## 💡 Por que isso importa?

- **CI/CD mais rápido** — imagens menores são transferidas e deployadas mais rapidamente
- **Menor superfície de ataque** — ferramentas de build e código-fonte não vão para produção
- **Menos uso de disco** no registry e nos servidores
- **Pulls mais rápidos** em escala horizontal (Kubernetes, ECS, etc.)

---

Feito por [José Martins](https://github.com/JoseMMello)
