# Stack local: Vue + NGINX + NestJS + PostgreSQL

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

O Compose aguarda o banco estar saudável antes de iniciar o backend e aguarda o backend antes de iniciar o frontend. O backend aplica migrações versionadas e transacionais na inicialização. Clientes e pizzas usam tabelas próprias; o pedido guarda seus itens e endereço em JSONB para preservar o histórico da compra.

## API

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health/live` | Verificar se o servidor está ativo |
| GET | `/api/health` | Verificar conexão com PostgreSQL; retorna 503 quando indisponível |
| POST | `/api/clientes` | Cadastrar cliente |
| POST | `/api/pizzas` | Cadastrar pizza |
| POST | `/api/pedidos` | Realizar pedido |
| GET | `/api/pedidos/:id` | Consultar pedido |
| PATCH | `/api/pedidos/:id/status` | Atualizar status |

```bash
curl http://localhost:8080/api/health

curl -X POST http://localhost:8080/api/clientes \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Maria","telefone":"11999991234"}'

curl -X POST http://localhost:8080/api/pizzas \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Margherita","tamanho":"grande","precoCentavos":4590}'
```

Substitua `CLIENTE_ID`, `PIZZA_ID` e `PEDIDO_ID` pelos UUIDs retornados:

```bash
curl -X POST http://localhost:8080/api/pedidos \
  -H 'Content-Type: application/json' \
  -d '{"clienteId":"CLIENTE_ID","itens":[{"pizzaId":"PIZZA_ID","quantidade":2}],"atendimento":{"tipo":"retirada"}}'

curl http://localhost:8080/api/pedidos/PEDIDO_ID

curl -X PATCH http://localhost:8080/api/pedidos/PEDIDO_ID/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"em_preparo"}'
```

Para entrega, use `"atendimento":{"tipo":"entrega","endereco":{"rua":"Rua A","numero":"10","bairro":"Centro","cidade":"São Paulo"}}`. Valores monetários são inteiros em centavos; respostas representam dinheiro como `{"centavos":4590}`. Campos extras e formatos inválidos retornam 400; pedido inexistente retorna 404; atualização concorrente com status desatualizado retorna 409.

## Desenvolvimento sem containers para a aplicação

Use Node.js 24 ou superior. Inicie apenas o banco com `docker compose up -d postgres`. Em outro terminal:

```bash
cd backend # a partir da raiz do repositório
cp .env.example .env
npm ci
npm run dev
```

Mantenha as credenciais e a porta do `.env` do backend compatíveis com as do Compose. `npm run dev` recompila ao editar arquivos. Para o frontend, execute `npm ci` e `npm run dev` em `devops/`; o Vite encaminha `/api` para `localhost:3000`.

```bash
cd backend # a partir da raiz do repositório
npm test
npm run typecheck
npm run build
npm start
```

Os testes de integração precisam de um PostgreSQL exclusivo para testes: eles aplicam migrações e criam registros. Configure `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente e rode `npm run test:integration`. Os testes cobrem API, entradas inválidas, persistência após reinício da aplicação, preços históricos, conflito de atualização e saúde do banco.

## Operação local

```bash
docker compose logs -f backend postgres
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose down
```

`docker compose down` preserva os dados no volume `postgres_data`. `docker compose down -v` apaga os dados. Alterar as credenciais em `.env` não altera usuários de um volume já inicializado; use SQL para trocar a senha ou recrie um volume de desenvolvimento descartável.

O `deployment.yaml` é um manifesto Kubernetes de referência (Deployment `web` original em NGINX, mais Secret/PVC/Deployment/Service de PostgreSQL e backend); a stack local completa descrita aqui usa `compose.yaml`. Para aplicar no cluster, construa e publique a imagem do backend em um registry acessível e ajuste `image: backend:latest` antes de `kubectl apply -f deployment.yaml`. A API é didática e ainda não possui autenticação.

Referências: [NestJS](https://docs.nestjs.com/first-steps), [validação de entradas](https://docs.nestjs.com/techniques/validation) e [ordem de inicialização no Compose](https://docs.docker.com/compose/how-tos/startup-order/).
