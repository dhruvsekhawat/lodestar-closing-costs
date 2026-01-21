// Vercel Serverless Function - Get Counties
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state, session_id } = req.query;
  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'LodeStar_Discovery_API';

  if (!state || !session_id) {
    return res.status(400).json({ error: 'Missing state or session_id' });
  }

  try {
    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/counties.php?state=${state}&session_id=${session_id}`,
      {
        headers: { 'Accept': 'application/json' }
      }
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
};
