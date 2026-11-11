import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeAuditEvent,
  isMainAuditEvent
} from '../extensions/ordex/dist/components/auditPresentation.js';

test('audit presents the original policy decision and exact amount', () => {
  const view = describeAuditEvent({
    event: 'policy.checked',
    data: {
      kind: 'refund',
      result: 'approval_required',
      amountMinor: 59000,
      limitMinor: 50000,
      currency: 'INR',
      checks: { withinLimit: false, received: true }
    },
    action: { currentState: 'succeeded' }
  });
  assert.equal(view.tone, 'attention');
  assert.ok(
    view.facts.some(
      (f) => f.label === 'Decision' && f.value === 'Seller approval required'
    )
  );
  assert.ok(
    view.facts.some((f) => f.label === 'Item amount' && f.value === '₹590.00')
  );
  assert.equal(view.checks.withinLimit, false);
});

test('audit distinguishes private notes from customer messages', () => {
  const view = describeAuditEvent({
    event: 'message.saved',
    actor: 'seller',
    message: { body: 'Inspect the returned item first.', internal: true }
  });
  assert.equal(view.title, 'Private note for the agent');
  assert.match(view.description, /Only the seller and agent/);
  assert.equal(view.message.body, 'Inspect the returned item first.');
});

test('main activity hides routine worker chatter but keeps actions and failures', () => {
  for (const event of [
    'run.started',
    'run.finished',
    'model.started',
    'model.completed'
  ])
    assert.equal(isMainAuditEvent({ event }), false);
  for (const event of [
    'decision.selected',
    'policy.checked',
    'refund.verified',
    'action.blocked',
    'run.failed',
    'model.failed'
  ])
    assert.equal(isMainAuditEvent({ event }), true);
  const view = describeAuditEvent({
    event: 'run.finished',
    data: {
      status: 'AWAITING_CUSTOMER',
      nextAction: 'Tell us the return reason.'
    }
  });
  assert.equal(view.description, 'Tell us the return reason.');
});
