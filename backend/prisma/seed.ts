import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categorias = ['Pizzas salgadas', 'Pizzas doces', 'Bebidas', 'Sobremesas'];

for (const nome of categorias) {
  await prisma.categoria.upsert({ where: { nome }, create: { nome }, update: {} });
}

console.log(`Categorias cadastradas: ${categorias.join(', ')}`);
await prisma.$disconnect();
