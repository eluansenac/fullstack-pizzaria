import { Module } from '@nestjs/common';
import { CategoriaController } from './categoria.controller.js';
import { CategoriaService } from './categoria.service.js';

@Module({
  controllers: [CategoriaController],
  providers: [CategoriaService],
})
export class CategoriaModule {}
