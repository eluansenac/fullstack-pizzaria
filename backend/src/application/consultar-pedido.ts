import type { Pedido } from '../domain/pedidos/pedido.js';
import type { PedidoRepository } from '../domain/pedidos/pedido-repository.js';
import { RecursoNaoEncontrado } from '../domain/shared/erro-de-dominio.js';

export class ConsultarPedido {
  constructor(private readonly pedidos: PedidoRepository) {}

  async executar(id: string): Promise<Pedido> {
    const pedido = await this.pedidos.buscarPorId(id);
    if (!pedido) throw new RecursoNaoEncontrado('Pedido não encontrado.');
    return pedido;
  }
}
