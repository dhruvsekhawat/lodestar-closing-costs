// Vercel Serverless Function - Auto Login
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'SettleWise';
  const USERNAME = process.env.LODESTAR_USERNAME;
  const PASSWORD = process.env.LODESTAR_PASSWORD;

  if (!USERNAME || !PASSWORD) {
    return res.status(400).json({ success: false, error: 'Credentials not configured' });
  }

  try {
    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/Login/login.php`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: USERNAME, password: PASSWORD }).toString()
      }
    );

    const text = await response.text();
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      return res.status(404).json({ success: false, error: `Client "${CLIENT_NAME}" not found` });
    }

    const data = JSON.parse(text);
    
    if (data.session_id) {
      return res.status(200).json({ success: true, session_id: data.session_id, username: USERNAME });
    } else {
      return res.status(401).json({ success: false, error: data.error || 'Login failed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
