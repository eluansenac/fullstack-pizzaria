import { BadRequestException, Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, ServiceUnavailableException } from '@nestjs/common';
import type { criarPizzaria } from '../composition-root.js';
import { DatabaseService } from '../infrastructure/database/database.service.js';
import { AlterarStatusDto, CadastrarClienteDto, CadastrarPizzaDto, RealizarPedidoDto } from './dtos.js';

export const PIZZARIA = Symbol('PIZZARIA');

@Controller()
export class PizzariaController {
  constructor(
    @Inject(PIZZARIA) private readonly pizzaria: ReturnType<typeof criarPizzaria>,
    private readonly database: DatabaseService,
  ) {}

  @Get('health/live')
  live() { return { status: 'ok' }; }

  @Get('health')
  async health() {
    try {
      await this.database.pool.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }

  @Post('clientes')
  cadastrarCliente(@Body() dados: CadastrarClienteDto) {
    return this.pizzaria.cadastrarCliente.executar(dados);
  }

  @Post('pizzas')
  cadastrarPizza(@Body() dados: CadastrarPizzaDto) {
    return this.pizzaria.cadastrarPizza.executar(dados);
  }

  @Post('pedidos')
  realizarPedido(@Body() dados: RealizarPedidoDto) {
    const { tipo, endereco } = dados.atendimento;
    if (tipo === 'entrega' && !endereco) throw new BadRequestException('Endereço é obrigatório para entrega.');
    return this.pizzaria.realizarPedido.executar({
      clienteId: dados.clienteId,
      itens: dados.itens,
      atendimento: tipo === 'entrega' && endereco ? { tipo, endereco } : { tipo: 'retirada' },
    });
  }

  @Get('pedidos/:id')
  consultarPedido(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pizzaria.consultarPedido.executar(id);
  }

  @Patch('pedidos/:id/status')
  alterarStatus(@Param('id', new ParseUUIDPipe()) id: string, @Body() dados: AlterarStatusDto) {
    return this.pizzaria.alterarStatusPedido.executar(id, dados.status);
  }
}
