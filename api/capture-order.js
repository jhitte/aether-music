// Server-side PayPal order capture + verification
// After successful capture, frontend can safely allow download

const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'live').toLowerCase().trim();
const PAYPAL_API = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    const err = new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel (and matching PAYPAL_MODE).');
    err.code = 'NO_CREDENTIALS';
    throw err;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    const envHint = PAYPAL_MODE === 'sandbox' ? ' (sandbox)' : ' (live)';
    const desc = (data && (data.error_description || data.error)) || 'Failed to get PayPal access token';
    const err = new Error(desc + envHint);
    err.code = (data && data.error) || 'AUTH_FAILED';
    err.status = response.status;
    throw err;
  }
  return data.access_token;
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse request body:', e);
    return {};
  }
}

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const body = await parseJsonBody(req);
    const orderID = body.orderID;

    if (!orderID) {
      return res.status(400).json({ error: 'Missing orderID' });
    }

    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (authErr) {
      console.error('PayPal getAccessToken (capture) failed:', authErr.message);
      const isAuthFail = authErr.code === 'AUTH_FAILED' || /client authentication|invalid_client|authentication failed/i.test(authErr.message || '');
      const status = isAuthFail ? 401 : 500;
      return res.status(status).json({
        error: isAuthFail 
          ? 'PayPal client authentication failed during capture (live). Check LIVE credentials and PAYPAL_MODE=live in Vercel.'
          : 'Failed to authenticate with PayPal for capture.',
        hint: 'See Vercel function logs and GO-LIVE-INSTRUCTIONS.md'
      });
    }

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json();

    if (!response.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return res.status(400).json({ 
        error: 'Payment capture failed', 
        details: captureData && (captureData.message || captureData.name || captureData.status || 'See logs') 
      });
    }

    // Payment verified on server!
    // We can optionally log the transaction here in future.

    res.status(200).json({
      success: true,
      transactionId: captureData.id || captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      status: captureData.status,
    });
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({ 
      error: 'Internal server error during capture. Check Vercel function logs.',
    });
  }
}