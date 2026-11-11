export default async function migrate(db) {
  await db.query(`
    CREATE TABLE order_cancellation (
      order_id integer PRIMARY KEY REFERENCES "order",
      refund_minor bigint NOT NULL CHECK(refund_minor >= 0),
      currency text NOT NULL,
      transaction_id text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE support_action DROP CONSTRAINT support_action_kind_check;
    ALTER TABLE support_action ADD CONSTRAINT support_action_kind_check CHECK(kind IN ('return','authorize','refund','cancel'));
    ALTER TABLE support_case ADD COLUMN summary jsonb NOT NULL DEFAULT '{}';
    ALTER TABLE support_model_call ADD COLUMN reserved_input_tokens integer NOT NULL DEFAULT 0;
    CREATE TABLE support_delivery_watch (
      order_id integer PRIMARY KEY REFERENCES "order",
      dispatch_due_at timestamptz NOT NULL,
      expected_at timestamptz NOT NULL,
      next_check_at timestamptz,
      follow_up_at timestamptz,
      incident_key text,
      evidence_hash text,
      phase text NOT NULL DEFAULT 'watching',
      case_id uuid REFERENCES support_case,
      lease_id uuid,
      lease_until timestamptz,
      failures integer NOT NULL DEFAULT 0,
      revision integer NOT NULL DEFAULT 1,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK(expected_at >= dispatch_due_at)
    );
    CREATE INDEX support_delivery_due_idx ON support_delivery_watch(next_check_at) WHERE next_check_at IS NOT NULL;
    CREATE TABLE support_delivery_event (
      event_id text PRIMARY KEY,
      order_id integer NOT NULL REFERENCES "order",
      kind text NOT NULL CHECK(kind IN ('picked_up','in_transit','exception','delivered')),
      occurred_at timestamptz NOT NULL,
      note text NOT NULL DEFAULT '',
      payload_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX support_delivery_event_order_idx ON support_delivery_event(order_id,occurred_at DESC);
  `);
}
