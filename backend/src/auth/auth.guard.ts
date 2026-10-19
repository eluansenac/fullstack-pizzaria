import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PERFIS } from './perfis.decorator.js';
import { IS_PUBLIC } from './public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const req = context.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Token ausente.');

    try {
      req.usuario = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const perfis = this.reflector.getAllAndOverride<string[]>(PERFIS, [context.getHandler(), context.getClass()]);
    if (perfis && !perfis.includes(req.usuario.perfil)) throw new ForbiddenException('Sem permissão.');
    return true;
  }
}
