# Categorias — NestJS + Prisma + PostgreSQL

API mínima para cadastro de categorias, usada como exemplo de ORM com [Prisma](https://www.prisma.io) sobre NestJS e PostgreSQL, com frontend Vue servido pelo NGINX.

## Executar

Para subir a stack completa com Docker:

```bash
cd devops
cp .env.example .env
docker compose up -d --build --wait
```

Acesse http://localhost:8080 e verifique a conexão em http://localhost:8080/api/health. Configuração, rotas, exemplos e desenvolvimento local estão em [devops/README.md](devops/README.md).

Para rodar só o backend, com Node.js 24 ou superior, npm e um PostgreSQL acessível:

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL se necessário
npm ci
npm run prisma:migrate # cria a tabela categorias e gera o Prisma Client
npm run prisma:seed    # cadastra categorias de exemplo (opcional)
npm run dev
```

```bash
npm run typecheck
npm run build
npm start
```

## Modelo de dados

Um único model, `Categoria` (`backend/prisma/schema.prisma`):

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID | Gerado automaticamente |
| `nome` | texto | Único |
| `criadaEm` | timestamp | Preenchido na criação |

## API

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health/live` | Verificar se o servidor está ativo |
| GET | `/api/health` | Verificar conexão com PostgreSQL; retorna 503 quando indisponível |
| POST | `/api/categorias` | Cadastrar categoria |
| GET | `/api/categorias` | Listar categorias |
| GET | `/api/categorias/:id` | Buscar categoria por id |
| DELETE | `/api/categorias/:id` | Remover categoria |

Nome duplicado retorna 409; id inexistente ou fora do formato UUID retorna 404/400; payload inválido retorna 400.

## Organização

```text
backend/
  prisma/
    schema.prisma      Model Categoria e datasource PostgreSQL
    migrations/         Migrações versionadas do Prisma
    seed.ts             Categorias de exemplo
  src/
    prisma/             PrismaService/PrismaModule (conexão compartilhada)
    categorias/         Controller, service e DTO de Categoria
    health.controller.ts Rotas de saúde
    app.module.ts       Composição do NestJS
    app.ts               Bootstrap do Nest (prefixo /api, validação global)
    main.ts               Servidor HTTP
  prisma.config.ts      Configuração do Prisma CLI (schema, seed)
```

## Escopo

Os dados persistem no PostgreSQL e no volume Docker. O container do backend roda `prisma migrate deploy` automaticamente ao iniciar. Autenticação e paginação não fazem parte desta implementação. O frontend em `devops/` verifica a conexão com a API e o banco.
