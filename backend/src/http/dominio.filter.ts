import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { ConflitoDeAtualizacao, ErroDeDominio, RecursoNaoEncontrado } from '../domain/shared/erro-de-dominio.js';

@Catch(ErroDeDominio)
export class DominioFilter implements ExceptionFilter {
  catch(erro: ErroDeDominio, host: ArgumentsHost): void {
    const statusCode = erro instanceof ConflitoDeAtualizacao ? 409 : erro instanceof RecursoNaoEncontrado ? 404 : 400;
    host.switchToHttp().getResponse().status(statusCode).json({ statusCode, message: erro.message });
  }
}
