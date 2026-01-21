// ==================== State Management ====================
const state = {
  sessionId: null,
  isConnected: false,
  counties: [],
  townships: [],
  selectedCounty: null,
  endorsements: [],
  selectedEndorsements: [],
  questions: [],
  questionAnswers: {},
  subAgents: [],
  lastResponse: null,
  pdfBase64: null
};

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
];

// ==================== DOM Elements ====================
const elements = {
  sessionStatus: document.getElementById('session-status'),
  connectBtn: document.getElementById('connect-btn'),
  loadingOverlay: document.getElementById('loading-overlay'),
  toastContainer: document.getElementById('toast-container'),
  
  // Closing Costs
  ccForm: document.getElementById('closing-costs-form'),
  ccState: document.getElementById('cc-state'),
  ccCounty: document.getElementById('cc-county'),
  ccTownship: document.getElementById('cc-township'),
  ccPurpose: document.getElementById('cc-purpose'),
  resultsSection: document.getElementById('results-section'),
  refinanceSection: document.getElementById('refinance-section'),
  
  // Property Tax
  ptForm: document.getElementById('property-tax-form'),
  ptState: document.getElementById('pt-state'),
  ptResults: document.getElementById('property-tax-results'),
  
  // Endorsements
  endoForm: document.getElementById('endorsements-form'),
  endoState: document.getElementById('endo-state'),
  endoResults: document.getElementById('endorsements-results'),
  
  // Questions
  qstForm: document.getElementById('questions-form'),
  qstState: document.getElementById('qst-state'),
  qstResults: document.getElementById('questions-results'),
  
  // Geocode
  geoForm: document.getElementById('geocode-form'),
  geoState: document.getElementById('geo-state'),
  geoResults: document.getElementById('geocode-results'),
  
  // Locations
  locState: document.getElementById('loc-state'),
  countiesList: document.getElementById('counties-list'),
  townshipsList: document.getElementById('townships-list'),
  
  // Sub-Agents
  subAgentsResults: document.getElementById('sub-agents-results')
};

// ==================== Utility Functions ====================
function showLoading() {
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  elements.loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== Connection ====================
async function connect() {
  showLoading();
  try {
    const response = await apiCall('/api/auto-login', { method: 'POST' });
    
    if (response.success) {
      state.sessionId = response.session_id;
      state.isConnected = true;
      updateConnectionStatus(true, response.username);
      showToast('Connected to LodeStar API', 'success');
    } else {
      showToast(response.error || 'Connection failed', 'error');
    }
  } catch (error) {
    showToast('Connection failed: ' + error.message, 'error');
  }
  hideLoading();
}

function updateConnectionStatus(connected, username = '') {
  elements.sessionStatus.classList.toggle('connected', connected);
  elements.sessionStatus.classList.toggle('disconnected', !connected);
  elements.sessionStatus.querySelector('.status-text').textContent = 
    connected ? `Connected (${username})` : 'Not Connected';
  elements.connectBtn.textContent = connected ? 'Reconnect' : 'Connect';
}

// ==================== State Selects ====================
function populateStateSelects() {
  const saState = document.getElementById('sa-state');
  const stateSelects = [
    elements.ccState, elements.ptState, elements.endoState, 
    elements.qstState, elements.geoState, elements.locState, saState
  ];
  
  stateSelects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Select State</option>';
    US_STATES.forEach(state => {
      const option = document.createElement('option');
      option.value = state.code;
      option.textContent = `${state.code} - ${state.name}`;
      select.appendChild(option);
    });
  });
}

// ==================== Counties & Townships ====================
async function loadCounties(stateCode, targetSelect, callback) {
  if (!stateCode || !state.isConnected) return;
  
  showLoading();
  try {
    const response = await apiCall(`/api/counties?state=${stateCode}&session_id=${state.sessionId}`);
    
    if (response.status === 1 && response.counties) {
      if (targetSelect) {
        targetSelect.innerHTML = '<option value="">Select County</option>';
        response.counties.forEach(county => {
          const option = document.createElement('option');
          option.value = county;
          option.textContent = county;
          targetSelect.appendChild(option);
        });
        targetSelect.disabled = false;
      }
      
      if (callback) callback(response.counties);
    } else {
      showToast(response.message || response.error || 'Failed to load counties', 'error');
    }
  } catch (error) {
    showToast('Failed to load counties', 'error');
  }
  hideLoading();
}

async function loadTownships(stateCode, countyName, targetSelect, callback) {
  if (!stateCode || !countyName || !state.isConnected) return;
  
  showLoading();
  try {
    const response = await apiCall(`/api/townships?state=${stateCode}&county=${encodeURIComponent(countyName)}&session_id=${state.sessionId}`);
    
    if (response.status === 1 && response.townships) {
      if (targetSelect) {
        targetSelect.innerHTML = '<option value="">Select Township</option>';
        response.townships.forEach(township => {
          const option = document.createElement('option');
          option.value = township;
          option.textContent = township;
          targetSelect.appendChild(option);
        });
        targetSelect.disabled = false;
      }
      
      if (callback) callback(response.townships);
    } else {
      showToast(response.message || response.error || 'Failed to load townships', 'error');
    }
  } catch (error) {
    showToast('Failed to load townships', 'error');
  }
  hideLoading();
}

// ==================== Geocode Check ====================
async function geocodeCheck(formData) {
  showLoading();
  try {
    const params = new URLSearchParams({
      state: formData.state,
      county: formData.county,
      township: formData.township,
      address: formData.address,
      session_id: state.sessionId
    });

    const response = await apiCall(`/api/geocode-check?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      displayGeocodeResults(response);
      showToast('Geocode check complete', 'success');
    }
  } catch (error) {
    showToast('Geocode check failed: ' + error.message, 'error');
  }
  hideLoading();
}

function displayGeocodeResults(data) {
  elements.geoResults.classList.remove('hidden');
  const container = document.getElementById('geocode-content');
  
  if (data.status === 0 || data.message) {
    container.innerHTML = `
      <div class="result-card">
        <p style="color: var(--text-secondary);">${data.message || 'No geocode data found'}</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="result-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <h3>Resolved Location</h3>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Suggested County:</span>
          <span class="info-value">${data.suggested_county || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Suggested Township:</span>
          <span class="info-value highlight">${data.suggested_township || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;

  if (data.township_options && data.township_options.length > 0) {
    html += `
      <div class="result-card">
        <div class="card-header">
          <h3>Other Township Options</h3>
        </div>
        <div class="card-body">
          <div class="township-options">
            ${data.township_options.map(t => `<span class="option-badge">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ==================== Questions ====================
async function loadQuestions(stateCode, purpose) {
  showLoading();
  try {
    const params = new URLSearchParams({
      state: stateCode,
      purpose: purpose,
      session_id: state.sessionId
    });

    const response = await apiCall(`/api/questions?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
      return [];
    } else {
      state.questions = response || [];
      return response;
    }
  } catch (error) {
    showToast('Failed to load questions: ' + error.message, 'error');
    return [];
  } finally {
    hideLoading();
  }
}

function displayQuestions(questions, containerId) {
  const container = document.getElementById(containerId);
  
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No questions available for this state/transaction type</p>';
    return;
  }

  container.innerHTML = questions.map((q, idx) => {
    let inputHtml = '';
    const inputId = `qst-input-${idx}`;
    const name = q.name || `Q${idx}`;
    
    switch (q.input_type) {
      case 'checkbox':
        const checked = q.default_value === true || q.default_value === 'checked' || q.default_value === 1;
        inputHtml = `<input type="checkbox" id="${inputId}" data-qst-name="${name}" ${checked ? 'checked' : ''}>`;
        break;
      case 'number':
        inputHtml = `<input type="number" id="${inputId}" data-qst-name="${name}" value="${q.default_value || ''}" placeholder="0">`;
        break;
      case 'date':
        inputHtml = `<input type="date" id="${inputId}" data-qst-name="${name}" value="${q.default_value || ''}">`;
        break;
      default:
        inputHtml = `<input type="text" id="${inputId}" data-qst-name="${name}" value="${q.default_value || ''}" placeholder="">`;
    }

    return `
      <div class="question-item">
        <label for="${inputId}">
          ${q.label || name}
          ${q.related_doc ? `<span class="question-doc">(${q.related_doc})</span>` : ''}
        </label>
        ${inputHtml}
        ${q.categories && q.categories.length > 0 ? 
          `<div class="question-categories">${q.categories.map(c => `<span class="category-tag">${c}</span>`).join('')}</div>` : ''}
      </div>
    `;
  }).join('');
}

function collectQuestionAnswers(containerId) {
  const container = document.getElementById(containerId);
  const answers = {};
  
  container.querySelectorAll('[data-qst-name]').forEach(input => {
    const name = input.dataset.qstName;
    if (input.type === 'checkbox') {
      answers[name] = input.checked ? '1' : '0';
    } else if (input.value) {
      answers[name] = input.value;
    }
  });
  
  return answers;
}

// ==================== Endorsements ====================
async function loadEndorsements(stateCode, county, purpose) {
  showLoading();
  try {
    const params = new URLSearchParams({ 
      state: stateCode, 
      county, 
      purpose, 
      session_id: state.sessionId 
    });
    const response = await apiCall(`/api/endorsements?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
      return [];
    } else {
      state.endorsements = response.endorsements || [];
      return response.endorsements || [];
    }
  } catch (error) {
    showToast('Failed to load endorsements', 'error');
    return [];
  } finally {
    hideLoading();
  }
}

function displayEndorsements(endorsements, containerId, isInline = false) {
  const container = document.getElementById(containerId);
  
  if (!endorsements || endorsements.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No endorsements available</p>';
    return;
  }
  
  const className = isInline ? 'endorsement-item-inline' : 'endorsement-card';
  
  container.innerHTML = endorsements.map(endo => `
    <div class="${className} ${endo.default === 1 ? 'default' : ''}">
      <input type="checkbox" class="endorsement-checkbox" ${endo.default === 1 ? 'checked' : ''} 
             data-endo-id="${endo.endo_id}">
      <div class="endorsement-info">
        <div class="endorsement-name">${endo.name}</div>
        <div class="endorsement-id">ID: ${endo.endo_id} ${endo.fee_id ? `| Fee: ${endo.fee_id}` : ''}</div>
      </div>
      ${endo.default === 1 ? '<span class="endorsement-badge">Default</span>' : ''}
    </div>
  `).join('');
}

function collectSelectedEndorsements(containerId) {
  const container = document.getElementById(containerId);
  const selected = [];
  
  container.querySelectorAll('.endorsement-checkbox:checked').forEach(checkbox => {
    selected.push(checkbox.dataset.endoId);
  });
  
  return selected;
}

// ==================== Sub-Agents ====================
async function loadSubAgents(includeContact = false, stateCode = null, county = null, purpose = null) {
  showLoading();
  try {
    const params = new URLSearchParams({ session_id: state.sessionId });
    
    // Sub-agents requires state, county, purpose
    if (stateCode) params.append('state', stateCode);
    if (county) params.append('county', county);
    if (purpose) params.append('purpose', purpose);
    if (includeContact) params.append('include_contact_info', '1');
    
    const response = await apiCall(`/api/sub-agents?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      state.subAgents = response.sub_agents || [];
      displaySubAgents(response.sub_agents || [], includeContact);
      elements.subAgentsResults.classList.remove('hidden');
    }
  } catch (error) {
    showToast('Failed to load sub-agents: ' + error.message, 'error');
  }
  hideLoading();
}

function displaySubAgents(subAgents, includeContact = false) {
  const container = document.getElementById('sub-agents-list');
  
  if (!subAgents || subAgents.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No sub-agents available</p>';
    return;
  }

  const relationTypes = {
    1: 'Full Service (Title + Settlement)',
    2: 'Settlement/Escrow Only',
    4: 'Title Only'
  };

  container.innerHTML = subAgents.map(agent => `
    <div class="sub-agent-card">
      <div class="sub-agent-header">
        <h4>${agent.name}</h4>
        <span class="relation-type">${relationTypes[agent.relation_type] || 'Unknown'}</span>
      </div>
      <div class="sub-agent-ids">
        <span>Client ID: ${agent.sub_agent_id}</span>
        <span>Office ID: ${agent.sub_agent_office_id}</span>
      </div>
      ${agent.contact_info ? `
        <div class="sub-agent-contact">
          <p><strong>${agent.contact_info.client_name || ''}</strong></p>
          <p>${agent.contact_info.contact_name || ''}</p>
          <p>${agent.contact_info.address || ''}</p>
          <p>${agent.contact_info.city || ''}, ${agent.contact_info.state || ''} ${agent.contact_info.zip || ''}</p>
          <p>${agent.contact_info.phone || ''}</p>
          ${agent.contact_info.is_multi_office ? '<span class="multi-office-badge">Multi-Office</span>' : ''}
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Also populate the dropdown in closing costs form
  const clientSelect = document.getElementById('cc-client-id');
  if (clientSelect) {
    clientSelect.innerHTML = '<option value="">Use Default</option>';
    subAgents.forEach(agent => {
      const option = document.createElement('option');
      option.value = agent.sub_agent_id;
      option.textContent = `${agent.name} (${agent.sub_agent_id})`;
      clientSelect.appendChild(option);
    });
  }
}

// ==================== Closing Costs ====================
async function calculateClosingCosts(formData) {
  showLoading();
  try {
    const requestBody = {
      session_id: state.sessionId,
      // Required
      state: formData.state,
      county: formData.county,
      township: formData.township,
      search_type: formData.searchType,
      purpose: formData.purpose,
      
      // Financial
      loan_amount: parseFloat(formData.loanAmount) || 0,
      purchase_price: parseFloat(formData.purchasePrice) || 0
    };

    // Optional fields
    if (formData.filename) requestBody.filename = formData.filename;
    if (formData.address) requestBody.address = formData.address;
    if (formData.closeDate) requestBody.close_date = formData.closeDate;
    
    // Refinance fields
    if (formData.priorInsurance) requestBody.prior_insurance = parseFloat(formData.priorInsurance);
    if (formData.exdebt) requestBody.exdebt = parseFloat(formData.exdebt);
    if (formData.priorInsuranceDate) requestBody.prior_insurance_date = formData.priorInsuranceDate;
    
    // Loan info
    const loanInfo = {};
    if (formData.propType) loanInfo.prop_type = parseInt(formData.propType);
    if (formData.loanType) loanInfo.loan_type = parseInt(formData.loanType);
    if (formData.amortType) loanInfo.amort_type = parseInt(formData.amortType);
    if (formData.propPurpose) loanInfo.prop_purpose = parseInt(formData.propPurpose);
    if (formData.propUsage) loanInfo.prop_usage = parseInt(formData.propUsage);
    if (formData.numFamilies) loanInfo.number_of_families = parseInt(formData.numFamilies);
    if (formData.firstTimeBuyer) loanInfo.is_first_time_home_buyer = 1;
    if (formData.federalCreditUnion) loanInfo.is_federal_credit_union = 1;
    if (formData.sameLender) loanInfo.is_same_lender_as_previous = 1;
    if (formData.sameBorrowers) loanInfo.is_same_borrowers_as_previous = 1;
    
    if (Object.keys(loanInfo).length > 0) {
      requestBody.loan_info = loanInfo;
    }

    // Policy levels
    if (formData.loanpolLevel) requestBody.loanpol_level = parseInt(formData.loanpolLevel);
    if (formData.ownersLevel) requestBody.owners_level = parseInt(formData.ownersLevel);
    
    // Sub-agent
    if (formData.clientId) requestBody.client_id = parseInt(formData.clientId);
    if (formData.agentId) requestBody.agent_id = parseInt(formData.agentId);
    
    // Endorsements
    if (formData.endorsements && formData.endorsements.length > 0) {
      requestBody.request_endos = formData.endorsements;
    }
    
    // Questions
    if (formData.qst && Object.keys(formData.qst).length > 0) {
      requestBody.qst = formData.qst;
    }
    
    // Document types
    if (formData.docType) {
      requestBody.doc_type = formData.docType;
    }
    
    // Output options
    if (formData.includeFullPolicy) requestBody.include_full_policy_amount = 1;
    if (formData.includeSection) requestBody.include_section = 1;
    if (formData.includePayee) requestBody.include_payee_info = 1;
    if (formData.includePdf) requestBody.include_pdf = 1;
    if (formData.includeSellerResponsible) requestBody.include_seller_responsible = 1;
    if (formData.includePropertyTax) requestBody.include_property_tax = 1;
    if (formData.includeAppraisal) requestBody.include_appraisal = 1;

    console.log('Request:', JSON.stringify(requestBody, null, 2));
    
    const response = await apiCall('/api/closing-costs', {
      method: 'POST',
      body: requestBody
    });

    console.log('Response:', response);
    state.lastResponse = response;
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      displayClosingCostResults(response, formData.includeFullPolicy, formData.includePdf);
      showToast('Calculation complete', 'success');
    }
  } catch (error) {
    showToast('Calculation failed: ' + error.message, 'error');
  }
  hideLoading();
}

function displayClosingCostResults(data, showFullPolicy = false, showPdf = false) {
  elements.resultsSection.classList.remove('hidden');
  
  // Search ID
  document.getElementById('search-id-value').textContent = data.search_id || '-';
  
  // Premiums
  document.getElementById('loan-policy-borrower').textContent = formatCurrency(data.loan_policy_premium?.borrower);
  document.getElementById('loan-policy-seller').textContent = formatCurrency(data.loan_policy_premium?.seller);
  document.getElementById('owners-policy-borrower').textContent = formatCurrency(data.owners_policy_premium?.borrower);
  document.getElementById('owners-policy-seller').textContent = formatCurrency(data.owners_policy_premium?.seller);
  document.getElementById('simissue').textContent = formatCurrency(data.simissue);
  
  // Full policy amounts (if requested)
  const fullPolicyCard = document.getElementById('full-policy-card');
  if (showFullPolicy && data.full_loan_policy_premium) {
    fullPolicyCard.style.display = 'block';
    document.getElementById('full-loan-policy-borrower').textContent = formatCurrency(data.full_loan_policy_premium?.borrower);
    document.getElementById('full-loan-policy-seller').textContent = formatCurrency(data.full_loan_policy_premium?.seller);
    document.getElementById('full-owners-policy-borrower').textContent = formatCurrency(data.full_owners_policy_premium?.borrower);
    document.getElementById('full-owners-policy-seller').textContent = formatCurrency(data.full_owners_policy_premium?.seller);
  } else {
    fullPolicyCard.style.display = 'none';
  }
  
  // PDF download button
  const pdfBtn = document.getElementById('download-pdf-btn');
  if (showPdf && data.pdf?.base64) {
    state.pdfBase64 = data.pdf.base64;
    pdfBtn.style.display = 'inline-flex';
  } else {
    pdfBtn.style.display = 'none';
  }
  
  // Title Agent Fees
  displayFeeList('borrower-fees', data.title_agent_fees?.borrower || [], 'title');
  displayFeeList('seller-fees', data.title_agent_fees?.seller || [], 'title');
  
  // Recording Fees
  displayFeeList('recording-fees', data.recording_fees || [], 'recording');
  
  // Transfer Taxes
  displayTaxList('borrower-taxes', data.transfer_taxes?.borrower || []);
  displayTaxList('seller-taxes', data.transfer_taxes?.seller || []);
  displayTaxList('lender-taxes', data.transfer_taxes?.lender || []);
  
  // Calculate totals
  const totalBorrower = calculateTotal(data, 'borrower');
  const totalSeller = calculateTotal(data, 'seller');
  
  document.getElementById('total-borrower').textContent = '$' + formatCurrency(totalBorrower);
  document.getElementById('total-seller').textContent = '$' + formatCurrency(totalSeller);
  document.getElementById('grand-total').textContent = '$' + formatCurrency(totalBorrower + totalSeller);
  
  // Raw JSON
  document.getElementById('raw-json-output').textContent = JSON.stringify(data, null, 2);
  
  // Scroll to results
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayFeeList(containerId, fees, type) {
  const container = document.getElementById(containerId);
  
  if (!fees || fees.length === 0) {
    container.innerHTML = '<div class="empty-state">No fees</div>';
    return;
  }
  
  container.innerHTML = fees.map(fee => {
    if (type === 'title') {
      return `
        <div class="fee-item">
          <div>
            <div class="fee-name">${fee.FeeName || fee.VariableName || 'Fee'}</div>
            <div class="fee-meta">${fee.MismoMap || ''} ${fee.FinanceCharge === 'Y' ? '(APR)' : ''}</div>
          </div>
          <div class="fee-amount">$${formatCurrency(fee.Amount)}</div>
        </div>
      `;
    } else {
      return `
        <div class="fee-item">
          <div>
            <div class="fee-name">${fee.type || 'Recording Fee'}</div>
            <div class="fee-meta">${fee.jur || ''}</div>
          </div>
          <div class="fee-amount">$${formatCurrency(fee.amount)}</div>
        </div>
      `;
    }
  }).join('');
}

function displayTaxList(containerId, taxes) {
  const container = document.getElementById(containerId);
  
  // Flatten nested arrays
  const flatTaxes = taxes.flat ? taxes.flat(2) : taxes;
  
  if (!flatTaxes || flatTaxes.length === 0) {
    container.innerHTML = '<div class="empty-state">No taxes</div>';
    return;
  }
  
  container.innerHTML = flatTaxes.map(tax => `
    <div class="fee-item">
      <div>
        <div class="fee-name">${tax.type || 'Tax'}</div>
        <div class="fee-meta">${tax.jur || ''}</div>
      </div>
      <div class="fee-amount">$${formatCurrency(tax.amount)}</div>
    </div>
  `).join('');
}

function calculateTotal(data, party) {
  let total = 0;
  
  // Premiums
  if (data.loan_policy_premium?.[party]) total += data.loan_policy_premium[party];
  if (data.owners_policy_premium?.[party]) total += data.owners_policy_premium[party];
  
  // Title fees
  if (data.title_agent_fees?.[party]) {
    data.title_agent_fees[party].forEach(fee => {
      total += fee.Amount || 0;
    });
  }
  
  // Recording fees (borrower only)
  if (party === 'borrower' && data.recording_fees) {
    data.recording_fees.forEach(fee => {
      total += fee.amount || 0;
    });
  }
  
  // Transfer taxes
  if (data.transfer_taxes?.[party]) {
    const taxes = data.transfer_taxes[party].flat ? data.transfer_taxes[party].flat(2) : data.transfer_taxes[party];
    taxes.forEach(tax => {
      total += tax.amount || 0;
    });
  }
  
  return total;
}

function downloadPdf() {
  if (!state.pdfBase64) {
    showToast('No PDF available', 'error');
    return;
  }
  
  const link = document.createElement('a');
  link.href = 'data:application/pdf;base64,' + state.pdfBase64;
  link.download = `closing-costs-${state.lastResponse?.search_id || 'report'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== Property Tax ====================
async function lookupPropertyTax(formData) {
  showLoading();
  try {
    const params = new URLSearchParams({
      state: formData.state,
      county: formData.county,
      city: formData.city,
      address: formData.address,
      close_date: formData.closeDate,
      purchase_price: formData.purchasePrice,
      file_name: formData.fileName || 'WebApp',
      session_id: state.sessionId
    });

    const response = await apiCall(`/api/property-tax?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      displayPropertyTaxResults(response);
      showToast('Property tax data retrieved', 'success');
    }
  } catch (error) {
    showToast('Lookup failed: ' + error.message, 'error');
  }
  hideLoading();
}

function displayPropertyTaxResults(data) {
  elements.ptResults.classList.remove('hidden');
  const container = document.getElementById('property-tax-content');
  
  if (data.status === 0 || data.message) {
    container.innerHTML = `
      <div class="tax-card">
        <p style="color: var(--text-secondary);">${data.message || 'No property tax data found'}</p>
        <p class="helper-text">Response details: ${data.response_details || 'N/A'}</p>
      </div>
    `;
    return;
  }

  let html = '';
  
  // Calculations
  if (data.calculations) {
    html += `
      <div class="tax-card">
        <h3>Calculated Values</h3>
        <div class="tax-row">
          <span class="tax-label">Escrow Amount</span>
          <span class="tax-value">$${formatCurrency(data.calculations.escrow_amount)}</span>
        </div>
        <div class="tax-row">
          <span class="tax-label">Tax Per Month</span>
          <span class="tax-value">$${formatCurrency(data.calculations.tax_per_month)}</span>
        </div>
        <div class="tax-row">
          <span class="tax-label">Escrow Due (Months)</span>
          <span class="tax-value">${data.calculations.escrow_due_months}</span>
        </div>
        <div class="tax-row">
          <span class="tax-label">Escrow Due (Days)</span>
          <span class="tax-value">${data.calculations.escrow_due_days}</span>
        </div>
      </div>
    `;
  }
  
  // Assessments
  if (data.assessments && data.assessments.length > 0) {
    html += `
      <div class="tax-card">
        <h3>Tax Assessments</h3>
        ${data.assessments.map(a => `
          <div class="tax-row">
            <span class="tax-label">Year ${a.tax_year}</span>
            <span class="tax-value">$${formatCurrency(a.tax_amount)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Tax Calendar
  if (data.tax_calendar) {
    html += `
      <div class="tax-card">
        <h3>Tax Calendar</h3>
        ${data.tax_calendar.next_due ? `
          <div class="tax-row">
            <span class="tax-label">Next Due Date</span>
            <span class="tax-value">${data.tax_calendar.next_due.date} (${data.tax_calendar.next_due.diff} days)</span>
          </div>
        ` : ''}
        ${data.tax_calendar.prev_due ? `
          <div class="tax-row">
            <span class="tax-label">Previous Due Date</span>
            <span class="tax-value">${data.tax_calendar.prev_due.date} (${data.tax_calendar.prev_due.diff} days ago)</span>
          </div>
        ` : ''}
        ${data.tax_calendar.full_cal && data.tax_calendar.full_cal.length > 0 ? `
          <div class="tax-due-dates">
            <strong>All Due Dates:</strong>
            ${data.tax_calendar.full_cal.map(d => `<span class="due-date-badge">${d.date}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  container.innerHTML = html || '<div class="tax-card"><p>No data available</p></div>';
}

// ==================== Locations Browser ====================
function displayCountiesInBrowser(counties) {
  elements.countiesList.innerHTML = counties.map(county => `
    <div class="location-item" data-county="${county}">${county}</div>
  `).join('');
  
  // Add click handlers
  elements.countiesList.querySelectorAll('.location-item').forEach(item => {
    item.addEventListener('click', () => {
      elements.countiesList.querySelectorAll('.location-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      
      const selectedState = elements.locState.value;
      const selectedCounty = item.dataset.county;
      loadTownships(selectedState, selectedCounty, null, displayTownshipsInBrowser);
    });
  });
}

function displayTownshipsInBrowser(townships) {
  if (!townships || townships.length === 0) {
    elements.townshipsList.innerHTML = '<p class="placeholder-text">No townships available</p>';
    return;
  }
  
  elements.townshipsList.innerHTML = townships.map(township => `
    <div class="location-item">${township}</div>
  `).join('');
}

// ==================== Build Document Type Object ====================
function buildDocTypeObject() {
  const docType = {};
  
  // Deed
  const deedPages = parseInt(document.getElementById('doc-deed-pages')?.value) || 0;
  if (deedPages > 0) {
    docType.deed = {
      page_count: deedPages,
      num_count: 1,
      num_grantors: parseInt(document.getElementById('doc-deed-grantors')?.value) || 1,
      num_grantees: parseInt(document.getElementById('doc-deed-grantees')?.value) || 1
    };
  }
  
  // Mortgage
  const mortPages = parseInt(document.getElementById('doc-mort-pages')?.value) || 0;
  if (mortPages > 0) {
    docType.mort = {
      page_count: mortPages,
      num_count: 1,
      num_grantors: parseInt(document.getElementById('doc-mort-grantors')?.value) || 1,
      num_grantees: parseInt(document.getElementById('doc-mort-grantees')?.value) || 1
    };
  }
  
  // Release
  const releasePages = parseInt(document.getElementById('doc-release-pages')?.value) || 0;
  if (releasePages > 0) {
    docType.release = {
      page_count: releasePages,
      num_count: parseInt(document.getElementById('doc-release-count')?.value) || 1
    };
  }
  
  // Assignment
  const assignPages = parseInt(document.getElementById('doc-assign-pages')?.value) || 0;
  if (assignPages > 0) {
    docType.assign = {
      page_count: assignPages,
      num_count: parseInt(document.getElementById('doc-assign-count')?.value) || 1
    };
  }
  
  return Object.keys(docType).length > 0 ? docType : null;
}

// ==================== View Navigation ====================
function initializeNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.dataset.view;
      
      // Update nav
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Update view
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`${viewId}-view`).classList.add('active');
    });
  });
}

// ==================== Fee Tab Navigation ====================
function initializeFeeTabs() {
  document.querySelectorAll('.fee-tabs').forEach(tabContainer => {
    tabContainer.querySelectorAll('.fee-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        const parent = tab.closest('.card-body');
        
        // Update tabs
        tabContainer.querySelectorAll('.fee-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content
        parent.querySelectorAll('.fee-list').forEach(list => list.classList.remove('active'));
        parent.querySelector(`#${targetId}`).classList.add('active');
      });
    });
  });
}

// ==================== Collapsible Sections ====================
function initializeCollapsibles() {
  document.querySelectorAll('.section-title[data-toggle]').forEach(title => {
    title.addEventListener('click', () => {
      const section = title.closest('.form-section');
      section.classList.toggle('collapsed');
    });
  });
}

// ==================== Event Listeners ====================
function initializeEventListeners() {
  // Connect button
  elements.connectBtn.addEventListener('click', connect);
  
  // ========== Closing Costs Form ==========
  elements.ccState.addEventListener('change', (e) => {
    if (e.target.value) {
      loadCounties(e.target.value, elements.ccCounty);
      elements.ccTownship.innerHTML = '<option value="">Select Township</option>';
      elements.ccTownship.disabled = true;
    }
  });
  
  elements.ccCounty.addEventListener('change', (e) => {
    if (e.target.value) {
      loadTownships(elements.ccState.value, e.target.value, elements.ccTownship);
    }
  });
  
  // Show/hide refinance section based on purpose
  elements.ccPurpose.addEventListener('change', (e) => {
    const isRefinance = e.target.value === '00' || e.target.value === '04';
    elements.refinanceSection.style.display = isRefinance ? 'block' : 'none';
  });
  
  // Geocode check button
  document.getElementById('geocode-check-btn')?.addEventListener('click', async () => {
    const stateVal = elements.ccState.value;
    const countyVal = elements.ccCounty.value;
    const townshipVal = elements.ccTownship.value;
    const addressVal = document.getElementById('cc-address').value;
    
    if (!stateVal || !countyVal || !townshipVal || !addressVal) {
      showToast('Please fill in state, county, township, and address first', 'error');
      return;
    }
    
    const result = await geocodeCheck({
      state: stateVal,
      county: countyVal,
      township: townshipVal,
      address: addressVal
    });
  });
  
  // Load endorsements button
  document.getElementById('load-endorsements-btn')?.addEventListener('click', async () => {
    const stateVal = elements.ccState.value;
    const countyVal = elements.ccCounty.value;
    const purposeVal = elements.ccPurpose.value;
    
    if (!stateVal || !countyVal) {
      showToast('Please select state and county first', 'error');
      return;
    }
    
    const endorsements = await loadEndorsements(stateVal, countyVal, purposeVal);
    displayEndorsements(endorsements, 'cc-endorsements-list', true);
  });
  
  // Load questions button
  document.getElementById('load-questions-btn')?.addEventListener('click', async () => {
    const stateVal = elements.ccState.value;
    const purposeVal = elements.ccPurpose.value;
    
    if (!stateVal) {
      showToast('Please select state first', 'error');
      return;
    }
    
    const questions = await loadQuestions(stateVal, purposeVal);
    displayQuestions(questions, 'cc-questions-list');
  });
  
  // Load sub-agents button (in closing costs form)
  document.getElementById('load-sub-agents-btn')?.addEventListener('click', async () => {
    const stateVal = elements.ccState.value;
    const countyVal = elements.ccCounty.value;
    const purposeVal = elements.ccPurpose.value;
    
    if (!stateVal || !countyVal) {
      showToast('Please select state and county first', 'error');
      return;
    }
    
    await loadSubAgents(true, stateVal, countyVal, purposeVal);
  });
  
  // Main form submission
  elements.ccForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    // Collect all form data
    const formData = {
      state: elements.ccState.value,
      county: elements.ccCounty.value,
      township: elements.ccTownship.value,
      searchType: document.getElementById('cc-search-type').value,
      purpose: elements.ccPurpose.value,
      purchasePrice: document.getElementById('cc-purchase-price').value,
      loanAmount: document.getElementById('cc-loan-amount').value,
      filename: document.getElementById('cc-filename').value,
      address: document.getElementById('cc-address').value,
      closeDate: document.getElementById('cc-close-date').value,
      
      // Refinance
      priorInsurance: document.getElementById('cc-prior-insurance').value,
      exdebt: document.getElementById('cc-exdebt').value,
      priorInsuranceDate: document.getElementById('cc-prior-insurance-date').value,
      
      // Loan info
      propType: document.getElementById('cc-prop-type').value,
      loanType: document.getElementById('cc-loan-type').value,
      amortType: document.getElementById('cc-amort-type').value,
      propPurpose: document.getElementById('cc-prop-purpose').value,
      propUsage: document.getElementById('cc-prop-usage').value,
      numFamilies: document.getElementById('cc-num-families').value,
      firstTimeBuyer: document.getElementById('cc-first-time-buyer').checked,
      federalCreditUnion: document.getElementById('cc-federal-credit-union').checked,
      sameLender: document.getElementById('cc-same-lender').checked,
      sameBorrowers: document.getElementById('cc-same-borrowers').checked,
      
      // Policy levels
      loanpolLevel: document.getElementById('cc-loanpol-level').value,
      ownersLevel: document.getElementById('cc-owners-level').value,
      
      // Sub-agent
      clientId: document.getElementById('cc-client-id').value,
      agentId: document.getElementById('cc-agent-id').value,
      
      // Endorsements
      endorsements: collectSelectedEndorsements('cc-endorsements-list'),
      
      // Questions
      qst: collectQuestionAnswers('cc-questions-list'),
      
      // Document types
      docType: buildDocTypeObject(),
      
      // Output options
      includeFullPolicy: document.getElementById('cc-include-full-policy').checked,
      includeSection: document.getElementById('cc-include-section').checked,
      includePayee: document.getElementById('cc-include-payee').checked,
      includePdf: document.getElementById('cc-include-pdf').checked,
      includeSellerResponsible: document.getElementById('cc-include-seller-responsible').checked,
      includePropertyTax: document.getElementById('cc-include-property-tax').checked,
      includeAppraisal: document.getElementById('cc-include-appraisal').checked
    };
    
    calculateClosingCosts(formData);
  });
  
  // Clear form
  document.getElementById('clear-form-btn').addEventListener('click', () => {
    elements.ccForm.reset();
    elements.resultsSection.classList.add('hidden');
    elements.ccCounty.disabled = true;
    elements.ccTownship.disabled = true;
    elements.refinanceSection.style.display = 'none';
    document.getElementById('cc-endorsements-list').innerHTML = '';
    document.getElementById('cc-questions-list').innerHTML = '';
  });
  
  // Download PDF
  document.getElementById('download-pdf-btn')?.addEventListener('click', downloadPdf);
  
  // Toggle raw JSON
  document.getElementById('toggle-raw-json')?.addEventListener('click', () => {
    const output = document.getElementById('raw-json-output');
    const btn = document.getElementById('toggle-raw-json');
    output.classList.toggle('hidden');
    btn.textContent = output.classList.contains('hidden') ? 'Show Raw JSON' : 'Hide Raw JSON';
  });
  
  // ========== Property Tax Form ==========
  elements.ptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    lookupPropertyTax({
      state: elements.ptState.value,
      county: document.getElementById('pt-county').value,
      city: document.getElementById('pt-city').value,
      address: document.getElementById('pt-address').value,
      closeDate: document.getElementById('pt-close-date').value,
      purchasePrice: document.getElementById('pt-purchase-price').value,
      fileName: document.getElementById('pt-file-name').value
    });
  });
  
  // ========== Endorsements Form ==========
  elements.endoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    const endorsements = await loadEndorsements(
      elements.endoState.value,
      document.getElementById('endo-county').value,
      document.getElementById('endo-purpose').value
    );
    displayEndorsements(endorsements, 'endorsements-list');
    elements.endoResults.classList.remove('hidden');
  });
  
  // ========== Questions Form ==========
  elements.qstForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    const questions = await loadQuestions(
      elements.qstState.value,
      document.getElementById('qst-purpose').value
    );
    displayQuestions(questions, 'questions-list');
    elements.qstResults.classList.remove('hidden');
  });
  
  // ========== Geocode Form ==========
  elements.geoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    geocodeCheck({
      state: elements.geoState.value,
      county: document.getElementById('geo-county').value,
      township: document.getElementById('geo-township').value,
      address: document.getElementById('geo-address').value
    });
  });
  
  // ========== Sub-Agents View ==========
  document.getElementById('load-sub-agents')?.addEventListener('click', () => {
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    const includeContact = document.getElementById('sa-include-contact').checked;
    const stateVal = document.getElementById('sa-state')?.value;
    const countyVal = document.getElementById('sa-county')?.value;
    const purposeVal = document.getElementById('sa-purpose')?.value;
    
    if (!stateVal || !countyVal || !purposeVal) {
      showToast('Please fill in state, county, and purpose', 'error');
      return;
    }
    
    loadSubAgents(includeContact, stateVal, countyVal, purposeVal);
  });
  
  // ========== Locations Browser ==========
  elements.locState.addEventListener('change', (e) => {
    if (e.target.value && state.isConnected) {
      const selectedState = e.target.value;
      loadCounties(selectedState, null, displayCountiesInBrowser);
      elements.townshipsList.innerHTML = '<p class="placeholder-text">Select a county to view townships</p>';
    }
  });
  
  // Set default close date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('cc-close-date').value = today;
  document.getElementById('pt-close-date').value = today;
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  populateStateSelects();
  initializeNavigation();
  initializeFeeTabs();
  initializeCollapsibles();
  initializeEventListeners();
  
  console.log('LodeStar Web App initialized - Full Feature Version');
});
