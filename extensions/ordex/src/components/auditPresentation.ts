type RecordValue = Record<string, any>;
const object = (value: any): RecordValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const words = (value: unknown) =>
  typeof value === 'string' ? value.replaceAll('_', ' ').toLowerCase() : '';
export function auditMoney(value: unknown, currency = 'INR') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Not recorded';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: /^[A-Z]{3}$/.test(currency) ? currency : 'INR'
  }).format(amount / 100);
}
const decisions: Record<string, string> = {
  order_status: 'Check delivery and order status',
  policy: 'Explain the store policy',
  return: 'Prepare a return for confirmation',
  knowledge: 'Answer from store knowledge',
  handoff: 'Ask the seller to take over',
  off_topic: 'Keep the conversation within store support',
  ask_items: 'Ask which items to return',
  ask_reason: 'Ask for the return reason'
};
export const auditCheckLabels: Record<string, string> = {
  received: 'Items received',
  inspected: 'Inspection recorded',
  demoPayment: 'Supported payment',
  supportedCurrency: 'Supported currency',
  reasonAllowed: 'Reason allowed',
  customerConsent: 'Customer confirmed',
  automaticAuthorization: 'Automatic returns enabled',
  automaticRefunds: 'Automatic refunds enabled',
  withinLimit: 'Within automatic refund limit',
  sellerApproved: 'Valid seller approval'
};
export function isMainAuditEvent(event: any) {
  if (
    event.event === 'message.received' ||
    event.event === 'model.started' ||
    event.event === 'model.completed'
  )
    return false;
  if (event.event === 'run.started' || event.event === 'run.finished')
    return false;
  if (event.event === 'reply.sent' && event.data?.messageId) return false;
  return true;
}
export function describeAuditEvent(event: any) {
  const data = object(event.data),
    action = object(event.action),
    payload = object(data.payload || action.payload);
  const message = object(event.message),
    policy = object(event.policy);
  const category = data.category;
  const amount = data.amountMinor ?? payload.refundMinor;
  const facts: { label: string; value: string }[] = [];
  let title = event.summary || 'Activity recorded';
  let description = '';
  let tone = 'neutral';
  if (event.event === 'message.saved') {
    title = message.internal
      ? 'Private note for the agent'
      : {
          customer: 'Customer message',
          agent: 'Reply sent to customer',
          seller: 'Seller reply',
          system: 'Conversation update'
        }[event.actor] || 'Message recorded';
    description = message.internal
      ? 'Only the seller and agent can see this note.'
      : '';
  } else if (
    event.event === 'decision.selected' ||
    event.event === 'reply.sent'
  ) {
    title = decisions[category] || 'Agent selected the next step';
    description =
      event.event === 'decision.selected'
        ? 'Selected from the current order, customer messages and published guidance. Permission checks still apply before an action.'
        : 'The saved reply follows this support decision.';
  } else if (event.event === 'evidence.loaded') {
    title = 'Checked order, delivery and store guidance';
    description =
      'Read the customer’s own order and retrieved relevant published sources.';
  } else if (event.event === 'policy.checked') {
    title =
      data.kind === 'authorize'
        ? 'Checked permission to authorize the return'
        : 'Checked permission to issue the refund';
    tone = data.result === 'allowed' ? 'success' : 'attention';
    facts.push({
      label: 'Decision',
      value: data.result === 'allowed' ? 'Allowed' : 'Seller approval required'
    });
  } else if (event.event === 'action.proposed') {
    title = 'Asked the customer to confirm a return';
    description =
      'Prepared the exact items and conditional item refund. Nothing is returned or refunded at this step.';
  } else if (event.event === 'action.confirmed') {
    title = 'Customer confirmed the proposed action';
    description =
      'The confirmed items and amount can now pass through the remaining policy checks.';
  } else if (event.event === 'approval.requested') {
    title = 'Paused for the seller’s approval';
    tone = 'attention';
    description =
      'The agent cannot execute this action until the seller approves these exact details.';
  } else if (event.event === 'approval.granted') {
    title = 'Seller approved the exact action';
    tone = 'success';
    description =
      'Approval is valid for 15 minutes. Seller-controlled conversations still require an explicit handback.';
  } else if (
    event.event === 'approval.rejected' ||
    event.event === 'action.blocked'
  ) {
    title =
      event.event === 'approval.rejected'
        ? 'Seller declined the action'
        : 'Blocked an ineligible refund';
    tone = 'attention';
    description = 'No refund was issued by this event.';
  } else if (event.event === 'return.created') {
    title = 'Created the confirmed return request';
    tone = 'success';
    description =
      'Saved the return in the order system. Refund and restocking are separate steps.';
  } else if (event.event === 'return.authorized') {
    title = 'Authorized the return';
    tone = 'success';
    description =
      'The customer can send the items. Physical receipt and inspection are still required.';
  } else if (event.event === 'refund.verified') {
    title = 'Issued and verified the demo refund';
    tone = 'success';
    description =
      'Matched the saved payment ledger reference, currency and amount before reporting completion.';
  } else if (event.event === 'receipt.saved') {
    title = 'Shared the verified refund receipt';
    tone = 'success';
    description = 'The receipt is saved in the customer conversation.';
  } else if (event.event === 'run.started') {
    title = 'Started an agent review';
    description =
      'The worker claimed this case and will continue from its saved state.';
  } else if (event.event === 'run.finished') {
    title = 'Agent review finished';
    description =
      data.nextAction ||
      'This worker run ended. Completion of a run does not necessarily mean the customer case is resolved.';
  } else if (event.event === 'run.failed' || event.event === 'model.failed') {
    title =
      event.event === 'model.failed'
        ? 'The model could not complete its response'
        : 'Agent review stopped safely';
    tone = 'attention';
    description =
      'Saved work is retained. Check the next step before retrying.';
  } else if (event.event === 'run.superseded') {
    title = 'Stopped an outdated review';
    description = 'A newer message, policy or seller action took precedence.';
  } else if (
    event.event === 'model.started' ||
    event.event === 'model.completed'
  ) {
    title =
      event.event === 'model.started'
        ? 'Requested a model decision'
        : 'Received a model decision';
    description =
      'The model proposes the next step. Backend checks control every action.';
  } else if (event.event === 'review.retried') {
    title = 'Seller retried the agent review';
    description =
      'Requeued the saved case. Completed operations must be reconciled before any further action.';
  } else if (event.event === 'control.agent') {
    title = 'Seller handed the conversation back';
    description =
      'The agent can continue using the latest order state and the seller’s instructions.';
  } else if (event.event === 'control.seller') {
    title = 'Conversation passed to the seller';
    tone = 'attention';
    description =
      'Automated replies and actions are paused until the seller hands it back.';
  }
  const order = object(data.order);
  if (order.shipmentStatus)
    facts.push({
      label: 'Delivery at review',
      value: words(order.shipmentStatus)
    });
  if (order.paymentStatus)
    facts.push({
      label: 'Payment at review',
      value: words(order.paymentStatus)
    });
  if (amount != null)
    facts.push({
      label: 'Item amount',
      value: auditMoney(amount, payload.currency || data.currency || 'INR')
    });
  if (data.limitMinor != null)
    facts.push({
      label: 'Automatic limit',
      value: auditMoney(data.limitMinor, data.currency)
    });
  if (data.committedMinor != null)
    facts.push({
      label: 'Already committed',
      value: auditMoney(data.committedMinor, data.currency)
    });
  if (data.policyId || policy.version)
    facts.push({
      label: 'Policy',
      value: `v${data.policyId || policy.version}`
    });
  if (data.reference)
    facts.push({ label: 'Receipt', value: String(data.reference) });
  if (data.status && !/^\d+$/.test(String(data.status)))
    facts.push({ label: 'Saved state', value: words(data.status) });
  if (data.durationMs != null)
    facts.push({
      label: 'Model time',
      value: `${(Number(data.durationMs) / 1000).toFixed(1)}s`
    });
  if (data.inputTokens != null)
    facts.push({
      label: 'Tokens',
      value: `${data.inputTokens} input · ${data.outputTokens || 0} output`
    });
  return {
    title,
    description,
    tone,
    facts,
    message,
    payload,
    policy,
    checks: object(data.checks),
    sources: Array.isArray(event.sources) ? event.sources : []
  };
}
