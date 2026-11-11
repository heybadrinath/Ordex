import { createHash, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool } from '@evershop/evershop/lib/postgres';

export { pool, randomUUID };
export const fail = (message: string, status = 400): never => {
  throw Object.assign(new Error(message), { status });
};
export function text(value, max = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    fail(`Enter text between 1 and ${max.toLocaleString()} characters.`);
  return value.trim();
}
export function uuid(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value)
  )
    fail('Record not found.', 404);
  return value;
}
const canonical = (value) =>
  value instanceof Date
    ? value.toISOString()
    : Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
    ? Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, canonical(value[key])])
      )
    : value;
export const hash = (value) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');

export async function transaction(work) {
  const db = (await pool.connect()) as PoolClient & { INTRANSACTION: boolean };
  try {
    await db.query('BEGIN');
    db.INTRANSACTION = true;
    await db.query(
      "SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '8s'"
    );
    // Serialize support commits for this single-store demo; use per-store locks if expanded.
    await db.query('SELECT pg_advisory_xact_lock(8241024)');
    const result = await work(db);
    await db.query('COMMIT');
    return result;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.INTRANSACTION = false;
    db.release();
  }
}
export async function audit(
  db,
  caseId,
  actor,
  event,
  summary,
  data = {},
  runId = null
) {
  await db.query(
    `INSERT INTO support_audit(case_id,run_id,actor,event,summary,data)
    VALUES($1,$2,$3,$4,$5,$6)`,
    [caseId, runId, actor, event, summary, data]
  );
  // Deliberately exclude messages, prompts, credentials and provider response bodies.
  console.info(JSON.stringify({ service: 'support', event, caseId, runId }));
}
export async function policy(db = pool) {
  return (
    await db.query(`SELECT p.*,s.paused,s.generation FROM support_state s
    JOIN support_policy p USING(policy_id) WHERE s.id=1`)
  ).rows[0];
}
export async function message(
  db,
  caseId,
  actor,
  body,
  key: string = randomUUID(),
  metadata = {}
) {
  const saved = (
    await db.query(
      `INSERT INTO support_message(case_id,client_key,actor,body,metadata)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(case_id,client_key) DO NOTHING RETURNING *`,
      [caseId, key, actor, body, metadata]
    )
  ).rows[0];
  if (saved)
    await audit(
      db,
      caseId,
      actor,
      'message.saved',
      'Message saved to the case.',
      { messageId: saved.message_id }
    );
  return saved;
}
export async function schedule(db, caseId, status, next, delay = 0) {
  await db.query(
    `UPDATE support_case SET status=$2,next_action=$3,queued=$4,
    due_at=now()+$5*interval '1 second',updated_at=now() WHERE case_id=$1`,
    [caseId, status, next, delay === 0, delay]
  );
}
export async function ownedCase(db, caseId, customerId?) {
  const row = (
    await db.query(
      `SELECT c.*,o.uuid AS order_uuid,o.order_number,o.currency
    FROM support_case c JOIN "order" o USING(order_id) WHERE case_id=$1
    AND ($2::integer IS NULL OR c.customer_id=$2)`,
      [uuid(caseId), customerId ?? null]
    )
  ).rows[0];
  if (!row) fail('Case not found.', 404);
  return row;
}
