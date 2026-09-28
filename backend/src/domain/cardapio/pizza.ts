import { Dinheiro } from '../shared/dinheiro.js';
import { ErroDeDominio, textoObrigatorio } from '../shared/erro-de-dominio.js';

export type TamanhoPizza = 'pequena' | 'media' | 'grande';

// Cada combinação de sabor e tamanho é uma entrada do cardápio.
export class Pizza {
  readonly id: string;
  readonly nome: string;

  constructor(
    id: string,
    nome: string,
    readonly tamanho: TamanhoPizza,
    readonly preco: Dinheiro,
    readonly disponivel = true,
  ) {
    this.id = textoObrigatorio(id, 'Identificador da pizza');
    this.nome = textoObrigatorio(nome, 'Nome da pizza');
    if (!['pequena', 'media', 'grande'].includes(tamanho)) {
      throw new ErroDeDominio('Tamanho de pizza inválido.');
    }
    if (preco.centavos === 0) {
      throw new ErroDeDominio('O preço da pizza deve ser maior que zero.');
    }
    Object.freeze(this);
  }

  alterarPreco(preco: Dinheiro): Pizza {
    return new Pizza(this.id, this.nome, this.tamanho, preco, this.disponivel);
  }

  alterarDisponibilidade(disponivel: boolean): Pizza {
    return new Pizza(this.id, this.nome, this.tamanho, this.preco, disponivel);
  }
}
