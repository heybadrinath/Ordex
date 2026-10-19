export default async function migrate(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS demo_email (
    email_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient text NOT NULL,
    subject text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
}
