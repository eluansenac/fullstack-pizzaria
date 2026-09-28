import { ErroDeDominio, textoObrigatorio } from '../shared/erro-de-dominio.js';

export class Cliente {
  readonly id: string;
  readonly nome: string;
  readonly telefone: string;

  constructor(id: string, nome: string, telefone: string) {
    this.id = textoObrigatorio(id, 'Identificador do cliente');
    this.nome = textoObrigatorio(nome, 'Nome');
    this.telefone = textoObrigatorio(telefone, 'Telefone');
    if (!/^\+?[\d\s()-]+$/.test(this.telefone) ||
        !/^\d{10,13}$/.test(this.telefone.replace(/\D/g, ''))) {
      throw new ErroDeDominio('Informe um telefone válido com DDD.');
    }
    Object.freeze(this);
  }
}
