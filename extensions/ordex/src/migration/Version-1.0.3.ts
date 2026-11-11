export default async function migrate(db) {
  await db.query(`
    CREATE TABLE support_policy (
      policy_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      settings jsonb NOT NULL, actor text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE support_state (
      id integer PRIMARY KEY CHECK(id=1),
      policy_id bigint NOT NULL REFERENCES support_policy,
      paused boolean NOT NULL DEFAULT false,
      generation integer NOT NULL DEFAULT 1,
      heartbeat_at timestamptz
    );
    INSERT INTO support_policy(settings,actor) VALUES
    ('{"returnWindowDays":7,"autoAuthorize":true,"autoRefund":true,"autoRefundMinor":100000,"autoReasons":["Arrived damaged","Wrong item"],"refundReasons":["Arrived damaged","Wrong item","Not as expected","Changed my mind","Other"],"returnInstructions":"After approval, send the selected items to Ordex Demo Returns, 24 Sample Lane, Bengaluru 560001. This is a synthetic demo address. Keep your return reference with the parcel. No real shipment is required."}', 'Initial demo policy');
    INSERT INTO support_state(id,policy_id) SELECT 1,policy_id FROM support_policy ORDER BY policy_id DESC LIMIT 1;
    CREATE TABLE support_case (
      case_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id integer NOT NULL UNIQUE REFERENCES "order",
      customer_id integer NOT NULL REFERENCES customer,
      status text NOT NULL DEFAULT 'OPEN',
      controller text NOT NULL DEFAULT 'agent' CHECK(controller IN ('agent','seller')),
      revision integer NOT NULL DEFAULT 1,
      queued boolean NOT NULL DEFAULT true,
      lease_id uuid, lease_until timestamptz,
      due_at timestamptz NOT NULL DEFAULT now(),
      failures integer NOT NULL DEFAULT 0,
      model_calls integer NOT NULL DEFAULT 0,
      next_action text NOT NULL DEFAULT 'Tell us what you need help with.',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX support_due_idx ON support_case(due_at) WHERE controller='agent';
    CREATE TABLE support_message (
      message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id uuid NOT NULL REFERENCES support_case,
      client_key text NOT NULL,
      actor text NOT NULL CHECK(actor IN ('customer','seller','agent','system')),
      body text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(case_id,client_key)
    );
    CREATE TABLE support_action (
      action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id uuid NOT NULL REFERENCES support_case,
      kind text NOT NULL CHECK(kind IN ('return','authorize','refund')),
      payload jsonb NOT NULL, payload_hash text NOT NULL,
      policy_id bigint NOT NULL REFERENCES support_policy,
      state text NOT NULL DEFAULT 'proposed',
      consent_at timestamptz,
      return_id uuid REFERENCES customer_return,
      result jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(case_id,kind,payload_hash,policy_id)
    );
    CREATE TABLE support_approval (
      approval_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      action_id uuid NOT NULL REFERENCES support_action,
      payload_hash text NOT NULL,
      policy_id bigint NOT NULL REFERENCES support_policy,
      actor text NOT NULL, decision text NOT NULL CHECK(decision IN ('approved','rejected')),
      expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE support_run (
      run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id uuid NOT NULL REFERENCES support_case,
      state text NOT NULL DEFAULT 'running',
      revision integer NOT NULL,
      started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
    );
    CREATE TABLE support_audit (
      audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      case_id uuid REFERENCES support_case,
      run_id uuid REFERENCES support_run,
      actor text NOT NULL, event text NOT NULL, summary text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX support_audit_case_idx ON support_audit(case_id,audit_id DESC);
    CREATE TABLE support_model_call (
      call_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id uuid REFERENCES support_case,
      purpose text NOT NULL, model text NOT NULL,
      state text NOT NULL DEFAULT 'reserved',
      input_tokens integer NOT NULL DEFAULT 0,
      output_tokens integer NOT NULL DEFAULT 0,
      reasoning_tokens integer NOT NULL DEFAULT 0,
      duration_ms integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX support_model_time_idx ON support_model_call(created_at);
    CREATE TABLE support_knowledge (
      document_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL, body text NOT NULL,
      audience text NOT NULL CHECK(audience IN ('public','internal')),
      format text NOT NULL DEFAULT 'text',
      revision integer NOT NULL DEFAULT 1,
      parent_id uuid REFERENCES support_knowledge,
      state text NOT NULL DEFAULT 'queued',
      analysis jsonb NOT NULL DEFAULT '{}',
      answers jsonb NOT NULL DEFAULT '{}',
      lease_until timestamptz,
      actor text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      published_at timestamptz
    );
    CREATE TABLE support_chunk (
      chunk_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES support_knowledge,
      location text NOT NULL, body text NOT NULL,
      search tsvector GENERATED ALWAYS AS (to_tsvector('english',body)) STORED
    );
    CREATE INDEX support_chunk_search_idx ON support_chunk USING gin(search);
  `);
}
