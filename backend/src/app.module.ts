import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CategoriaModule } from './categorias/categoria.module.js';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [AuthModule, PrismaModule, CategoriaModule],
  controllers: [HealthController],
})
export class AppModule {}
