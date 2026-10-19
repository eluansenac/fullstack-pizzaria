import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { LoginDto, RegistrarDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('registrar')
  registrar(@Body() dados: RegistrarDto) {
    return this.auth.registrar(dados);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dados: LoginDto) {
    return this.auth.login(dados);
  }

  @Get('me')
  me(@Req() req: { usuario: { sub: string; perfil: string } }) {
    return req.usuario;
  }
}
