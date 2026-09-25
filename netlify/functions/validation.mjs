const MAX_BODY_BYTES = 64 * 1024;

function reply(status, body) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export default async function validation(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST', 'Cache-Control': 'no-store' }
    });
  }

  const endpoint = process.env.ARWT_VALIDATION_ENDPOINT;
  let upstreamUrl;
  try {
    upstreamUrl = new URL(endpoint);
    if (upstreamUrl.protocol !== 'https:' || upstreamUrl.hostname !== 'script.google.com' || !upstreamUrl.pathname.endsWith('/exec')) {
      throw new Error('Invalid endpoint');
    }
  } catch {
    return reply(503, { ok: false, error: 'Validation storage is not configured.' });
  }

  let body;
  try {
    body = await request.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'Request too large.' });
    const envelope = JSON.parse(body);
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw new Error('Invalid envelope');
  } catch {
    return reply(400, { ok: false, error: 'Invalid request body.' });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) return reply(502, { ok: false, error: 'Validation storage rejected the request.' });
    const acknowledgement = await upstream.json();
    if (acknowledgement?.ok !== true) return reply(502, { ok: false, error: 'Validation storage rejected the request.' });
    return reply(200, { ok: true });
  } catch {
    return reply(502, { ok: false, error: 'Validation storage is temporarily unavailable.' });
  }
}
