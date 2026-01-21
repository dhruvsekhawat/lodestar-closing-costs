const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env for local development
try { require('dotenv').config(); } catch(e) {}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// LodeStar API Configuration
const LODESTAR_BASE_URL = `https://www.lodestarss.com/Live/${process.env.LODESTAR_CLIENT_NAME}`;

// Store session globally (in production, use proper session management)
let currentSession = null;

// Helper function to make API requests
async function lodestarRequest(endpoint, method = 'GET', body = null, contentType = 'application/json') {
  const url = `${LODESTAR_BASE_URL}${endpoint}`;
  console.log(`[API] ${method} ${url}`);
  
  const options = {
    method,
    headers: {
      'Accept': 'application/json'
    }
  };

  if (contentType === 'application/x-www-form-urlencoded' && body) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams(body).toString();
  } else if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error(`[API] Received HTML error page (status: ${response.status})`);
      return { 
        ok: false, 
        status: response.status, 
        data: { 
          error: response.status === 404 
            ? `Client "${process.env.LODESTAR_CLIENT_NAME}" not found.`
            : `API returned an error page (HTTP ${response.status})` 
        } 
      };
    }
    
    const data = JSON.parse(text);
    console.log(`[API] Response:`, JSON.stringify(data).substring(0, 500));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[API] Error:`, error.message);
    return { ok: false, status: 500, data: { error: error.message } };
  }
}

// ==================== API ROUTES ====================

// 1. Login - Auto-login with env credentials
app.post('/api/auto-login', async (req, res) => {
  const username = process.env.LODESTAR_USERNAME;
  const password = process.env.LODESTAR_PASSWORD;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Credentials not configured' });
  }

  const result = await lodestarRequest(
    '/Login/login.php',
    'POST',
    { username, password },
    'application/x-www-form-urlencoded'
  );

  if (result.ok && result.data.session_id) {
    currentSession = result.data.session_id;
    res.json({ 
      success: true, 
      session_id: result.data.session_id, 
      username,
      uri_path: result.data.uri_path 
    });
  } else {
    res.status(401).json({ success: false, error: result.data.error || 'Login failed' });
  }
});

// 2. Get Counties
app.get('/api/counties', async (req, res) => {
  const { state, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const result = await lodestarRequest(`/counties.php?state=${state}&session_id=${sid}`);
  res.json(result.data);
});

// 3. Get Townships
app.get('/api/townships', async (req, res) => {
  const { state, county, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const result = await lodestarRequest(
    `/townships.php?state=${state}&county=${encodeURIComponent(county)}&session_id=${sid}`
  );
  res.json(result.data);
});

// 4. Geocode Check - Property Location Resolution
app.get('/api/geocode-check', async (req, res) => {
  const { state, county, township, address, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const params = new URLSearchParams({
    session_id: sid,
    state,
    county,
    township,
    address
  });

  const result = await lodestarRequest(`/geocode_check.php?${params}`);
  res.json(result.data);
});

// 5. Get Questions - Dynamic questions based on state/purpose
app.get('/api/questions', async (req, res) => {
  const { state, purpose, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const params = new URLSearchParams({
    session_id: sid,
    state,
    purpose
  });

  const result = await lodestarRequest(`/questions.php?${params}`);
  res.json(result.data);
});

// 6. Get Endorsements
app.get('/api/endorsements', async (req, res) => {
  const { state, county, purpose, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const params = new URLSearchParams({
    session_id: sid,
    state,
    county,
    purpose
  });

  const result = await lodestarRequest(`/endorsements.php?${params}`);
  res.json(result.data);
});

// 7. Get Sub-Agents (Title/Escrow Agent relationships)
app.get('/api/sub-agents', async (req, res) => {
  const { session_id, include_contact_info, state, county, purpose } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const params = new URLSearchParams({ session_id: sid });
  
  // Sub-agents requires state, county, purpose
  if (state) params.append('state', state);
  if (county) params.append('county', county);
  if (purpose) params.append('purpose', purpose);
  if (include_contact_info === '1') params.append('include_contact_info', '1');

  const result = await lodestarRequest(`/sub_agents.php?${params}`);
  res.json(result.data);
});

// 8. Get Appraisal Modifiers
app.get('/api/appraisal-modifiers', async (req, res) => {
  const { state, county, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const params = new URLSearchParams({
    session_id: sid,
    state,
    county
  });

  const result = await lodestarRequest(`/appraisal_modifiers.php?${params}`);
  res.json(result.data);
});

// 9. Calculate Closing Costs - Full implementation
app.post('/api/closing-costs', async (req, res) => {
  const sid = req.body.session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  // Build complete request body with all supported fields
  const body = {
    session_id: sid,
    // Required fields
    state: req.body.state,
    county: req.body.county,
    township: req.body.township,
    search_type: req.body.search_type || 'CFPB',
    purpose: req.body.purpose || '11',
    
    // Financial fields
    loan_amount: parseFloat(req.body.loan_amount) || 0,
    purchase_price: parseFloat(req.body.purchase_price) || 0,
    
    // Optional fields
    ...(req.body.filename && { filename: req.body.filename }),
    ...(req.body.address && { address: req.body.address }),
    ...(req.body.close_date && { close_date: req.body.close_date }),
    
    // Refinance-specific
    ...(req.body.prior_insurance && { prior_insurance: parseFloat(req.body.prior_insurance) }),
    ...(req.body.exdebt && { exdebt: parseFloat(req.body.exdebt) }),
    ...(req.body.prior_insurance_date && { prior_insurance_date: req.body.prior_insurance_date }),
    
    // Loan info object
    ...(req.body.loan_info && { loan_info: req.body.loan_info }),
    
    // Dynamic inputs
    ...(req.body.qst && { qst: req.body.qst }),
    ...(req.body.request_endos && { request_endos: req.body.request_endos }),
    ...(req.body.doc_type && { doc_type: req.body.doc_type }),
    ...(req.body.app_mods && { app_mods: req.body.app_mods }),
    
    // Sub-agent selection
    ...(req.body.client_id && { client_id: parseInt(req.body.client_id) }),
    ...(req.body.agent_id && { agent_id: parseInt(req.body.agent_id) }),
    
    // Policy levels
    ...(req.body.loanpol_level && { loanpol_level: parseInt(req.body.loanpol_level) }),
    ...(req.body.owners_level && { owners_level: parseInt(req.body.owners_level) }),
    
    // Integration name
    ...(req.body.int_name && { int_name: req.body.int_name }),
    
    // Output options
    ...(req.body.include_full_policy_amount && { include_full_policy_amount: 1 }),
    ...(req.body.include_section && { include_section: 1 }),
    ...(req.body.include_payee_info && { include_payee_info: 1 }),
    ...(req.body.include_pdf && { include_pdf: 1 }),
    ...(req.body.include_seller_responsible && { include_seller_responsible: 1 }),
    ...(req.body.include_property_tax && { include_property_tax: 1 }),
    ...(req.body.include_appraisal && { include_appraisal: 1 }),
    ...(req.body.include_encompass_mapping && { include_encompass_mapping: 1 })
  };

  console.log('[API] Closing cost request body:', JSON.stringify(body, null, 2));
  
  const result = await lodestarRequest('/closing_cost_calculations.php', 'POST', body);
  res.json(result.data);
});

// 10. Get Property Tax
app.get('/api/property-tax', async (req, res) => {
  const { state, county, city, address, close_date, file_name, purchase_price, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });
  
  const params = new URLSearchParams({
    session_id: sid,
    state,
    county,
    city,
    address,
    close_date: close_date || new Date().toISOString().split('T')[0],
    file_name: file_name || 'WebApp',
    purchase_price: purchase_price || '0'
  });

  const result = await lodestarRequest(`/property_tax.php?${params}`);
  res.json(result.data);
});

// 11. Get Search Results by file_name (for UI Integration workflow)
app.get('/api/search-results', async (req, res) => {
  const { file_name, include_full_policy_amount, include_pdf, include_encompass_mapping, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });
  
  const params = new URLSearchParams({
    session_id: sid,
    file_name
  });

  if (include_full_policy_amount === '1') params.append('include_full_policy_amount', '1');
  if (include_pdf === '1') params.append('include_pdf', '1');
  if (include_encompass_mapping === '1') params.append('include_encompass_mapping', '1');

  const result = await lodestarRequest(`/closing_cost_calculations.php?${params}`);
  res.json(result.data);
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 LodeStar Web App running at http://localhost:${PORT}`);
  console.log(`📋 Client: ${process.env.LODESTAR_CLIENT_NAME}`);
  console.log(`🔑 Credentials configured: ${process.env.LODESTAR_USERNAME ? 'Yes' : 'No'}\n`);
});
