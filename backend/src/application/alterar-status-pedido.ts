import type { Pedido, StatusPedido } from '../domain/pedidos/pedido.js';
import type { PedidoRepository } from '../domain/pedidos/pedido-repository.js';
import { ConsultarPedido } from './consultar-pedido.js';

export class AlterarStatusPedido {
  constructor(private readonly pedidos: PedidoRepository) {}

  async executar(id: string, status: StatusPedido): Promise<Pedido> {
    const pedido = await new ConsultarPedido(this.pedidos).executar(id);
    const atualizado = pedido.alterarStatus(status);
    await this.pedidos.salvar(atualizado, pedido.status);
    return atualizado;
  }
}
