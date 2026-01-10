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
    headers: {}
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
    console.log(`[API] Response:`, JSON.stringify(data).substring(0, 200));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[API] Error:`, error.message);
    return { ok: false, status: 500, data: { error: error.message } };
  }
}

// ==================== API ROUTES ====================

// Auto-login with env credentials
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
    res.json({ success: true, session_id: result.data.session_id, username });
  } else {
    res.status(401).json({ success: false, error: result.data.error || 'Login failed' });
  }
});

// Get counties
app.get('/api/counties', async (req, res) => {
  const { state, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const result = await lodestarRequest(`/counties.php?state=${state}&session_id=${sid}`);
  res.json(result.data);
});

// Get townships
app.get('/api/townships', async (req, res) => {
  const { state, county, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const result = await lodestarRequest(
    `/townships.php?state=${state}&county=${encodeURIComponent(county)}&session_id=${sid}`
  );
  res.json(result.data);
});

// Get endorsements
app.get('/api/endorsements', async (req, res) => {
  const { state, county, purpose, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const result = await lodestarRequest(
    `/endorsements.php?state=${state}&county=${encodeURIComponent(county)}&purpose=${purpose}&session_id=${sid}`
  );
  res.json(result.data);
});

// Calculate closing costs
app.post('/api/closing-costs', async (req, res) => {
  const sid = req.body.session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });

  const body = { ...req.body, session_id: sid };
  const result = await lodestarRequest('/closing_cost_calculations.php', 'POST', body);
  res.json(result.data);
});

// Get property tax
app.get('/api/property-tax', async (req, res) => {
  const { state, county, city, address, close_date, file_name, purchase_price, session_id } = req.query;
  const sid = session_id || currentSession;
  if (!sid) return res.status(401).json({ error: 'Not logged in' });
  
  const params = new URLSearchParams({
    state, county, city, address,
    close_date: close_date || new Date().toISOString().split('T')[0],
    file_name: file_name || 'WebApp',
    purchase_price: purchase_price || '0',
    session_id: sid
  });

  const result = await lodestarRequest(`/property_tax.php?${params}`);
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
