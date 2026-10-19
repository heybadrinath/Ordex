export default async function migrate(connection) {
  await connection.query(
    "ALTER TABLE customer_return ADD COLUMN IF NOT EXISTS request_hash text NOT NULL DEFAULT ''"
  );
}
