import { PrismaClient } from '@prisma/client';

// Exemplo didático de repositório usando o Prisma como ORM, independente do
// restante do backend (que usa o cliente `pg` diretamente). Para usar:
//   1. defina DATABASE_URL no .env (ver .env.example);
//   2. rode `npm run prisma:migrate` para criar a tabela `categorias`;
//   3. rode `npm run prisma:generate` para gerar o cliente do Prisma.
export class CategoriaRepositoryPrisma {
  private readonly prisma = new PrismaClient();

  async criar(nome: string) {
    return this.prisma.categoria.create({ data: { nome } });
  }

  async listar() {
    return this.prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  }

  async buscarPorId(id: string) {
    return this.prisma.categoria.findUnique({ where: { id } });
  }

  async remover(id: string): Promise<void> {
    await this.prisma.categoria.delete({ where: { id } });
  }

  async desconectar(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
