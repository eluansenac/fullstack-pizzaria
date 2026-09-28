import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarCategoriaDto } from './categoria.dto.js';

@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dados: CriarCategoriaDto) {
    try {
      return await this.prisma.categoria.create({ data: dados });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }
      throw erro;
    }
  }

  listar() {
    return this.prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  }

  async buscarPorId(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoria não encontrada.');
    return categoria;
  }

  async remover(id: string): Promise<void> {
    await this.buscarPorId(id);
    await this.prisma.categoria.delete({ where: { id } });
  }
}
