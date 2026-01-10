// Vercel Serverless Function - Calculate Closing Costs
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'SettleWise';
  const body = req.body;

  if (!body.session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/closing_cost_calculations.php`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
