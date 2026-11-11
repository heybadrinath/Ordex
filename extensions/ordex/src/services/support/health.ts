import { pool } from './db.js';
import { limits, modelName } from './model.js';

export async function supportHealth() {
  const [calls, last, queue, outcomes] = await Promise.all([
    pool.query(
      `SELECT count(*)::integer AS requests,
       count(*) FILTER(WHERE state='failed')::integer AS failures,
       coalesce(sum(input_tokens),0)::bigint AS input_tokens,
       coalesce(sum(output_tokens),0)::bigint AS output_tokens
       FROM support_model_call WHERE model=$1 AND
       (created_at AT TIME ZONE 'America/Los_Angeles')::date=
       (now() AT TIME ZONE 'America/Los_Angeles')::date`, [modelName]
    ),
    pool.query(
      `SELECT state,created_at,duration_ms FROM support_model_call
       WHERE model=$1 ORDER BY created_at DESC LIMIT 1`, [modelName]
    ),
    pool.query(
      `SELECT count(*) FILTER(WHERE controller='agent' AND queued AND status<>'RESOLVED')::integer AS queued,
       count(*) FILTER(WHERE status<>'RESOLVED' AND (controller='seller' OR status='AWAITING_SELLER'))::integer AS needs_seller,
       count(*) FILTER(WHERE controller='agent' AND queued AND due_at<now()-interval '90 seconds'
         AND (lease_until IS NULL OR lease_until<now()))::integer AS overdue
       FROM support_case WHERE next_action<>'Local verification fixture completed.'`
    ),
    pool.query(
      `SELECT count(*) FILTER(WHERE a.kind='return')::integer AS returns,
       count(*) FILTER(WHERE a.kind='refund')::integer AS refunds,
       count(*) FILTER(WHERE a.kind='cancel')::integer AS cancellations
       FROM support_action a JOIN support_case c USING(case_id)
       WHERE a.state='succeeded' AND c.next_action<>'Local verification fixture completed.'`
    )
  ]);
  return {
    modelConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: modelName,
    lastCall: last.rows[0] || null,
    usage: calls.rows[0],
    remainingRequests: Math.max(0, limits.daily - calls.rows[0].requests),
    queue: queue.rows[0],
    outcomes: outcomes.rows[0]
  };
}
