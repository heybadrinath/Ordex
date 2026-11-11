export default async function migrate(db) {
  await db.query(`
    ALTER TABLE support_knowledge
      ADD COLUMN retry_at timestamptz,
      ADD COLUMN attempts integer NOT NULL DEFAULT 0;
    CREATE INDEX support_knowledge_retry_idx
      ON support_knowledge(retry_at) WHERE state='queued';
  `);
}
