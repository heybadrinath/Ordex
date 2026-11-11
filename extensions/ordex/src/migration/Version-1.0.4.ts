export default async function migrate(db) {
  await db.query(`ALTER TABLE support_message ADD COLUMN message_seq bigint GENERATED ALWAYS AS IDENTITY;
    CREATE INDEX support_message_sequence_idx ON support_message(case_id,message_seq);`);
}
