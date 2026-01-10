import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

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
    
    // Check if response is HTML (error page)
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error(`[API] Received HTML error page (status: ${response.status})`);
      return { 
        ok: false, 
        status: response.status, 
        data: { 
          error: response.status === 404 
            ? `Client "${process.env.LODESTAR_CLIENT_NAME}" not found. Please verify your client name.`
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

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const result = await lodestarRequest(
    '/Login/login.php',
    'POST',
    { username, password },
    'application/x-www-form-urlencoded'
  );

  if (result.ok && result.data.session_id) {
    currentSession = result.data.session_id;
    res.json({ success: true, session_id: result.data.session_id });
  } else {
    res.status(401).json({ success: false, error: result.data.error || 'Login failed' });
  }
});

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

// Get current session
app.get('/api/session', (req, res) => {
  res.json({ session_id: currentSession });
});

// Get counties
app.get('/api/counties', async (req, res) => {
  const { state } = req.query;
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const result = await lodestarRequest(
    `/counties.php?state=${state}&session_id=${currentSession}`
  );
  res.json(result.data);
});

// Get townships
app.get('/api/townships', async (req, res) => {
  const { state, county } = req.query;
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const result = await lodestarRequest(
    `/townships.php?state=${state}&county=${encodeURIComponent(county)}&session_id=${currentSession}`
  );
  res.json(result.data);
});

// Get endorsements
app.get('/api/endorsements', async (req, res) => {
  const { state, county, purpose } = req.query;
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const result = await lodestarRequest(
    `/endorsements.php?state=${state}&county=${encodeURIComponent(county)}&purpose=${purpose}&session_id=${currentSession}`
  );
  res.json(result.data);
});

// Get sub agents
app.get('/api/sub-agents', async (req, res) => {
  const { state, county, purpose, get_contact_info } = req.query;
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  let url = `/sub_agents.php?state=${state}&county=${encodeURIComponent(county)}&purpose=${purpose}&session_id=${currentSession}`;
  if (get_contact_info) url += `&get_contact_info=${get_contact_info}`;

  const result = await lodestarRequest(url);
  res.json(result.data);
});

// Get questions
app.post('/api/questions', async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const body = {
    ...req.body,
    session_id: currentSession
  };

  const result = await lodestarRequest('/questions.php', 'POST', body);
  res.json(result.data);
});

// Calculate closing costs
app.post('/api/closing-costs', async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const body = {
    ...req.body,
    session_id: currentSession
  };

  const result = await lodestarRequest('/closing_cost_calculations.php', 'POST', body);
  res.json(result.data);
});

// Get property tax
app.get('/api/property-tax', async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { state, county, city, address, close_date, file_name, purchase_price } = req.query;
  
  const params = new URLSearchParams({
    state,
    county,
    city,
    address,
    close_date,
    file_name: file_name || 'WebApp',
    purchase_price,
    session_id: currentSession
  });

  const result = await lodestarRequest(`/property_tax.php?${params}`);
  res.json(result.data);
});

// Geocode check
app.get('/api/geocode-check', async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { state, county, township, address } = req.query;
  
  const params = new URLSearchParams({
    state,
    county,
    township,
    address,
    session_id: currentSession
  });

  const result = await lodestarRequest(`/geocode_check.php?${params}`);
  res.json(result.data);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 LodeStar Web App running at http://localhost:${PORT}`);
  console.log(`📋 Client: ${process.env.LODESTAR_CLIENT_NAME}`);
  console.log(`🔑 Credentials configured: ${process.env.LODESTAR_USERNAME ? 'Yes' : 'No'}\n`);
});
