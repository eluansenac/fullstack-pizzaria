import { textoObrigatorio } from '../shared/erro-de-dominio.js';

export class Endereco {
  readonly rua: string;
  readonly numero: string;
  readonly bairro: string;
  readonly cidade: string;

  constructor(rua: string, numero: string, bairro: string, cidade: string) {
    this.rua = textoObrigatorio(rua, 'Rua');
    this.numero = textoObrigatorio(numero, 'Número');
    this.bairro = textoObrigatorio(bairro, 'Bairro');
    this.cidade = textoObrigatorio(cidade, 'Cidade');
    Object.freeze(this);
  }

  equals(outro: Endereco): boolean {
    return this.rua === outro.rua && this.numero === outro.numero &&
      this.bairro === outro.bairro && this.cidade === outro.cidade;
  }
}
