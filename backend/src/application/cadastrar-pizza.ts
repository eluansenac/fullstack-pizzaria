import { Pizza, type TamanhoPizza } from '../domain/cardapio/pizza.js';
import type { PizzaRepository } from '../domain/cardapio/pizza-repository.js';
import { Dinheiro } from '../domain/shared/dinheiro.js';
import type { GeradorId } from './gerador-id.js';

export class CadastrarPizza {
  constructor(private readonly pizzas: PizzaRepository, private readonly gerarId: GeradorId) {}

  async executar(dados: { nome: string; tamanho: TamanhoPizza; precoCentavos: number }): Promise<Pizza> {
    const pizza = new Pizza(this.gerarId(), dados.nome, dados.tamanho, Dinheiro.deCentavos(dados.precoCentavos));
    await this.pizzas.salvar(pizza);
    return pizza;
  }
}
