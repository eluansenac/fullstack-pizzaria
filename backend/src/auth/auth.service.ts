import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto, RegistrarDto } from './auth.dto.js';
import { conferirSenha, gerarHash } from './senha.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar({ nome, email, senha }: RegistrarDto) {
    try {
      // Cadastro público sempre cria CLIENTE; ADMIN só via seed.
      const { senhaHash, ...usuario } = await this.prisma.usuario.create({
        data: { nome, email: email.toLowerCase(), senhaHash: gerarHash(senha) },
      });
      return usuario;
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado.');
      }
      throw erro;
    }
  }

  async login({ email, senha }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (!usuario || !conferirSenha(senha, usuario.senhaHash)) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const accessToken = await this.jwt.signAsync({ sub: usuario.id, perfil: usuario.perfil });
    return { accessToken, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } };
  }
}
