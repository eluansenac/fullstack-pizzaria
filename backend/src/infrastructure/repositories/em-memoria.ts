import type { Cliente } from '../../domain/clientes/cliente.js';
import type { ClienteRepository } from '../../domain/clientes/cliente-repository.js';
import type { Pizza } from '../../domain/cardapio/pizza.js';
import type { PizzaRepository } from '../../domain/cardapio/pizza-repository.js';
import type { Pedido, StatusPedido } from '../../domain/pedidos/pedido.js';
import { ConflitoDeAtualizacao } from '../../domain/shared/erro-de-dominio.js';
import type { PedidoRepository } from '../../domain/pedidos/pedido-repository.js';

// Compartilhar referências é seguro aqui porque os agregados são imutáveis.
class RepositorioEmMemoria<T extends { readonly id: string }> {
  protected readonly registros = new Map<string, T>();

  async salvar(entidade: T): Promise<void> {
    this.registros.set(entidade.id, entidade);
  }

  async buscarPorId(id: string): Promise<T | undefined> {
    return this.registros.get(id);
  }
}

export class ClienteRepositoryEmMemoria extends RepositorioEmMemoria<Cliente> implements ClienteRepository {}
export class PizzaRepositoryEmMemoria extends RepositorioEmMemoria<Pizza> implements PizzaRepository {}
export class PedidoRepositoryEmMemoria extends RepositorioEmMemoria<Pedido> implements PedidoRepository {
  override async salvar(pedido: Pedido, statusEsperado?: StatusPedido): Promise<void> {
    if (statusEsperado !== undefined && this.registros.get(pedido.id)?.status !== statusEsperado) {
      throw new ConflitoDeAtualizacao('O pedido foi atualizado por outra requisição. Consulte novamente.');
    }
    this.registros.set(pedido.id, pedido);
  }
}
