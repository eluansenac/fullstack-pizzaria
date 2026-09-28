export class ErroDeDominio extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroDeDominio';
  }
}

export class ConflitoDeAtualizacao extends ErroDeDominio {}
export class RecursoNaoEncontrado extends ErroDeDominio {}

export function textoObrigatorio(valor: string, campo: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErroDeDominio(`${campo} é obrigatório.`);
  }
  return valor.trim();
}
