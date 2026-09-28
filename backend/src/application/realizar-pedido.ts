import type { ClienteRepository } from '../domain/clientes/cliente-repository.js';
import type { PizzaRepository } from '../domain/cardapio/pizza-repository.js';
import { Endereco } from '../domain/pedidos/endereco.js';
import { ItemPedido } from '../domain/pedidos/item-pedido.js';
import { Pedido, type Atendimento } from '../domain/pedidos/pedido.js';
import type { PedidoRepository } from '../domain/pedidos/pedido-repository.js';
import { ErroDeDominio } from '../domain/shared/erro-de-dominio.js';
import type { GeradorId } from './gerador-id.js';

export interface RealizarPedidoEntrada {
  clienteId: string;
  itens: readonly { pizzaId: string; quantidade: number }[];
  atendimento:
    | { tipo: 'retirada' }
    | { tipo: 'entrega'; endereco: { rua: string; numero: string; bairro: string; cidade: string } };
}

export class RealizarPedido {
  constructor(
    private readonly clientes: ClienteRepository,
    private readonly pizzas: PizzaRepository,
    private readonly pedidos: PedidoRepository,
    private readonly gerarId: GeradorId,
  ) {}

  async executar(entrada: RealizarPedidoEntrada): Promise<Pedido> {
    const cliente = await this.clientes.buscarPorId(entrada.clienteId);
    if (!cliente) throw new ErroDeDominio('Cliente não encontrado.');

    const itens: ItemPedido[] = [];
    for (const item of entrada.itens) {
      const pizza = await this.pizzas.buscarPorId(item.pizzaId);
      if (!pizza) throw new ErroDeDominio('Pizza não encontrada.');
      if (!pizza.disponivel) throw new ErroDeDominio(`A pizza ${pizza.nome} está indisponível.`);
      // O preço vem do cardápio, nunca de quem solicita o pedido.
      itens.push(new ItemPedido(pizza.id, pizza.nome, pizza.tamanho, pizza.preco, item.quantidade));
    }

    let atendimento: Atendimento;
    if (entrada.atendimento.tipo === 'entrega') {
      const endereco = entrada.atendimento.endereco;
      if (!endereco) throw new ErroDeDominio('Pedidos para entrega precisam de endereço.');
      atendimento = {
        tipo: 'entrega',
        endereco: new Endereco(endereco.rua, endereco.numero, endereco.bairro, endereco.cidade),
      };
    } else if (entrada.atendimento.tipo === 'retirada') {
      atendimento = { tipo: 'retirada' };
    } else {
      throw new ErroDeDominio('Tipo de atendimento inválido.');
    }

    const pedido = Pedido.criar(this.gerarId(), cliente.id, itens, atendimento);
    await this.pedidos.salvar(pedido);
    return pedido;
  }
}
