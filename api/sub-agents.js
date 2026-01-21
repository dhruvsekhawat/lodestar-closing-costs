// Vercel Serverless Function - Get Sub-Agents
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, include_contact_info, state, county, purpose } = req.query;
  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'LodeStar_Discovery_API';

  if (!session_id || !state || !county || !purpose) {
    return res.status(400).json({ error: 'Missing required parameters: session_id, state, county, purpose' });
  }

  try {
    const params = new URLSearchParams({ session_id, state, county, purpose });
    if (include_contact_info === '1') {
      params.append('include_contact_info', '1');
    }

    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/sub_agents.php?${params}`,
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
