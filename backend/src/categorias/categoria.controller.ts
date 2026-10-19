import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Perfis } from '../auth/perfis.decorator.js';
import { CriarCategoriaDto } from './categoria.dto.js';
import { CategoriaService } from './categoria.service.js';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categorias: CategoriaService) {}

  @Perfis('ADMIN')
  @Post()
  criar(@Body() dados: CriarCategoriaDto) {
    return this.categorias.criar(dados);
  }

  @Get()
  listar() {
    return this.categorias.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categorias.buscarPorId(id);
  }

  @Perfis('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  async remover(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.categorias.remover(id);
  }
}
