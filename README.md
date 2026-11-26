# Pizzaria — categorias

API em NestJS + Prisma + PostgreSQL, com frontend em Vue.

| Pasta | Conteúdo |
| --- | --- |
| `backend/` | API e banco (Prisma) |
| `frontend/` | Tela que lista as categorias |
| `devops/` | Docker Compose, manifesto Kubernetes e página de status |

**Requisitos:** Docker com Compose e Node.js 24. Para Kubernetes, também `kind` e `kubectl`.

Todos os comandos partem da **raiz do projeto**.

## 1. Subir com Docker Compose

```bash
cd devops
cp -n .env.example .env
docker compose up -d --build --wait
curl http://localhost:8080/api/health
cd ..
```

Resposta esperada: `{"status":"ok","database":"up"}`.

| Serviço | Endereço |
| --- | --- |
| Página de status | http://localhost:8080 |
| API | http://localhost:3000/api |
| PostgreSQL | `localhost:5432` |

## 2. Criar o administrador e as categorias

Com o banco no ar na porta 5432:

```bash
cd backend
nvm install 24
cp -n .env.example .env
npm ci
npm run prisma:generate
npm run prisma:seed
cd ..
```

O login do administrador usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` de `backend/.env`.

## 3. Desenvolver

Terminal 1, banco e API:

```bash
cd devops
cp -n .env.example .env
docker compose stop backend web
docker compose up -d --wait postgres
cd ../backend
nvm install 24
cp -n .env.example .env
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Terminal 2, frontend:

```bash
cd frontend
nvm use 24
npm ci
npm run dev
```

Acesse http://localhost:5173.

Depois de alterar `backend/prisma/schema.prisma`, crie a migração (em `backend/`):

```bash
npm run prisma:migrate
```

## 4. Subir no Kubernetes (kind)

Antes, libere as portas usadas pelo Compose:

```bash
docker compose -f devops/compose.yaml down
```

Crie o cluster (só na primeira vez):

```bash
kind create cluster --name hpa
```

Se o cluster já existe mas está parado: `docker start hpa-control-plane`.

Publique a imagem e aplique o manifesto:

```bash
kubectl config use-context kind-hpa
docker build -t backend:latest ./backend
kind load docker-image backend:latest --name hpa
kubectl apply -f devops/deployment.yaml
kubectl rollout restart deployment/backend
kubectl rollout status deployment/postgres --timeout=180s
kubectl rollout status deployment/backend --timeout=180s
```

Exponha a API e o banco, cada comando em um terminal:

```bash
kubectl port-forward svc/backend 3000:3000
```

```bash
kubectl port-forward svc/postgres 5432:5432
```

Com os dois abertos, siga a [etapa 2](#2-criar-o-administrador-e-as-categorias) para cadastrar os dados.

O deployment `web` do manifesto é um NGINX de exemplo; para ver a tela, rode o frontend (terminal 2 da etapa 3).

## API

| Método | Rota | Acesso |
| --- | --- | --- |
| GET | `/api/health/live` | Público |
| GET | `/api/health` | Público |
| POST | `/api/auth/registrar` | Público (cria um cliente) |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Com token |
| GET | `/api/categorias` | Público |
| GET | `/api/categorias/:id` | Com token |
| POST | `/api/categorias` | Administrador |
| DELETE | `/api/categorias/:id` | Administrador |

Para criar uma categoria, troque `SUA_SENHA` pela senha do administrador:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@pizzaria.com","senha":"SUA_SENHA"}' \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

curl -X POST http://localhost:3000/api/categorias \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Calzones"}'
```

O token vale por 1 hora.

## Logs e parada

| Ação | Docker Compose (em `devops/`) | Kubernetes |
| --- | --- | --- |
| Ver logs | `docker compose logs -f backend` | `kubectl logs -f deploy/backend` |
| Abrir o banco | `docker compose exec postgres psql -U pizzaria -d pizzaria` | `kubectl exec -it deploy/postgres -- psql -U pizzaria -d pizzaria` |
| Parar sem apagar dados | `docker compose down` | `kubectl scale deployment/postgres deployment/backend --replicas=0` |
| Voltar | `docker compose up -d --wait` | `kubectl scale deployment/postgres deployment/backend --replicas=1` |

**Apagam os dados:** `docker compose down -v` e `kubectl delete -f devops/deployment.yaml`.

As senhas dos arquivos de exemplo e do manifesto servem apenas para desenvolvimento local.
