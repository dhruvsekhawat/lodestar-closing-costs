// Vercel Serverless Function - Get Search Results by file_name
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file_name, include_full_policy_amount, include_pdf, include_encompass_mapping, session_id } = req.query;
  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'LodeStar_Discovery_API';

  if (!file_name || !session_id) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const params = new URLSearchParams({
      session_id,
      file_name
    });

    if (include_full_policy_amount === '1') params.append('include_full_policy_amount', '1');
    if (include_pdf === '1') params.append('include_pdf', '1');
    if (include_encompass_mapping === '1') params.append('include_encompass_mapping', '1');

    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/closing_cost_calculations.php?${params}`,
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
