import { Module } from '@nestjs/common';
import { CategoriaModule } from './categorias/categoria.module.js';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, CategoriaModule],
  controllers: [HealthController],
})
export class AppModule {}
