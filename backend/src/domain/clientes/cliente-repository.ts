import type { Cliente } from './cliente.js';

export interface ClienteRepository {
  salvar(cliente: Cliente): Promise<void>;
  buscarPorId(id: string): Promise<Cliente | undefined>;
}
