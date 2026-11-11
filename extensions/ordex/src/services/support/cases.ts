import {
  audit,
  fail,
  hash,
  message,
  ownedCase,
  policy,
  pool,
  schedule,
  text,
  transaction,
  uuid
} from './db.js';
import { reasons } from '../returns.js';
import { limits, modelName } from './model.js';
import { deliveryContext } from './deliveryContext.js';
import { supportHealth } from './health.js';

// Customer responses are an explicit view, not a copy of the worker record.
function customerCase(c) {
  return {
    case_id: c.case_id,
    order_uuid: c.order_uuid,
    order_number: c.order_number,
    currency: c.currency,
    status: c.status,
    controller: c.controller,
    next_action: c.next_action,
    created_at: c.created_at,
    updated_at: c.updated_at,
    ...(Object.hasOwn(c, 'last_message') ? { last_message: c.last_message } : {})
  };
}

export async function orderContext(db, c) {
  const order = (
    await db.query(
      `SELECT order_id,uuid,order_number,currency,payment_method,payment_status,shipment_status,
    grand_total,status,created_at, (SELECT max(delivered_at) FROM shipment WHERE shipment_order_id=o.order_id) AS delivered_at
    FROM "order" o WHERE order_id=$1 AND customer_id=$2`,
      [c.order_id, c.customer_id]
    )
  ).rows[0];
  if (!order) fail('Order not found.', 404);
  order.items = (
    await db.query(
      `SELECT i.order_item_id AS id,i.product_name AS name,i.product_sku AS sku,i.qty,
    i.line_total_with_discount_incl_tax AS total,i.thumbnail,
    i.qty-coalesce((SELECT sum(ri.qty) FROM customer_return_item ri JOIN customer_return r USING(return_id)
      WHERE ri.order_item_id=i.order_item_id AND r.status<>'rejected'),0) AS remaining_qty
    FROM order_item i WHERE order_item_order_id=$1 ORDER BY order_item_id`,
      [order.order_id]
    )
  ).rows;
  return order;
}

export async function detail(caseId, customerId?, before?) {
  if (before && !/^\d{1,19}$/.test(String(before)))
    fail('Invalid message cursor.');
  const c = await ownedCase(pool, caseId, customerId);
  const [order, messages, actions, returns, events] = await Promise.all([
    orderContext(pool, c),
    pool.query(
      `SELECT * FROM (SELECT * FROM support_message WHERE case_id=$1 AND message_seq<$2::bigint
       AND ($3::integer IS NULL OR (coalesce(metadata->>'internal','false')<>'true' AND coalesce(metadata->>'handback','false')<>'true'))
       ORDER BY message_seq DESC LIMIT 100) recent ORDER BY message_seq`,
      [c.case_id, before || '9223372036854775807', customerId ?? null]
    ),
    pool.query(
      `SELECT a.*,(SELECT row_to_json(ap) FROM support_approval ap WHERE ap.action_id=a.action_id ORDER BY created_at DESC LIMIT 1) AS approval,
      (SELECT data FROM support_audit e WHERE e.case_id=a.case_id AND e.event='policy.checked' AND e.data->>'actionId'=a.action_id::text ORDER BY audit_id DESC LIMIT 1) AS review
      FROM support_action a WHERE case_id=$1 ORDER BY created_at`,
      [c.case_id]
    ),
    pool.query(
      `SELECT r.*, (SELECT jsonb_agg(jsonb_build_object('id',i.order_item_id,'name',i.product_name,'qty',ri.qty,'amountMinor',ri.amount_minor))
      FROM customer_return_item ri JOIN order_item i USING(order_item_id) WHERE ri.return_id=r.return_id) AS items
      FROM customer_return r WHERE order_id=$1 ORDER BY created_at`,
      [c.order_id]
    ),
    pool.query(
      `SELECT audit_id,event,summary,created_at FROM support_audit WHERE case_id=$1 AND event IN
      ('case.opened','action.confirmed','return.created','return.authorized','refund.verified','control.seller','control.agent','approval.granted','case.resolved','case.reopened','cancellation.verified','delivery.investigated','delivery.escalated')
      ORDER BY audit_id DESC LIMIT 40`,
      [c.case_id]
    )
  ]);
  const delivery = await deliveryContext(pool, order);
  const latestRequest = (
    await pool.query(
      "SELECT body FROM support_message WHERE case_id=$1 AND actor='customer' ORDER BY message_seq DESC LIMIT 1",
      [c.case_id]
    )
  ).rows[0]?.body;
  const pending = actions.rows.find(
    (a) => a.state === 'awaiting_approval' || a.state === 'blocked'
  );
  const completed = actions.rows
    .filter((a) => a.state === 'succeeded')
    .map((a) =>
      a.kind === 'cancel'
        ? 'Order canceled; payment reversal verified.'
        : a.kind === 'refund'
        ? 'Item refund verified in payment ledger.'
        : a.kind === 'authorize'
        ? 'Return authorized.'
        : 'Return request saved.'
    );
  const facts = [
    `Order #${order.order_number}: ${
      delivery.canceled
        ? 'canceled'
        : delivery.delivered
        ? 'delivered'
        : delivery.dispatched
        ? 'dispatched'
        : 'awaiting dispatch'
    }.`,
    delivery.latest
      ? `Latest courier evidence: ${delivery.latest.kind.replaceAll(
          '_',
          ' '
        )} — ${delivery.latest.note.slice(0, 180)}`
      : 'No courier scan recorded.',
    delivery.watch && !delivery.canceled
      ? `Delivery target: ${new Date(delivery.watch.expected_at).toLocaleString(
          'en-IN',
          { timeZone: 'Asia/Kolkata' }
        )} IST (estimate).`
      : ''
  ]
    .filter(Boolean)
    .join(' ');
  return {
    case: customerId == null ? c : customerCase(c),
    delivery,
    hasEarlier: messages.rows.length === 100,
    ...(customerId == null
      ? {
          brief: {
            request:
              latestRequest?.slice(0, 400) ||
              'Proactive delivery check; no customer request yet.',
            facts,
            completed: [...new Set(completed)],
            blocked: pending
              ? `${
                  pending.kind === 'cancel'
                    ? 'Order cancellation'
                    : pending.kind
                } ${
                  pending.state === 'blocked'
                    ? 'was declined or blocked'
                    : 'needs exact approval'
                }.`
              : c.next_action,
            decision:
              pending?.state === 'awaiting_approval'
                ? `Approve or decline ${
                    pending.kind
                  } of ${new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: order.currency
                  }).format(
                    pending.payload.refundMinor / 100
                  )} for the listed items.`
                : delivery.risk
                ? 'Confirm the dispatch or recovery plan, then record the new courier evidence.'
                : c.controller === 'seller'
                ? 'Reply to the customer or hand back with clear instructions.'
                : c.next_action
          }
        }
      : {}),
    order,
    messages: messages.rows.filter(
      (m) =>
        customerId == null || !(m.metadata?.internal || m.metadata?.handback)
    ),
    actions:
      customerId == null
        ? actions.rows
        : actions.rows
            .filter(
              (a) =>
                a.state === 'proposed' &&
                (a.kind === 'return' ||
                  a.kind === 'refund' ||
                  a.kind === 'cancel')
            )
            .map(({ action_id, kind, state, payload, payload_hash }) => ({
              action_id,
              kind,
              state,
              payload,
              payload_hash
            })),
    returns: returns.rows,
    timeline: events.rows
  };
}
export async function listCases(customerId?) {
  const rows = (
    await pool.query(
      `SELECT c.*,o.order_number,o.uuid AS order_uuid,o.currency,o.customer_full_name,
    (SELECT body FROM support_message m WHERE m.case_id=c.case_id
      AND ($1::integer IS NULL OR (coalesce(m.metadata->>'internal','false')<>'true'
        AND coalesce(m.metadata->>'handback','false')<>'true'))
      ORDER BY message_seq DESC LIMIT 1) AS last_message,
    (SELECT count(*) FROM support_action a WHERE a.case_id=c.case_id AND a.state='awaiting_approval')::integer AS approvals
    FROM support_case c JOIN "order" o USING(order_id)
    WHERE ($1::integer IS NULL OR c.customer_id=$1)
    ORDER BY (c.next_action='Local verification fixture completed.') ASC,c.updated_at DESC LIMIT 100`,
      [customerId ?? null]
    )
  ).rows;
  return customerId == null ? rows : rows.map(customerCase);
}

async function lockCase(db, id, customerId?) {
  const c = await ownedCase(db, id, customerId);
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
    `shipment:${c.order_id}`
  ]);
  await db.query('SELECT order_id FROM "order" WHERE order_id=$1 FOR UPDATE', [
    c.order_id
  ]);
  return c;
}
export async function customerCommand(customerId, input) {
  return transaction(async (db) => {
    if (input.command === 'open') {
      const o = (
        await db.query(
          'SELECT order_id FROM "order" WHERE uuid=$1 AND customer_id=$2',
          [uuid(input.orderId), customerId]
        )
      ).rows[0];
      if (!o) fail('Order not found.', 404);
      const inserted = (
        await db.query(
          `INSERT INTO support_case(order_id,customer_id,queued,status) VALUES($1,$2,false,'AWAITING_CUSTOMER')
        ON CONFLICT(order_id) DO NOTHING RETURNING *`,
          [o.order_id, customerId]
        )
      ).rows[0];
      const c =
        inserted ||
        (
          await db.query('SELECT * FROM support_case WHERE order_id=$1', [
            o.order_id
          ])
        ).rows[0];
      if (inserted) {
        await message(
          db,
          c.case_id,
          'agent',
          'Hi! I can help with this order, delivery, returns and refunds. What would you like to sort out?',
          'welcome'
        );
        await audit(
          db,
          c.case_id,
          'customer',
          'case.opened',
          'Support case opened.'
        );
      }
      return { caseId: c.case_id };
    }
    const c = await lockCase(db, input.caseId, customerId);
    if (input.command === 'message') {
      const body = text(input.body, 2000),
        key = text(input.clientKey, 100);
      const saved = (
        await db.query(
          'SELECT body,actor FROM support_message WHERE case_id=$1 AND client_key=$2',
          [c.case_id, key]
        )
      ).rows[0];
      if (saved) {
        if (saved.actor !== 'customer' || saved.body !== body)
          fail('This message identifier already belongs to different text.', 409);
        return { caseId: c.case_id };
      }
      const count = (
        await db.query(
          "SELECT count(*)::int AS n FROM support_message WHERE case_id=$1 AND actor='customer' AND created_at>now()-interval '1 minute'",
          [c.case_id]
        )
      ).rows[0].n;
      if (count >= 10)
        fail('Please wait a moment before sending another message.', 429);
      const inserted = await message(db, c.case_id, 'customer', body, key);
      if (inserted) {
        await db.query(
          'UPDATE support_case SET revision=revision+1,failures=0 WHERE case_id=$1',
          [c.case_id]
        );
        await schedule(
          db,
          c.case_id,
          c.controller === 'seller' ? 'AWAITING_SELLER' : 'OPEN',
          c.controller === 'seller'
            ? 'Your seller will reply here.'
            : 'Reviewing your message.'
        );
        await audit(
          db,
          c.case_id,
          'customer',
          c.status === 'RESOLVED' ? 'case.reopened' : 'message.received',
          c.status === 'RESOLVED'
            ? 'Customer asked for more help.'
            : 'Customer message received.',
          { messageId: inserted.message_id }
        );
      }
    } else if (input.command === 'person') {
      await db.query(
        "UPDATE support_case SET controller='seller',revision=revision+1,queued=false,status='AWAITING_SELLER',next_action='Your seller will reply here.',updated_at=now() WHERE case_id=$1",
        [c.case_id]
      );
      await message(
        db,
        c.case_id,
        'system',
        'Your seller has been asked to join. The agent is paused until they hand this case back.'
      );
      await audit(
        db,
        c.case_id,
        'customer',
        'control.seller',
        'Customer requested a person.'
      );
    } else if (input.command === 'confirm') {
      const a = (
        await db.query(
          'SELECT * FROM support_action WHERE action_id=$1 AND case_id=$2',
          [uuid(input.actionId), c.case_id]
        )
      ).rows[0];
      if (!a || a.payload_hash !== input.hash)
        fail('This confirmation no longer matches the action.', 409);
      if (a.state === 'succeeded' || a.consent_at) return { caseId: c.case_id };
      const p = await policy(db);
      if (a.policy_id !== p.policy_id)
        fail('The policy changed. Request a fresh action.', 409);
      if (a.state !== 'proposed')
        fail('This action cannot be confirmed now.', 409);
      await db.query(
        "UPDATE support_action SET consent_at=now(),state='confirmed',updated_at=now() WHERE action_id=$1",
        [a.action_id]
      );
      await audit(
        db,
        c.case_id,
        'customer',
        'action.confirmed',
        a.kind === 'cancel'
          ? 'Customer confirmed the full cancellation and remaining payment reversal.'
          : 'Customer confirmed the exact items and conditional refund.',
        {
          actionId: a.action_id,
          hash: a.payload_hash,
          amountMinor: a.payload.refundMinor
        }
      );
      await db.query(
        'UPDATE support_case SET revision=revision+1,failures=0 WHERE case_id=$1',
        [c.case_id]
      );
      await schedule(
        db,
        c.case_id,
        'OPEN',
        c.controller === 'seller'
          ? 'Confirmed. Waiting for your seller to hand back.'
          : 'Your confirmation is saved.'
      );
    } else fail('Unknown support action.');
    return { caseId: c.case_id };
  });
}

export function validateSettings(input) {
  if (
    typeof input.autoAuthorize !== 'boolean' ||
    typeof input.autoRefund !== 'boolean'
  )
    fail('Choose the automatic action settings.');
  if (
    !Number.isSafeInteger(input.autoRefundMinor) ||
    input.autoRefundMinor < 0 ||
    input.autoRefundMinor > 100000000
  )
    fail('Enter a valid refund limit.');
  if (
    !Number.isSafeInteger(input.returnWindowDays) ||
    input.returnWindowDays < 1 ||
    input.returnWindowDays > 365
  )
    fail('Return window must be between 1 and 365 days.');
  for (const key of ['autoReasons', 'refundReasons'])
    if (
      !Array.isArray(input[key]) ||
      input[key].some((r) => !reasons.includes(r))
    )
      fail('Choose supported return reasons.');
  return {
    autoAuthorize: input.autoAuthorize,
    autoRefund: input.autoRefund,
    autoRefundMinor: input.autoRefundMinor,
    returnWindowDays: input.returnWindowDays,
    autoReasons: [...new Set(input.autoReasons)],
    refundReasons: [...new Set(input.refundReasons)],
    returnInstructions: text(input.returnInstructions, 1500)
  };
}
export async function adminCommand(actor, input) {
  return transaction(async (db) => {
    if (input.command === 'policy') {
      const current = await policy(db);
      if (input.version !== current.policy_id)
        fail('Another policy was published. Reload before changing it.', 409);
      const settings = validateSettings(input.settings);
      const row = (
        await db.query(
          'INSERT INTO support_policy(settings,actor) VALUES($1,$2) RETURNING *',
          [settings, actor]
        )
      ).rows[0];
      await db.query('UPDATE support_state SET policy_id=$1 WHERE id=1', [
        row.policy_id
      ]);
      await db.query(
        "UPDATE support_action SET state='superseded' WHERE state<>'succeeded' AND state<>'blocked'"
      );
      await db.query(
        "UPDATE support_case SET queued=true,due_at=now(),revision=revision+1 WHERE status<>'RESOLVED'"
      );
      await audit(
        db,
        null,
        actor,
        'policy.published',
        'New permissions published; pending actions require fresh validation.',
        { policyId: row.policy_id, settings }
      );
      return row;
    }
    if (input.command === 'stop') {
      if (typeof input.paused !== 'boolean') fail('Choose pause or resume.');
      await db.query('UPDATE support_state SET paused=$1 WHERE id=1', [
        input.paused
      ]);
      await db.query(
        "UPDATE support_case SET revision=revision+1,due_at=now() WHERE status<>'RESOLVED'"
      );
      await audit(
        db,
        null,
        actor,
        input.paused ? 'agent.paused' : 'agent.resumed',
        input.paused
          ? 'All new automated replies and actions paused.'
          : 'Agent processing resumed.'
      );
      return { paused: input.paused };
    }
    const c = await lockCase(db, input.caseId);
    if (input.command === 'takeover') {
      await db.query(
        "UPDATE support_case SET controller='seller',revision=revision+1,queued=false,status='AWAITING_SELLER',next_action='Your seller is looking into this.',updated_at=now() WHERE case_id=$1",
        [c.case_id]
      );
      await audit(
        db,
        c.case_id,
        actor,
        'control.seller',
        'Seller took over; automated replies and actions paused.'
      );
    } else if (input.command === 'reply') {
      if (c.controller !== 'seller')
        fail('Take over this case before replying.', 409);
      const reply = await message(
        db,
        c.case_id,
        'seller',
        text(input.body, 2000),
        text(input.clientKey, 100)
      );
      await audit(
        db,
        c.case_id,
        actor,
        'message.seller',
        'Seller replied to the customer.',
        { messageId: reply?.message_id }
      );
    } else if (input.command === 'handback' || input.command === 'retry') {
      if (input.command === 'handback') {
        const note = await message(
          db,
          c.case_id,
          'seller',
          text(input.body, 2000),
          undefined,
          { handback: true, internal: true }
        );
        await audit(
          db,
          c.case_id,
          actor,
          'control.agent',
          'Seller handed the case back with context.',
          { messageId: note?.message_id }
        );
      } else if (c.controller !== 'agent')
        fail('Hand back the case before retrying.', 409);
      if (input.command === 'retry')
        await audit(
          db,
          c.case_id,
          actor,
          'review.retried',
          'Seller requested another review of the saved case.',
          { previousStatus: c.status, failures: c.failures }
        );
      await db.query(
        "UPDATE support_case SET controller='agent',revision=revision+1,failures=0 WHERE case_id=$1",
        [c.case_id]
      );
      await schedule(
        db,
        c.case_id,
        'OPEN',
        'The agent is reviewing current evidence.'
      );
    } else if (input.command === 'approve' || input.command === 'reject') {
      const a = (
        await db.query(
          "SELECT * FROM support_action WHERE action_id=$1 AND case_id=$2 AND state='awaiting_approval'",
          [uuid(input.actionId), c.case_id]
        )
      ).rows[0];
      if (!a || a.payload_hash !== input.hash)
        fail('This approval is stale or already handled.', 409);
      const p = await policy(db);
      if (p.policy_id !== a.policy_id)
        fail('Policy changed. Review a fresh decision.', 409);
      await db.query(
        `INSERT INTO support_approval(action_id,payload_hash,policy_id,actor,decision) VALUES($1,$2,$3,$4,$5)`,
        [
          a.action_id,
          a.payload_hash,
          a.policy_id,
          actor,
          input.command === 'approve' ? 'approved' : 'rejected'
        ]
      );
      if (input.command === 'reject')
        await db.query(
          "UPDATE support_action SET state='blocked' WHERE action_id=$1",
          [a.action_id]
        );
      await audit(
        db,
        c.case_id,
        actor,
        input.command === 'approve' ? 'approval.granted' : 'approval.rejected',
        input.command === 'approve'
          ? 'Exact action approved for 15 minutes.'
          : 'Seller declined this action.',
        {
          actionId: a.action_id,
          hash: a.payload_hash,
          amountMinor: a.payload.refundMinor
        }
      );
      if (input.handback === true) {
        await db.query(
          "UPDATE support_case SET controller='agent',revision=revision+1 WHERE case_id=$1",
          [c.case_id]
        );
        await audit(
          db,
          c.case_id,
          actor,
          'control.agent',
          'Seller approved and explicitly handed back.'
        );
      }
      const withSeller = c.controller === 'seller' && !input.handback;
      await schedule(
        db,
        c.case_id,
        withSeller ? 'AWAITING_SELLER' : 'OPEN',
        withSeller
          ? input.command === 'approve'
            ? 'Approved. Seller still controls this case.'
            : 'Declined. Seller still controls this case.'
          : 'Reviewing the seller decision.'
      );
    } else fail('Unknown seller action.');
    await db.query(
      'UPDATE support_case SET updated_at=now() WHERE case_id=$1',
      [c.case_id]
    );
    return { caseId: c.case_id };
  });
}
export async function adminOverview() {
  const [cases, p, health, state] = await Promise.all([
    listCases(),
    policy(),
    supportHealth(),
    pool.query('SELECT heartbeat_at FROM support_state WHERE id=1')
  ]);
  return {
    cases,
    policy: p,
    usage: health.usage,
    health,
    heartbeat: state.rows[0].heartbeat_at,
    limits,
    model: modelName
  };
}
export async function auditPage(caseId?, before?, includeTests = false) {
  if (caseId) uuid(caseId);
  const cursor = before ? String(before) : '9223372036854775807';
  if (!/^\d{1,19}$/.test(cursor)) fail('Invalid audit cursor.');
  return (
    await pool.query(
      `SELECT a.*,r.state AS run_state,o.order_number,o.uuid AS order_uuid,o.customer_full_name,
        CASE WHEN m.message_id IS NOT NULL THEN jsonb_build_object(
          'body',m.body,'actor',m.actor,'internal',coalesce((m.metadata->>'internal')::boolean,false),
          'sources',m.metadata->'sources') END AS message,
        CASE WHEN action.action_id IS NOT NULL THEN jsonb_build_object(
          'id',action.action_id,'kind',action.kind,'payload',action.payload,
          'currentState',action.state,'result',action.result,'policyId',action.policy_id) END AS action,
        CASE WHEN p.policy_id IS NOT NULL THEN jsonb_build_object(
          'version',p.policy_id,'returnWindowDays',p.settings->'returnWindowDays',
          'autoRefundMinor',p.settings->'autoRefundMinor','autoRefund',p.settings->'autoRefund',
          'autoAuthorize',p.settings->'autoAuthorize','autoReasons',p.settings->'autoReasons') END AS policy,
        (SELECT jsonb_agg(jsonb_build_object('title',k.title,'revision',k.revision,'location',ch.location,
          'excerpt',left(ch.body,800))) FROM support_chunk ch JOIN support_knowledge k USING(document_id)
          WHERE ch.chunk_id::text IN (SELECT jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(a.data->'sources')='array' THEN a.data->'sources' ELSE '[]'::jsonb END))) AS sources,
        CASE WHEN r.run_id IS NOT NULL THEN jsonb_build_object(
          'id',r.run_id,'state',r.state,'startedAt',r.started_at,'finishedAt',r.finished_at) END AS run
      FROM (SELECT log.* FROM support_audit log LEFT JOIN support_case scope ON scope.case_id=log.case_id
        WHERE ($1::uuid IS NULL OR log.case_id=$1) AND log.audit_id<$2::bigint
        AND ($3::boolean OR $1::uuid IS NOT NULL OR NOT (
          coalesce(scope.next_action='Local verification fixture completed.',false)
          OR log.actor='Fixture seller' OR coalesce(log.data->>'model'='test-simulation',false)))
        ORDER BY log.audit_id DESC LIMIT 100) a
      LEFT JOIN support_run r USING(run_id)
      LEFT JOIN support_case c ON c.case_id=a.case_id
      LEFT JOIN "order" o ON o.order_id=c.order_id
      LEFT JOIN support_message m ON m.message_id::text=a.data->>'messageId' AND m.case_id=a.case_id
      LEFT JOIN support_action action ON action.action_id::text=a.data->>'actionId' AND action.case_id=a.case_id
      LEFT JOIN support_policy p ON p.policy_id::text=coalesce(a.data->>'policyId',action.policy_id::text)
      ORDER BY a.audit_id DESC`,
      [caseId || null, cursor, includeTests]
    )
  ).rows;
}
