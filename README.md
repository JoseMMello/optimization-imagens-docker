# 🐳 Docker Image Optimization

A practical demonstration of how to drastically reduce Docker image sizes using **multi-stage builds** — applied to a Node.js API (TypeScript + esbuild) and a React frontend (Vite + nginx).

---

## 📊 Size Comparison

| Image | Strategy | Size |
|-------|----------|------|
| `node:20` + node_modules + devDeps | ❌ Naive (no optimization) | ~1.2 GB |
| `node:20-alpine` + prod deps only | ⚠️ Single-stage optimized | ~230 MB |
| `node:20-alpine` + esbuild bundle | ✅ Multi-stage + bundle | ~195 MB |
| `nginx:alpine` + static `/dist` | ✅ Multi-stage React | ~25 MB |

> The frontend image dropped from ~500MB to ~25MB — **a 95% reduction**.

---

## 🏗️ How Multi-Stage Builds Work

The core idea is to use **multiple stages** in the Dockerfile. Each stage starts from a different base image, and only the necessary artifacts are copied into the next stage.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│       Stage: builder         │        │      Stage: production        │
│  node:20-alpine              │        │  nginx:alpine  (React)        │
│                              │  →     │  node:20-alpine (API)         │
│  ✔ node_modules              │ copies │                               │
│  ✔ devDependencies           │  only  │  ✔ /dist  or  bundle.js       │
│  ✔ TypeScript, esbuild...    │  build │  ✖ node_modules               │
│                              │ output │  ✖ devDependencies            │
└─────────────────────────────┘        │  ✖ TypeScript source          │
                                        └──────────────────────────────┘
```

---

## 🗂️ Project Structure

```
image-optimization/
├── api/                      # Node.js API with TypeScript + esbuild
│   ├── src/
│   │   └── index.ts          # Express: GET / and GET /health
│   ├── package.json
│   └── Dockerfile            # Multi-stage: builder → node:20-alpine
│
├── web/                      # React frontend with Vite
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile            # Multi-stage: builder → nginx:alpine
│
└── docker-compose.yml        # Runs both services
```

---

## 🔍 Strategy per Service

### API — TypeScript + esbuild

esbuild compiles TypeScript and bundles all dependencies into a **single JS file**. The final image doesn't need `node_modules` because Express is already embedded in the bundle.

```dockerfile
# Stage 1: compile everything
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install                          # installs devDeps + deps
COPY src ./src
RUN npm run build                        # outputs dist/index.js with Express bundled in

# Stage 2: runtime + bundle only
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/index.js ./index.js
# ✖ node_modules does not exist here
EXPOSE 3000
CMD ["node", "index.js"]
```

### Frontend — React + Vite → nginx

Vite generates optimized static files in `/dist`. nginx serves those files without needing Node or `node_modules`.

```dockerfile
# Stage 1: React build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                        # outputs /dist with minified HTML, CSS, JS

# Stage 2: nginx serves the static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# ✖ Node does not exist here
# ✖ node_modules does not exist here
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🚀 Getting Started

**Prerequisite:** Docker Desktop installed.

```bash
# Clone the repository
git clone https://github.com/JoseMMello/optimization-imagens-docker.git
cd optimization-imagens-docker

# Build and start both services
docker compose up --build
```

| Service | URL |
|---------|-----|
| React Frontend | http://localhost:8080 |
| Node API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |

---

## 🔬 Verifying in Practice

After the build, compare image sizes:

```bash
docker images | grep optimization
```

Confirm that `node_modules` **does not exist** in the production containers:

```bash
# Frontend: no /app — only static files served by nginx
docker exec -it <web-container> sh
ls /usr/share/nginx/html

# API: no node_modules — only the bundle
docker exec -it <api-container> sh
ls /app
# → index.js   (that's it)
```

---

## 💡 Why This Matters

- **Faster CI/CD** — smaller images are transferred and deployed more quickly
- **Reduced attack surface** — build tools and source code never reach production
- **Lower disk usage** on the registry and servers
- **Faster pulls** at horizontal scale (Kubernetes, ECS, etc.)

---

Made by [José Martins](https://github.com/JoseMMello)
