import assert from 'node:assert/strict';
import test from 'node:test';
import { isReturnPolicyQuestion } from '../extensions/ordex/src/services/support/intent.js';
import { interactionOutput } from '../extensions/ordex/src/services/support/modelResponse.js';

test('routes a clear return-window question through the current store policy', () => {
  assert.equal(
    isReturnPolicyQuestion(
      'What is the return window for this order, and what steps should I follow if I decide to return it?'
    ),
    true
  );
  assert.equal(
    isReturnPolicyQuestion('Please start a return for the damaged mug.'),
    false
  );
});

test('reads completed structured output from interaction steps or output_text', () => {
  assert.deepEqual(
    interactionOutput({
      status: 'completed',
      steps: [
        {
          type: 'model_output',
          content: [{ type: 'text', text: '{"ok":true}' }]
        }
      ]
    }),
    { ok: true }
  );
  assert.deepEqual(
    interactionOutput({ status: 'completed', output_text: '{"ok":true}' }),
    { ok: true }
  );
});

test('distinguishes failed interactions and malformed output', () => {
  assert.throws(
    () => interactionOutput({ status: 'failed' }),
    (error) => error.retryable && error.providerCode === 'interaction_incomplete'
  );
  assert.throws(
    () => interactionOutput({ status: 'incomplete' }),
    (error) => !error.retryable
  );
  assert.throws(
    () =>
      interactionOutput({ status: 'completed', output_text: 'not JSON' }),
    (error) => error.providerCode === 'invalid_json_output'
  );
});
