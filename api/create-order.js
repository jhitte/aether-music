// Server-side PayPal order creation using Client Secret (never exposed to browser)
// Buffer is global in Node.js, no import needed.

const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'live').toLowerCase().trim();
const PAYPAL_API = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel (and matching PAYPAL_MODE).');
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
    // Include environment hint for faster debugging
    const envHint = PAYPAL_MODE === 'sandbox' ? ' (sandbox)' : ' (live)';
    throw new Error((data.error_description || 'Failed to get PayPal access token') + envHint);
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

  try {
    const body = await parseJsonBody(req);
    const amountRaw = body.amount;
    const amount = (typeof amountRaw === 'number' ? amountRaw.toFixed(2) : String(amountRaw || '').trim());
    const currency = body.currency || 'USD';
    const description = body.description;
    const trackTitle = body.trackTitle;

    // Security: Only allow our known license prices (accept number or string)
    const allowedAmounts = ['0.99', '4.99', '19.99'];
    if (!amount || !allowedAmounts.includes(amount)) {
      return res.status(400).json({ error: 'Invalid amount', received: amount });
    }

    const accessToken = await getAccessToken();

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
      return res.status(500).json({ 
        error: 'Failed to create PayPal order', 
        details: order   // forwards the actual error from PayPal for debugging
      });
    }

    // Return only the order ID to the frontend
    res.status(200).json({ id: order.id });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message || String(error)
    });
  }
}