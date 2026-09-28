import 'dotenv/config';
import { criarServidor } from './app.js';

function porta(valor: string | undefined, padrao: number): number {
  const numero = Number(valor ?? padrao);
  if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
    throw new Error('A porta deve ser um inteiro entre 1 e 65535.');
  }
  return numero;
}

const app = await criarServidor();
try {
  await app.listen(porta(process.env.PORT, 3000), '0.0.0.0');
} catch (erro) {
  await app.close();
  throw erro;
}
