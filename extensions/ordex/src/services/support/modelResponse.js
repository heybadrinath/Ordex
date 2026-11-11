export function interactionOutput(body) {
  if (body?.status !== 'completed') {
    const error = new Error('The model did not complete the request.');
    Object.assign(error, {
      status: 502,
      providerStatus: body?.status || 'unknown',
      providerCode: 'interaction_incomplete',
      retryable: body?.status !== 'incomplete'
    });
    throw error;
  }
  const output =
    body.output_text ||
    (body.steps || [])
      .filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');
  if (!output) {
    const error = new Error('The model returned no usable text.');
    Object.assign(error, {
      status: 502,
      providerStatus: 'completed',
      providerCode: 'empty_model_output',
      retryable: false
    });
    throw error;
  }
  try {
    return JSON.parse(output);
  } catch {
    const error = new Error('The model returned invalid structured output.');
    Object.assign(error, {
      status: 502,
      providerStatus: 'completed',
      providerCode: 'invalid_json_output',
      retryable: false
    });
    throw error;
  }
}
