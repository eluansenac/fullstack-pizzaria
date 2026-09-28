import { criarPizzaria } from './composition-root.js';

const pizzaria = criarPizzaria();
const cliente = await pizzaria.cadastrarCliente.executar({ nome: 'Maria Silva', telefone: '(11) 99999-1234' });
const pizza = await pizzaria.cadastrarPizza.executar({
  nome: 'Margherita', tamanho: 'grande', precoCentavos: 4590,
});
const pedido = await pizzaria.realizarPedido.executar({
  clienteId: cliente.id,
  itens: [{ pizzaId: pizza.id, quantidade: 2 }],
  atendimento: {
    tipo: 'entrega',
    endereco: { rua: 'Rua das Flores', numero: '123', bairro: 'Centro', cidade: 'São Paulo' },
  },
});

await pizzaria.alterarStatusPedido.executar(pedido.id, 'em_preparo');
await pizzaria.alterarStatusPedido.executar(pedido.id, 'pronto');
await pizzaria.alterarStatusPedido.executar(pedido.id, 'entregue');
const resultado = await pizzaria.consultarPedido.executar(pedido.id);

console.log('Pedido da pizzaria:', JSON.stringify({
  id: resultado.id,
  cliente: cliente.nome,
  status: resultado.status,
  itens: resultado.itens.map(item => ({
    pizza: item.nome, tamanho: item.tamanho, quantidade: item.quantidade,
    subtotalCentavos: item.subtotal.centavos,
  })),
  total: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.total.centavos / 100),
  atendimento: resultado.atendimento,
}, null, 2));

