import { audit, fail, pool, transaction } from './db.js';

export const modelName = process.env.SUPPORT_MODEL || 'gemini-3.5-flash-lite';
export const limits = {
  daily: 360,
  minute: 12,
  perCase: 40,
  inputChars: 40000,
  inputTokensMinute: 20000,
  outputTokens: 2200
};

export async function modelJson(
  purpose,
  instruction,
  input,
  schema,
  caseId = null
) {
  if (!process.env.GEMINI_API_KEY)
    fail('Model access is not configured. Your work is saved.', 503);
  const prompt = JSON.stringify(input);
  if (prompt.length > limits.inputChars)
    fail('This request exceeds the context limit.', 413);
  const reservedTokens = Math.ceil((prompt.length + instruction.length) / 2);
  const lock = await pool.connect();
  let callId;
  const started = Date.now();
  try {
    const acquired = (
      await lock.query('SELECT pg_try_advisory_lock(8241025) AS acquired')
    ).rows[0].acquired;
    if (!acquired) fail('The agent is busy. Your work is queued.', 429);
    callId = await transaction(async (db) => {
      const usage = (
        await db.query(
          `SELECT count(*)::integer AS daily,
        count(*) FILTER(WHERE created_at>now()-interval '1 minute')::integer AS minute,
        coalesce(sum(greatest(reserved_input_tokens,coalesce(input_tokens,0))) FILTER(WHERE created_at>now()-interval '1 minute'),0)::integer AS tokens
        FROM support_model_call WHERE (created_at AT TIME ZONE 'America/Los_Angeles')::date=
        (now() AT TIME ZONE 'America/Los_Angeles')::date AND model=$1`,
          [modelName]
        )
      ).rows[0];
      if (
        usage.daily >= limits.daily ||
        usage.minute >= limits.minute ||
        usage.tokens + reservedTokens > limits.inputTokensMinute
      )
        fail(
          'The model allowance is resting. Your work is saved for retry.',
          429
        );
      if (caseId) {
        const c = (
          await db.query(
            'SELECT model_calls FROM support_case WHERE case_id=$1',
            [caseId]
          )
        ).rows[0];
        if (!c || c.model_calls >= limits.perCase)
          fail(
            'This case needs seller review after reaching its agent allowance.',
            422
          );
        await db.query(
          'UPDATE support_case SET model_calls=model_calls+1 WHERE case_id=$1',
          [caseId]
        );
      }
      const call = (
        await db.query(
          `INSERT INTO support_model_call(case_id,purpose,model,reserved_input_tokens) VALUES($1,$2,$3,$4) RETURNING call_id`,
          [caseId, purpose, modelName, reservedTokens]
        )
      ).rows[0];
      await audit(
        db,
        caseId,
        'agent',
        'model.started',
        `Model request: ${purpose}.`,
        { model: modelName, callId: call.call_id }
      );
      return call.call_id;
    });
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!
        },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          model: modelName,
          store: false,
          system_instruction: instruction,
          input: prompt,
          generation_config: {
            max_output_tokens: limits.outputTokens,
            thinking_level: 'minimal',
            thinking_summaries: 'none'
          },
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema
          }
        })
      }
    );
    if (!response.ok) {
      const retry = Number(response.headers.get('retry-after'));
      throw Object.assign(
        new Error(
          response.status === 429
            ? 'Model rate limit reached. Your work is saved.'
            : 'The model could not respond. Your work is saved.'
        ),
        {
          status: response.status === 429 ? 429 : 503,
          retryAfter:
            Number.isFinite(retry) && retry > 0 ? Math.min(3600, retry) : 60
        }
      );
    }
    const body = await response.json();
    const output = (body.steps || [])
      .filter((s) => s.type === 'model_output')
      .flatMap((s) => s.content || [])
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
    const parsed = JSON.parse(output);
    const usage = body.usage || {};
    await transaction(async (db) => {
      await db.query(
        `UPDATE support_model_call SET state='completed',input_tokens=$2,output_tokens=$3,
        reasoning_tokens=$4,duration_ms=$5 WHERE call_id=$1`,
        [
          callId,
          usage.total_input_tokens || 0,
          usage.total_output_tokens || 0,
          usage.total_thought_tokens || 0,
          Date.now() - started
        ]
      );
      await audit(
        db,
        caseId,
        'agent',
        'model.completed',
        `Model response received: ${purpose}.`,
        {
          callId,
          model: modelName,
          inputTokens: usage.total_input_tokens || 0,
          outputTokens: usage.total_output_tokens || 0,
          durationMs: Date.now() - started
        }
      );
    });
    return parsed;
  } catch (error) {
    if (callId)
      await transaction(async (db) => {
        await db.query(
          "UPDATE support_model_call SET state='failed',duration_ms=$2 WHERE call_id=$1",
          [callId, Date.now() - started]
        );
        await audit(
          db,
          caseId,
          'agent',
          'model.failed',
          'Model request failed; no action was authorized by this response.',
          { callId, status: Number(error.status) || 503 }
        );
      });
    if (error.status) throw error;
    fail('The model response could not be used. Your work is saved.', 503);
  } finally {
    await lock.query('SELECT pg_advisory_unlock(8241025)');
    lock.release();
  }
}
