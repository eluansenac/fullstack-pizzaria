import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { criarServidor } from '../dist/app.js';
import { DatabaseService } from '../dist/infrastructure/database/database.service.js';
import { PedidoRepositoryPostgres, PizzaRepositoryPostgres } from '../dist/infrastructure/repositories/postgres.js';
import { Dinheiro } from '../dist/domain/shared/dinheiro.js';
import { ConflitoDeAtualizacao } from '../dist/domain/shared/erro-de-dominio.js';

test('API NestJS com PostgreSQL real: validação, persistência e concorrência', async (t) => {
  let app = await criarServidor();
  await app.listen(0, '0.0.0.0');
  t.after(async () => { await app.close(); });
  let base = await app.getUrl();
  const request = async (method, path, body) => {
    const response = await fetch(`${base}/api${path}`, {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };

  assert.deepEqual(await request('GET', '/health'), { status: 200, body: { status: 'ok', database: 'up' } });
  assert.equal((await request('GET', '/health/live')).status, 200);

  await t.test('rejeita entradas inválidas antes de consultar o banco', async () => {
    for (const body of [{}, { nome: 'Maria', telefone: 'abc' }, { nome: 'Maria', telefone: '11999991234', admin: true }]) {
      assert.equal((await request('POST', '/clientes', body)).status, 400);
    }
    assert.equal((await request('POST', '/pizzas', { nome: 'Queijo', tamanho: 'media', precoCentavos: '3500' })).status, 400);
    assert.equal((await request('GET', '/pedidos/id-invalido')).status, 400);
    assert.equal((await request('GET', `/pedidos/${randomUUID()}`)).status, 404);
    for (const body of [{}, { clienteId: randomUUID(), itens: [], atendimento: { tipo: 'retirada' } },
      { clienteId: randomUUID(), itens: [{ pizzaId: randomUUID(), quantidade: 1 }], atendimento: { tipo: 'entrega' } },
      { clienteId: randomUUID(), itens: [null], atendimento: null }]) {
      assert.equal((await request('POST', '/pedidos', body)).status, 400);
    }
  });

  const cliente = await request('POST', '/clientes', { nome: 'Maria', telefone: '11999991234' });
  const pizza = await request('POST', '/pizzas', { nome: 'Margherita', tamanho: 'grande', precoCentavos: 4590 });
  assert.equal(cliente.status, 201);
  assert.equal(pizza.status, 201);
  const entrada = {
    clienteId: cliente.body.id,
    itens: [{ pizzaId: pizza.body.id, quantidade: 2 }],
    atendimento: { tipo: 'entrega', endereco: { rua: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'São Paulo' } },
  };
  const pedido = await request('POST', '/pedidos', entrada);
  assert.equal(pedido.status, 201);
  assert.equal(pedido.body.total.centavos, 9180);
  const id = pedido.body.id;

  await t.test('regras de negócio continuam válidas através da API', async () => {
    assert.equal((await request('POST', '/pedidos', { ...entrada, clienteId: randomUUID() })).status, 400);
    assert.equal((await request('POST', '/pedidos', { ...entrada, itens: [{ pizzaId: randomUUID(), quantidade: 1 }] })).status, 400);
    assert.equal((await request('PATCH', `/pedidos/${id}/status`, { status: 'entregue' })).status, 400);
    assert.equal((await request('PATCH', `/pedidos/${id}/status`, { status: 'desconhecido' })).status, 400);
    assert.equal((await request('PATCH', `/pedidos/${id}/status`, { status: 'em_preparo' })).status, 200);
    const retirado = await request('POST', '/pedidos', { ...entrada, atendimento: { tipo: 'retirada' } });
    assert.equal(retirado.status, 201);
    assert.deepEqual(retirado.body.atendimento, { tipo: 'retirada' });
  });

  await t.test('preserva o preço histórico e rejeita gravação com status desatualizado', async () => {
    const pool = app.get(DatabaseService).pool;
    const pizzas = new PizzaRepositoryPostgres(pool);
    const atual = await pizzas.buscarPorId(pizza.body.id);
    await pizzas.salvar(atual.alterarPreco(Dinheiro.deCentavos(5000)));
    const pedidos = new PedidoRepositoryPostgres(pool);
    const antigo = await pedidos.buscarPorId(id);
    await pedidos.salvar(antigo.alterarStatus('pronto'), antigo.status);
    await assert.rejects(pedidos.salvar(antigo.alterarStatus('pronto'), antigo.status), ConflitoDeAtualizacao);
    const salvo = await pedidos.buscarPorId(id);
    assert.equal(salvo.total.centavos, 9180);
    assert.equal(salvo.itens[0].precoUnitario.centavos, 4590);
  });

  await t.test('dados sobrevivem ao reinício da aplicação e migrações podem ser repetidas', async () => {
    await app.close();
    app = await criarServidor();
    await app.listen(0, '0.0.0.0');
    base = await app.getUrl();
    const salvo = await request('GET', `/pedidos/${id}`);
    assert.equal(salvo.status, 200);
    assert.equal(salvo.body.status, 'pronto');
    assert.equal(salvo.body.total.centavos, 9180);
    assert.deepEqual(salvo.body.atendimento, entrada.atendimento);
    assert.equal((await request('PATCH', `/pedidos/${id}/status`, { status: 'entregue' })).status, 200);
  });

  await t.test('health retorna 503 quando a conexão com o banco não está disponível', async () => {
    const pool = app.get(DatabaseService).pool;
    const original = pool.query;
    pool.query = async () => { throw new Error('Banco indisponível'); };
    try {
      assert.equal((await request('GET', '/health')).status, 503);
      assert.equal((await request('GET', '/health/live')).status, 200);
    } finally {
      pool.query = original;
    }
  });
});
