// Returns the public PayPal Client ID from environment variables.
// This way it's not hardcoded in the HTML source. Never expose secret here.
module.exports = function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // CORS (consider locking to your domain in prod for extra hardening)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  console.log(`[config] CLIENT_ID present=${!!clientId} len=${clientId.length} prefix=${clientId.substring(0,10)}...`);

  if (!clientId) {
    return res.status(500).json({ error: 'PayPal Client ID not configured in Vercel environment variables' });
  }

  res.status(200).json({ clientId });
}
