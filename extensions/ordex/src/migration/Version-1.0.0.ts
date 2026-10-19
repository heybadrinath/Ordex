export default async function migrate(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS demo_payment (
      operation_key text PRIMARY KEY,
      transaction_id text NOT NULL UNIQUE,
      order_id integer NOT NULL REFERENCES "order"(order_id),
      kind text NOT NULL CHECK (kind IN ('payment','refund')),
      amount_minor bigint NOT NULL CHECK (amount_minor > 0),
      currency text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS customer_return (
      return_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id integer NOT NULL REFERENCES "order"(order_id),
      customer_id integer NOT NULL REFERENCES customer(customer_id),
      request_key text NOT NULL,
      request_hash text NOT NULL,
      status text NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested','approved','received','inspected','refunded','rejected')),
      reason text NOT NULL,
      note text NOT NULL DEFAULT '',
      condition text CHECK (condition IN ('resellable','damaged')),
      inspection_note text,
      refund_minor bigint NOT NULL DEFAULT 0,
      refund_transaction_id text,
      received_at timestamptz,
      inspected_at timestamptz,
      refunded_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(customer_id, request_key)
    );
    CREATE TABLE IF NOT EXISTS customer_return_item (
      return_id uuid NOT NULL REFERENCES customer_return(return_id),
      order_item_id integer NOT NULL REFERENCES order_item(order_item_id),
      qty integer NOT NULL CHECK (qty > 0),
      amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
      PRIMARY KEY (return_id, order_item_id)
    );
    CREATE TABLE IF NOT EXISTS return_activity (
      activity_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      return_id uuid NOT NULL REFERENCES customer_return(return_id),
      actor text NOT NULL,
      message text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS customer_return_order_idx ON customer_return(order_id);
  `);
}
