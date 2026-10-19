import { PrismaClient } from '@prisma/client';

import { gerarHash } from '../src/auth/senha.js';

const prisma = new PrismaClient();

const categorias = ['Pizzas salgadas', 'Pizzas doces', 'Bebidas', 'Sobremesas'];

for (const nome of categorias) {
  await prisma.categoria.upsert({ where: { nome }, create: { nome }, update: {} });
}

const email = (process.env.ADMIN_EMAIL ?? 'admin@pizzaria.com').toLowerCase();
const senha = process.env.ADMIN_PASSWORD ?? 'admin123';
await prisma.usuario.upsert({
  where: { email },
  create: { nome: 'Administrador', email, senhaHash: gerarHash(senha), perfil: 'ADMIN' },
  update: {},
});

console.log(`Admin: ${email}`);
console.log(`Categorias cadastradas: ${categorias.join(', ')}`);
await prisma.$disconnect();
