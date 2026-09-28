import { randomUUID } from 'node:crypto';
import type { ClienteRepository } from './domain/clientes/cliente-repository.js';
import type { PizzaRepository } from './domain/cardapio/pizza-repository.js';
import type { PedidoRepository } from './domain/pedidos/pedido-repository.js';
import { CadastrarCliente } from './application/cadastrar-cliente.js';
import { CadastrarPizza } from './application/cadastrar-pizza.js';
import { RealizarPedido } from './application/realizar-pedido.js';
import { ConsultarPedido } from './application/consultar-pedido.js';
import { AlterarStatusPedido } from './application/alterar-status-pedido.js';
import {
  ClienteRepositoryEmMemoria,
  PizzaRepositoryEmMemoria,
  PedidoRepositoryEmMemoria,
} from './infrastructure/repositories/em-memoria.js';

// Único lugar que escolhe implementações concretas e conecta as dependências.
export function criarPizzaria(repositorios?: {
  clientes: ClienteRepository; pizzas: PizzaRepository; pedidos: PedidoRepository;
}) {
  const clientes = repositorios?.clientes ?? new ClienteRepositoryEmMemoria();
  const pizzas = repositorios?.pizzas ?? new PizzaRepositoryEmMemoria();
  const pedidos = repositorios?.pedidos ?? new PedidoRepositoryEmMemoria();

  return {
    cadastrarCliente: new CadastrarCliente(clientes, randomUUID),
    cadastrarPizza: new CadastrarPizza(pizzas, randomUUID),
    realizarPedido: new RealizarPedido(clientes, pizzas, pedidos, randomUUID),
    consultarPedido: new ConsultarPedido(pedidos),
    alterarStatusPedido: new AlterarStatusPedido(pedidos),
  };
}
