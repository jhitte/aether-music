// Returns the public PayPal Client ID from environment variables.
// This way it's not hardcoded in the HTML source.
export default function handler(req, res) {
  // CORS for safety (restrict in prod if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'PayPal Client ID not configured' });
  }

  res.status(200).json({ clientId });
}
