// Server-side PayPal order creation using Client Secret (never exposed to browser)
// Buffer is global in Node.js, no import needed.

const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'live').toLowerCase().trim();
const PAYPAL_API = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    const err = new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel (and matching PAYPAL_MODE=live).');
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
  // Robust body parsing for Vercel serverless (req.body may be pre-parsed, string, or raw stream)
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

  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // === SAFE DIAGNOSTIC LOGGING (visible in Vercel Functions tab) ===
  // This will prove whether your LIVE credentials are actually reaching the runtime.
  const cid = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const csec = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const modeFromEnv = process.env.PAYPAL_MODE;
  console.log(`[create-order] PAYPAL_MODE=${PAYPAL_MODE} (raw env: ${modeFromEnv || 'MISSING - using default'}) | TARGET_API=${PAYPAL_API}`);
  console.log(`[create-order] CLIENT_ID present=${!!cid} len=${cid.length} prefix=${cid.substring(0, 10)}...`);
  console.log(`[create-order] CLIENT_SECRET present=${!!csec} len=${csec.length}`);
  // Never log the actual secret value.

  try {
    const body = await parseJsonBody(req);
    const amountRaw = body.amount;
    const amount = (typeof amountRaw === 'number' ? amountRaw.toFixed(2) : String(amountRaw || '').trim());
    const currency = body.currency || 'USD';
    const description = body.description;
    const trackTitle = body.trackTitle;

    // Security: Only allow our known license prices (accept number or string)
    const allowedAmounts = ['1.50', '4.99', '19.99'];
    if (!amount || !allowedAmounts.includes(amount)) {
      return res.status(400).json({ error: 'Invalid amount. Only $1.50, $4.99, $19.99 licenses allowed.', received: amount });
    }

    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (authErr) {
      console.error('PayPal getAccessToken failed:', authErr.message);
      const isAuthFail = authErr.code === 'AUTH_FAILED' || /client authentication|invalid_client|authentication failed/i.test(authErr.message || '');
      const status = isAuthFail ? 401 : 500;
      return res.status(status).json({
        error: isAuthFail 
          ? 'PayPal client authentication failed (live). Verify LIVE Client ID + Secret pair in Vercel env vars and that your PayPal app is switched to LIVE mode (not Sandbox). Also confirm PAYPAL_MODE=live exactly.'
          : 'Failed to authenticate with PayPal.',
        hint: 'Check Vercel Project > Deployments > latest > Functions tab logs for full details. See GO-LIVE-INSTRUCTIONS.md.',
        mode: PAYPAL_MODE
      });
    }

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
          description: description || `Aether Music License - ${trackTitle || 'Track'}`,
        },
      ],
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation failed:', order);
      // Surface useful info but do not leak internal secrets
      return res.status(400).json({ 
        error: 'Failed to create PayPal order', 
        details: order && (order.message || order.name || order.error_description || order) 
      });
    }

    // Return only the order ID to the frontend
    res.status(200).json({ id: order.id });
  } catch (error) {
    console.error('Create order error:', error);
    // Never leak stack traces or raw secrets to client
    res.status(500).json({ 
      error: 'Internal server error creating order. Check Vercel function logs.',
      hint: error && error.code ? error.code : undefined
    });
  }
}