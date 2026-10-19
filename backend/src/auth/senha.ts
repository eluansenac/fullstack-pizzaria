import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function gerarHash(senha: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(senha, sal, 64).toString('hex')}`;
}

export function conferirSenha(senha: string, hash: string): boolean {
  const [sal, chave] = hash.split(':');
  if (!sal || !chave) return false;
  const esperado = Buffer.from(chave, 'hex');
  return timingSafeEqual(scryptSync(senha, sal, esperado.length), esperado);
}
