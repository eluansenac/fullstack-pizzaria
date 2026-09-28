import type { Pool } from 'pg';
import { Cliente } from '../../domain/clientes/cliente.js';
import type { ClienteRepository } from '../../domain/clientes/cliente-repository.js';
import { Pizza, type TamanhoPizza } from '../../domain/cardapio/pizza.js';
import type { PizzaRepository } from '../../domain/cardapio/pizza-repository.js';
import { Pedido, type Atendimento, type StatusPedido } from '../../domain/pedidos/pedido.js';
import type { PedidoRepository } from '../../domain/pedidos/pedido-repository.js';
import { Endereco } from '../../domain/pedidos/endereco.js';
import { ItemPedido } from '../../domain/pedidos/item-pedido.js';
import { Dinheiro } from '../../domain/shared/dinheiro.js';
import { ConflitoDeAtualizacao } from '../../domain/shared/erro-de-dominio.js';

export class ClienteRepositoryPostgres implements ClienteRepository {
  constructor(private readonly pool: Pool) {}

  async salvar(cliente: Cliente): Promise<void> {
    await this.pool.query(`INSERT INTO clientes (id, nome, telefone) VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone`,
    [cliente.id, cliente.nome, cliente.telefone]);
  }

  async buscarPorId(id: string): Promise<Cliente | undefined> {
    const { rows } = await this.pool.query<{ id: string; nome: string; telefone: string }>('SELECT * FROM clientes WHERE id = $1', [id]);
    const row = rows[0];
    return row ? new Cliente(row.id, row.nome, row.telefone) : undefined;
  }
}

export class PizzaRepositoryPostgres implements PizzaRepository {
  constructor(private readonly pool: Pool) {}

  async salvar(pizza: Pizza): Promise<void> {
    await this.pool.query(`INSERT INTO pizzas (id, nome, tamanho, preco_centavos, disponivel) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, tamanho = EXCLUDED.tamanho,
      preco_centavos = EXCLUDED.preco_centavos, disponivel = EXCLUDED.disponivel`,
    [pizza.id, pizza.nome, pizza.tamanho, pizza.preco.centavos, pizza.disponivel]);
  }

  async buscarPorId(id: string): Promise<Pizza | undefined> {
    const { rows } = await this.pool.query<{
      id: string; nome: string; tamanho: TamanhoPizza; preco_centavos: string; disponivel: boolean;
    }>('SELECT * FROM pizzas WHERE id = $1', [id]);
    const row = rows[0];
    return row ? new Pizza(row.id, row.nome, row.tamanho, Dinheiro.deCentavos(Number(row.preco_centavos)), row.disponivel) : undefined;
  }
}

interface PedidoRow {
  id: string;
  cliente_id: string;
  itens: { pizzaId: string; nome: string; tamanho: TamanhoPizza; precoCentavos: number; quantidade: number }[];
  atendimento: Atendimento;
  status: StatusPedido;
}

export class PedidoRepositoryPostgres implements PedidoRepository {
  constructor(private readonly pool: Pool) {}

  async salvar(pedido: Pedido, statusEsperado?: StatusPedido): Promise<void> {
    if (statusEsperado !== undefined) {
      const resultado = await this.pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 AND status = $3',
        [pedido.status, pedido.id, statusEsperado]);
      if (resultado.rowCount !== 1) {
        throw new ConflitoDeAtualizacao('O pedido foi atualizado por outra requisição. Consulte novamente.');
      }
      return;
    }
    // Um único INSERT grava atomicamente todo o agregado e seu histórico de preços.
    const itens = pedido.itens.map(item => ({
      pizzaId: item.pizzaId, nome: item.nome, tamanho: item.tamanho,
      precoCentavos: item.precoUnitario.centavos, quantidade: item.quantidade,
    }));
    await this.pool.query('INSERT INTO pedidos (id, cliente_id, itens, atendimento, status) VALUES ($1, $2, $3, $4, $5)',
      [pedido.id, pedido.clienteId, JSON.stringify(itens), JSON.stringify(pedido.atendimento), pedido.status]);
  }

  async buscarPorId(id: string): Promise<Pedido | undefined> {
    const { rows } = await this.pool.query<PedidoRow>('SELECT * FROM pedidos WHERE id = $1', [id]);
    const row = rows[0];
    if (!row) return undefined;
    const itens = row.itens.map(item => new ItemPedido(item.pizzaId, item.nome, item.tamanho,
      Dinheiro.deCentavos(item.precoCentavos), item.quantidade));
    let atendimento: Atendimento = { tipo: 'retirada' };
    if (row.atendimento.tipo === 'entrega') {
      const { rua, numero, bairro, cidade } = row.atendimento.endereco;
      atendimento = { tipo: 'entrega', endereco: new Endereco(rua, numero, bairro, cidade) };
    }
    return Pedido.reconstituir(row.id, row.cliente_id, itens, atendimento, row.status);
  }
}
