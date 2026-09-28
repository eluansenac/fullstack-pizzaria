# Stack local: Vue + NGINX + NestJS + PostgreSQL (Prisma)

Execute nesta pasta com Docker e Docker Compose:

```bash
cp .env.example .env
docker compose up -d --build --wait
docker compose ps
```

O `.env.example` contém credenciais apenas para desenvolvimento local. Ajuste a senha em `.env` antes de subir se necessário. As portas publicadas ficam restritas a `127.0.0.1`.

| Serviço | Endereço |
| --- | --- |
| Frontend Vue / NGINX | http://localhost:8080 |
| API pelo NGINX | http://localhost:8080/api |
| API NestJS diretamente | http://localhost:3000/api |
| Saúde da API e banco | http://localhost:8080/api/health |
| PostgreSQL | localhost:5432 |

O NGINX encaminha `/api/` ao backend, mantendo frontend e API na mesma origem. Entre containers, o banco é acessado pelo hostname `postgres`, na porta `5432`. `POSTGRES_PORT`, `BACKEND_PORT` e `WEB_PORT` em `.env` alteram somente as portas do host.

O Compose aguarda o banco estar saudável antes de iniciar o backend e aguarda o backend antes de iniciar o frontend. Ao subir, o container do backend roda `prisma migrate deploy`, aplicando as migrações do Prisma antes de iniciar o servidor.

## API

Recurso único: `Categoria` (`id`, `nome`, `criadaEm`).

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health/live` | Verificar se o servidor está ativo |
| GET | `/api/health` | Verificar conexão com PostgreSQL; retorna 503 quando indisponível |
| POST | `/api/categorias` | Cadastrar categoria |
| GET | `/api/categorias` | Listar categorias |
| GET | `/api/categorias/:id` | Buscar categoria por id |
| DELETE | `/api/categorias/:id` | Remover categoria |

```bash
curl http://localhost:8080/api/health

curl -X POST http://localhost:8080/api/categorias \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Sobremesas"}'

curl http://localhost:8080/api/categorias

curl -X DELETE http://localhost:8080/api/categorias/CATEGORIA_ID
```

Nome duplicado retorna 409; id inexistente ou fora do formato UUID retorna 404/400; payload inválido retorna 400.

## Desenvolvimento sem containers para a aplicação

Use Node.js 24 ou superior. Inicie apenas o banco com `docker compose up -d postgres`. Em outro terminal:

```bash
cd backend # a partir da raiz do repositório
cp .env.example .env
npm ci
npm run prisma:migrate   # cria/aplica as migrações e gera o Prisma Client
npm run prisma:seed      # cadastra categorias de exemplo (opcional)
npm run dev
```

Mantenha `DATABASE_URL` no `.env` do backend compatível com as credenciais do Compose. `npm run dev` recompila ao editar arquivos. Para o frontend, execute `npm ci` e `npm run dev` em `devops/`; o Vite encaminha `/api` para `localhost:3000`.

```bash
cd backend # a partir da raiz do repositório
npm run typecheck
npm run build
npm start
```

## Operação local

```bash
docker compose logs -f backend postgres
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose down
```

`docker compose down` preserva os dados no volume `postgres_data`. `docker compose down -v` apaga os dados. Alterar as credenciais em `.env` não altera usuários de um volume já inicializado; use SQL para trocar a senha ou recrie um volume de desenvolvimento descartável.

O `deployment.yaml` é um manifesto Kubernetes de referência (Deployment `web` original em NGINX, mais Secret/PVC/Deployment/Service de PostgreSQL e backend); a stack local completa descrita aqui usa `compose.yaml`. Para aplicar no cluster, construa e publique a imagem do backend em um registry acessível e ajuste `image: backend:latest` antes de `kubectl apply -f deployment.yaml`. A API é didática e ainda não possui autenticação.

Referências: [NestJS](https://docs.nestjs.com/first-steps), [validação de entradas](https://docs.nestjs.com/techniques/validation), [Prisma](https://www.prisma.io/docs) e [ordem de inicialização no Compose](https://docs.docker.com/compose/how-tos/startup-order/).
