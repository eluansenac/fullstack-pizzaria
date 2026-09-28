import type { Pizza } from './pizza.js';

export interface PizzaRepository {
  salvar(pizza: Pizza): Promise<void>;
  buscarPorId(id: string): Promise<Pizza | undefined>;
}
