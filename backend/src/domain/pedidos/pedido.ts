import { Dinheiro } from '../shared/dinheiro.js';
import { ErroDeDominio, textoObrigatorio } from '../shared/erro-de-dominio.js';
import type { Endereco } from './endereco.js';
import type { ItemPedido } from './item-pedido.js';

export type StatusPedido = 'recebido' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
export type Atendimento =
  | { readonly tipo: 'retirada' }
  | { readonly tipo: 'entrega'; readonly endereco: Endereco };

const transicoes: Record<StatusPedido, readonly StatusPedido[]> = {
  recebido: ['em_preparo', 'cancelado'],
  em_preparo: ['pronto'],
  pronto: ['entregue'],
  entregue: [],
  cancelado: [],
};

// Raiz do agregado: mantém itens, total e ciclo de vida consistentes.
// As operações retornam uma nova versão, sem expor estado mutável.
export class Pedido {
  readonly id: string;
  readonly clienteId: string;
  readonly itens: readonly ItemPedido[];
  readonly atendimento: Atendimento;
  readonly total: Dinheiro;

  private constructor(
    id: string,
    clienteId: string,
    itens: readonly ItemPedido[],
    atendimento: Atendimento,
    readonly status: StatusPedido,
  ) {
    this.id = textoObrigatorio(id, 'Identificador do pedido');
    this.clienteId = textoObrigatorio(clienteId, 'Identificador do cliente');
    if (!Object.hasOwn(transicoes, status)) {
      throw new ErroDeDominio('Status de pedido inválido.');
    }
    if (itens.length === 0) {
      throw new ErroDeDominio('Um pedido deve conter pelo menos uma pizza.');
    }
    if (!atendimento || !['entrega', 'retirada'].includes(atendimento.tipo)) {
      throw new ErroDeDominio('Tipo de atendimento inválido.');
    }
    if (atendimento.tipo === 'entrega' && !atendimento.endereco) {
      throw new ErroDeDominio('Pedidos para entrega precisam de endereço.');
    }
    this.itens = Object.freeze([...itens]);
    this.atendimento = Object.freeze({ ...atendimento });
    this.total = this.itens.reduce((total, item) => total.somar(item.subtotal), Dinheiro.deCentavos(0));
    Object.freeze(this);
  }

  static criar(id: string, clienteId: string, itens: readonly ItemPedido[], atendimento: Atendimento): Pedido {
    return new Pedido(id, clienteId, itens, atendimento, 'recebido');
  }

  static reconstituir(id: string, clienteId: string, itens: readonly ItemPedido[], atendimento: Atendimento, status: StatusPedido): Pedido {
    return new Pedido(id, clienteId, itens, atendimento, status);
  }

  alterarStatus(novoStatus: StatusPedido): Pedido {
    if (!transicoes[this.status].includes(novoStatus)) {
      throw new ErroDeDominio(`Não é possível alterar o pedido de ${this.status} para ${novoStatus}.`);
    }
    return new Pedido(this.id, this.clienteId, this.itens, this.atendimento, novoStatus);
  }
}
