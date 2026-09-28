import { Cliente } from '../domain/clientes/cliente.js';
import type { ClienteRepository } from '../domain/clientes/cliente-repository.js';
import type { GeradorId } from './gerador-id.js';

export class CadastrarCliente {
  constructor(private readonly clientes: ClienteRepository, private readonly gerarId: GeradorId) {}

  async executar(dados: { nome: string; telefone: string }): Promise<Cliente> {
    const cliente = new Cliente(this.gerarId(), dados.nome, dados.telefone);
    await this.clientes.salvar(cliente);
    return cliente;
  }
}
