import type { TamanhoPizza } from '../cardapio/pizza.js';
import { Dinheiro } from '../shared/dinheiro.js';
import { ErroDeDominio, textoObrigatorio } from '../shared/erro-de-dominio.js';

// Snapshot do produto: alterações no cardápio não mudam pedidos existentes.
export class ItemPedido {
  readonly pizzaId: string;
  readonly nome: string;
  readonly subtotal: Dinheiro;

  constructor(
    pizzaId: string,
    nome: string,
    readonly tamanho: TamanhoPizza,
    readonly precoUnitario: Dinheiro,
    readonly quantidade: number,
  ) {
    this.pizzaId = textoObrigatorio(pizzaId, 'Identificador da pizza');
    this.nome = textoObrigatorio(nome, 'Nome da pizza');
    if (!['pequena', 'media', 'grande'].includes(tamanho) || precoUnitario.centavos === 0) {
      throw new ErroDeDominio('O item deve ter tamanho válido e preço positivo.');
    }
    this.subtotal = precoUnitario.multiplicar(quantidade);
    Object.freeze(this);
  }
}
