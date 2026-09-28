import 'dotenv/config';
import { criarServidor } from './app.js';
import { porta } from './infrastructure/database/database.service.js';

const app = await criarServidor();
try {
  await app.listen(porta(process.env.PORT, 3000), '0.0.0.0');
} catch (erro) {
  await app.close();
  throw erro;
}
