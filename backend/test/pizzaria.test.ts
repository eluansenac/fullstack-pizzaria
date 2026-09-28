import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Dinheiro } from '../src/domain/shared/dinheiro.js';
import { ErroDeDominio } from '../src/domain/shared/erro-de-dominio.js';
import { Cliente } from '../src/domain/clientes/cliente.js';
import { Pizza } from '../src/domain/cardapio/pizza.js';
import { Endereco } from '../src/domain/pedidos/endereco.js';
import { ItemPedido } from '../src/domain/pedidos/item-pedido.js';
import { Pedido, type StatusPedido } from '../src/domain/pedidos/pedido.js';
import { RealizarPedido } from '../src/application/realizar-pedido.js';
import { AlterarStatusPedido } from '../src/application/alterar-status-pedido.js';
import { ConsultarPedido } from '../src/application/consultar-pedido.js';
import { criarPizzaria } from '../src/composition-root.js';
import {
  ClienteRepositoryEmMemoria,
  PizzaRepositoryEmMemoria,
  PedidoRepositoryEmMemoria,
} from '../src/infrastructure/repositories/em-memoria.js';

function novoPedido(): Pedido {
  return Pedido.criar('pedido-1', 'cliente-1', [
    new ItemPedido('pizza-1', 'Margherita', 'grande', Dinheiro.deCentavos(4590), 2),
  ], { tipo: 'retirada' });
}

async function preparar() {
  const clientes = new ClienteRepositoryEmMemoria();
  const pizzas = new PizzaRepositoryEmMemoria();
  const pedidos = new PedidoRepositoryEmMemoria();
  const pizza = new Pizza('pizza-1', 'Margherita', 'grande', Dinheiro.deCentavos(4590));
  await clientes.salvar(new Cliente('cliente-1', 'Maria', '(11) 99999-1234'));
  await pizzas.salvar(pizza);
  const realizar = new RealizarPedido(clientes, pizzas, pedidos, () => 'pedido-1');
  return { pizzas, pedidos, pizza, realizar };
}

test('dinheiro soma centavos exatamente e compara por valor', () => {
  assert.ok(Dinheiro.deCentavos(10).somar(Dinheiro.deCentavos(20)).equals(Dinheiro.deCentavos(30)));
  for (const valor of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => Dinheiro.deCentavos(valor), ErroDeDominio);
  }
  assert.throws(() => Dinheiro.deCentavos(Number.MAX_SAFE_INTEGER).somar(Dinheiro.deCentavos(1)), ErroDeDominio);
});

test('cliente exige identidade, nome e telefone com DDD', () => {
  assert.throws(() => new Cliente('', 'Maria', '11999991234'), ErroDeDominio);
  assert.throws(() => new Cliente('c1', ' ', '11999991234'), ErroDeDominio);
  assert.throws(() => new Cliente('c1', 'Maria', '123'), ErroDeDominio);
});

test('endereço valida campos e compara por valor', () => {
  assert.throws(() => new Endereco('Rua A', '', 'Centro', 'São Paulo'), ErroDeDominio);
  assert.ok(new Endereco('Rua A', '10', 'Centro', 'São Paulo')
    .equals(new Endereco('Rua A', '10', 'Centro', 'São Paulo')));
});

test('pizza exige preço positivo e tamanho conhecido', () => {
  assert.throws(() => new Pizza('p1', 'Queijo', 'media', Dinheiro.deCentavos(0)), ErroDeDominio);
  // @ts-expect-error simula um tamanho inválido vindo de uma entrada externa
  assert.throws(() => new Pizza('p1', 'Queijo', 'gigante', Dinheiro.deCentavos(100)), ErroDeDominio);
});

test('pedido calcula o total de várias pizzas e quantidades', () => {
  const pedido = Pedido.criar('p1', 'c1', [
    new ItemPedido('pizza-1', 'Margherita', 'grande', Dinheiro.deCentavos(4590), 2),
    new ItemPedido('pizza-2', 'Calabresa', 'media', Dinheiro.deCentavos(3500), 1),
  ], { tipo: 'retirada' });
  assert.equal(pedido.total.centavos, 12680);
  assert.equal(pedido.status, 'recebido');
});

test('pedido rejeita lista vazia e quantidades inválidas', () => {
  assert.throws(() => Pedido.criar('p1', 'c1', [], { tipo: 'retirada' }), ErroDeDominio);
  for (const quantidade of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => new ItemPedido('p1', 'Queijo', 'media', Dinheiro.deCentavos(100), quantidade), ErroDeDominio);
  }
});

test('pedido protege seus itens e não altera versões anteriores', () => {
  const itens = [...novoPedido().itens];
  const pedido = Pedido.criar('p1', 'c1', itens, { tipo: 'retirada' });
  itens.pop();
  assert.equal(pedido.itens.length, 1);
  assert.ok(Object.isFrozen(pedido));
  assert.ok(Object.isFrozen(pedido.itens));
  assert.ok(Object.isFrozen(pedido.itens[0]));
  assert.equal(pedido.alterarStatus('em_preparo').status, 'em_preparo');
  assert.equal(pedido.status, 'recebido');
});

test('ciclo do pedido permite apenas as transições de negócio', () => {
  const recebido = novoPedido();
  const preparo = recebido.alterarStatus('em_preparo');
  const pronto = preparo.alterarStatus('pronto');
  const entregue = pronto.alterarStatus('entregue');
  const cancelado = recebido.alterarStatus('cancelado');
  const permitidas: Record<StatusPedido, StatusPedido[]> = {
    recebido: ['em_preparo', 'cancelado'], em_preparo: ['pronto'], pronto: ['entregue'], entregue: [], cancelado: [],
  };
  const status: StatusPedido[] = ['recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado'];
  for (const pedido of [recebido, preparo, pronto, entregue, cancelado]) {
    for (const destino of status) {
      if (!permitidas[pedido.status].includes(destino)) {
        assert.throws(() => pedido.alterarStatus(destino), ErroDeDominio);
      }
    }
  }
});

test('fluxo completo cadastra, realiza, entrega e consulta um pedido', async () => {
  const app = criarPizzaria();
  const cliente = await app.cadastrarCliente.executar({ nome: 'Maria', telefone: '11999991234' });
  const pizza = await app.cadastrarPizza.executar({ nome: 'Queijo', tamanho: 'media', precoCentavos: 3500 });
  const pedido = await app.realizarPedido.executar({
    clienteId: cliente.id,
    itens: [{ pizzaId: pizza.id, quantidade: 2 }],
    atendimento: { tipo: 'entrega', endereco: { rua: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'São Paulo' } },
  });
  for (const status of ['em_preparo', 'pronto', 'entregue'] as const) {
    await app.alterarStatusPedido.executar(pedido.id, status);
  }
  const encontrado = await app.consultarPedido.executar(pedido.id);
  assert.equal(encontrado.status, 'entregue');
  assert.equal(encontrado.total.centavos, 7000);
  assert.equal(encontrado.atendimento.tipo, 'entrega');
});

test('mudanças no cardápio preservam preço e total do pedido existente', async () => {
  const { realizar, pizzas, pizza, pedidos } = await preparar();
  await realizar.executar({ clienteId: 'cliente-1', itens: [{ pizzaId: pizza.id, quantidade: 2 }], atendimento: { tipo: 'retirada' } });
  await pizzas.salvar(pizza.alterarPreco(Dinheiro.deCentavos(5000)));
  const salvo = await pedidos.buscarPorId('pedido-1');
  assert.equal(salvo?.itens[0]?.precoUnitario.centavos, 4590);
  assert.equal(salvo?.total.centavos, 9180);
});

test('cliente e pizza devem existir; falhas não salvam pedidos', async () => {
  const { realizar, pedidos } = await preparar();
  await assert.rejects(realizar.executar({ clienteId: 'inexistente', itens: [{ pizzaId: 'pizza-1', quantidade: 1 }], atendimento: { tipo: 'retirada' } }), /Cliente não encontrado/);
  await assert.rejects(realizar.executar({ clienteId: 'cliente-1', itens: [{ pizzaId: 'inexistente', quantidade: 1 }], atendimento: { tipo: 'retirada' } }), /Pizza não encontrada/);
  assert.equal(await pedidos.buscarPorId('pedido-1'), undefined);
});

test('pizza indisponível impede todo o pedido, mesmo após um item válido', async () => {
  const { realizar, pizzas, pizza, pedidos } = await preparar();
  await pizzas.salvar(new Pizza('pizza-2', 'Calabresa', 'media', Dinheiro.deCentavos(3500), false));
  await assert.rejects(realizar.executar({
    clienteId: 'cliente-1', itens: [{ pizzaId: pizza.id, quantidade: 1 }, { pizzaId: 'pizza-2', quantidade: 1 }], atendimento: { tipo: 'retirada' },
  }), /indisponível/);
  assert.equal(await pedidos.buscarPorId('pedido-1'), undefined);
});

test('entrega exige endereço e retirada dispensa endereço', async () => {
  const { realizar, pedidos } = await preparar();
  await assert.rejects(realizar.executar({
    clienteId: 'cliente-1', itens: [{ pizzaId: 'pizza-1', quantidade: 1 }],
    // @ts-expect-error simula entrada externa sem endereço obrigatório
    atendimento: { tipo: 'entrega' },
  }), /precisam de endereço/);
  assert.equal(await pedidos.buscarPorId('pedido-1'), undefined);
  const pedido = await realizar.executar({ clienteId: 'cliente-1', itens: [{ pizzaId: 'pizza-1', quantidade: 1 }], atendimento: { tipo: 'retirada' } });
  assert.equal(pedido.atendimento.tipo, 'retirada');
});

test('transição rejeitada não altera o pedido persistido', async () => {
  const { pedidos } = await preparar();
  await pedidos.salvar(novoPedido());
  const alterar = new AlterarStatusPedido(pedidos);
  await alterar.executar('pedido-1', 'em_preparo');
  await assert.rejects(alterar.executar('pedido-1', 'cancelado'), ErroDeDominio);
  assert.equal((await pedidos.buscarPorId('pedido-1'))?.status, 'em_preparo');
});

test('consulta e alteração de pedido inexistente informam erro', async () => {
  const { pedidos } = await preparar();
  await assert.rejects(new ConsultarPedido(pedidos).executar('inexistente'), /Pedido não encontrado/);
  await assert.rejects(new AlterarStatusPedido(pedidos).executar('inexistente', 'em_preparo'), /Pedido não encontrado/);
});
