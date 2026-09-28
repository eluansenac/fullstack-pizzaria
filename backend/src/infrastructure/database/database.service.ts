import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { migrations } from './migrations.js';

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor?.trim()) throw new Error(`A variável ${nome} é obrigatória.`);
  return valor;
}

export function porta(valor: string | undefined, padrao: number): number {
  const numero = Number(valor ?? padrao);
  if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
    throw new Error('A porta deve ser um inteiro entre 1 e 65535.');
  }
  return numero;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    host: obrigatoria('POSTGRES_HOST'),
    port: porta(process.env.POSTGRES_PORT, 5432),
    database: obrigatoria('POSTGRES_DB'),
    user: obrigatoria('POSTGRES_USER'),
    password: obrigatoria('POSTGRES_PASSWORD'),
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });

  constructor() {
    this.pool.on('error', (erro) => new Logger(DatabaseService.name).error(erro.message));
  }

  async onModuleInit(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Serializa migrações quando mais de uma instância inicia ao mesmo tempo.
      await client.query('SELECT pg_advisory_xact_lock(734821)');
      await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY)');
      for (const migration of migrations) {
        const existente = await client.query('SELECT version FROM schema_migrations WHERE version = $1', [migration.version]);
        if (existente.rowCount === 0) {
          await client.query(migration.sql);
          await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [migration.version]);
        }
      }
      await client.query('COMMIT');
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
