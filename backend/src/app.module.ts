import { Module } from '@nestjs/common';
import { criarPizzaria } from './composition-root.js';
import { DatabaseService } from './infrastructure/database/database.service.js';
import { ClienteRepositoryPostgres, PedidoRepositoryPostgres, PizzaRepositoryPostgres } from './infrastructure/repositories/postgres.js';
import { PIZZARIA, PizzariaController } from './http/pizzaria.controller.js';

@Module({
  controllers: [PizzariaController],
  providers: [DatabaseService, {
    provide: PIZZARIA,
    inject: [DatabaseService],
    useFactory: (database: DatabaseService) => criarPizzaria({
      clientes: new ClienteRepositoryPostgres(database.pool),
      pizzas: new PizzaRepositoryPostgres(database.pool),
      pedidos: new PedidoRepositoryPostgres(database.pool),
    }),
  }],
})
export class AppModule {}
