export function protect(req) {
  if (req.method === 'GET') return;
  const origin = req.get('origin');
  const expected = new URL(
    process.env.EVERSHOP_HOME_URL || `${req.protocol}://${req.get('host')}`
  ).origin;
  if (
    req.get('sec-fetch-site') === 'cross-site' ||
    (origin && origin !== expected)
  )
    throw Object.assign(new Error('This request must come from the store.'), {
      status: 403
    });
  if (!req.is('application/json'))
    throw Object.assign(new Error('Use a JSON request.'), { status: 415 });
}
export function supportError(res, error) {
  const status = Number(error.status) || 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: {
      message:
        status === 500
          ? 'Support could not complete this request. Your saved work is safe.'
          : error.message
    }
  });
  if (status === 500)
    console.error(
      JSON.stringify({
        service: 'support',
        event: 'api.error',
        code: String(error.code || 'unknown')
      })
    );
}
