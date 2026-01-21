// Vercel Serverless Function - Calculate Closing Costs (Full Implementation)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLIENT_NAME = process.env.LODESTAR_CLIENT_NAME || 'LodeStar_Discovery_API';
  const body = req.body;

  if (!body.session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    // Build complete request body with all supported fields
    const requestBody = {
      session_id: body.session_id,
      // Required fields
      state: body.state,
      county: body.county,
      township: body.township,
      search_type: body.search_type || 'CFPB',
      purpose: body.purpose || '11',
      
      // Financial fields
      loan_amount: parseFloat(body.loan_amount) || 0,
      purchase_price: parseFloat(body.purchase_price) || 0
    };

    // Optional fields
    if (body.filename) requestBody.filename = body.filename;
    if (body.address) requestBody.address = body.address;
    if (body.close_date) requestBody.close_date = body.close_date;
    
    // Refinance-specific
    if (body.prior_insurance) requestBody.prior_insurance = parseFloat(body.prior_insurance);
    if (body.exdebt) requestBody.exdebt = parseFloat(body.exdebt);
    if (body.prior_insurance_date) requestBody.prior_insurance_date = body.prior_insurance_date;
    
    // Loan info object
    if (body.loan_info) requestBody.loan_info = body.loan_info;
    
    // Dynamic inputs
    if (body.qst) requestBody.qst = body.qst;
    if (body.request_endos) requestBody.request_endos = body.request_endos;
    if (body.doc_type) requestBody.doc_type = body.doc_type;
    if (body.app_mods) requestBody.app_mods = body.app_mods;
    
    // Sub-agent selection
    if (body.client_id) requestBody.client_id = parseInt(body.client_id);
    if (body.agent_id) requestBody.agent_id = parseInt(body.agent_id);
    
    // Policy levels
    if (body.loanpol_level) requestBody.loanpol_level = parseInt(body.loanpol_level);
    if (body.owners_level) requestBody.owners_level = parseInt(body.owners_level);
    
    // Integration name
    if (body.int_name) requestBody.int_name = body.int_name;
    
    // Output options
    if (body.include_full_policy_amount) requestBody.include_full_policy_amount = 1;
    if (body.include_section) requestBody.include_section = 1;
    if (body.include_payee_info) requestBody.include_payee_info = 1;
    if (body.include_pdf) requestBody.include_pdf = 1;
    if (body.include_seller_responsible) requestBody.include_seller_responsible = 1;
    if (body.include_property_tax) requestBody.include_property_tax = 1;
    if (body.include_appraisal) requestBody.include_appraisal = 1;
    if (body.include_encompass_mapping) requestBody.include_encompass_mapping = 1;

    const response = await fetch(
      `https://www.lodestarss.com/Live/${CLIENT_NAME}/closing_cost_calculations.php`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
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
