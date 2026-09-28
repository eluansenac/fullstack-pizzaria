import type { Pedido, StatusPedido } from './pedido.js';

export interface PedidoRepository {
  salvar(pedido: Pedido, statusEsperado?: StatusPedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | undefined>;
}
