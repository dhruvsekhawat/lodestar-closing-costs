// Vercel Serverless Function - Get Endorsements
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state, county, purpose, session_id } = req.query;
  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'SettleWise';

  if (!state || !county || !purpose || !session_id) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const params = new URLSearchParams({ state, county, purpose, session_id });
    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/endorsements.php?${params}`
    );

    const text = await response.text();
    
    if (text.startsWith('<!DOCTYPE')) {
      return res.status(500).json({ error: 'API error' });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
