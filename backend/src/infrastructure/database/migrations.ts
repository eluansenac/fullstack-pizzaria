// Migrações aplicadas uma única vez, em transação, durante a inicialização.
export const migrations = [{
  version: 1,
  sql: `
    CREATE TABLE clientes (
      id uuid PRIMARY KEY,
      nome text NOT NULL,
      telefone text NOT NULL
    );
    CREATE TABLE pizzas (
      id uuid PRIMARY KEY,
      nome text NOT NULL,
      tamanho text NOT NULL CHECK (tamanho IN ('pequena', 'media', 'grande')),
      preco_centavos bigint NOT NULL CHECK (preco_centavos > 0 AND preco_centavos <= 9007199254740991),
      disponivel boolean NOT NULL DEFAULT true
    );
    CREATE TABLE pedidos (
      id uuid PRIMARY KEY,
      cliente_id uuid NOT NULL REFERENCES clientes(id),
      itens jsonb NOT NULL CHECK (jsonb_typeof(itens) = 'array' AND jsonb_array_length(itens) > 0),
      atendimento jsonb NOT NULL,
      status text NOT NULL CHECK (status IN ('recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado')),
      criado_em timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX pedidos_cliente_id_idx ON pedidos(cliente_id);
  `,
}];
