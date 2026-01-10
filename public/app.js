// ==================== State Management ====================
const state = {
  sessionId: null,
  isConnected: false,
  counties: [],
  townships: [],
  selectedCounty: null
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
  resultsSection: document.getElementById('results-section'),
  
  // Property Tax
  ptForm: document.getElementById('property-tax-form'),
  ptState: document.getElementById('pt-state'),
  ptResults: document.getElementById('property-tax-results'),
  
  // Endorsements
  endoForm: document.getElementById('endorsements-form'),
  endoState: document.getElementById('endo-state'),
  endoResults: document.getElementById('endorsements-results'),
  
  // Locations
  locState: document.getElementById('loc-state'),
  countiesList: document.getElementById('counties-list'),
  townshipsList: document.getElementById('townships-list')
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
  elements.sessionStatus.querySelector('.status-text').textContent = 
    connected ? `Connected (${username})` : 'Not Connected';
  elements.connectBtn.textContent = connected ? 'Reconnect' : 'Connect';
}

// ==================== State Selects ====================
function populateStateSelects() {
  const stateSelects = [elements.ccState, elements.ptState, elements.endoState, elements.locState];
  
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
      showToast(response.message || 'Failed to load counties', 'error');
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
      showToast(response.message || 'Failed to load townships', 'error');
    }
  } catch (error) {
    showToast('Failed to load townships', 'error');
  }
  hideLoading();
}

// ==================== Closing Costs ====================
async function calculateClosingCosts(formData) {
  showLoading();
  try {
    const requestBody = {
      session_id: state.sessionId,
      state: formData.state,
      county: formData.county,
      township: formData.township,
      search_type: formData.searchType,
      purpose: formData.purpose,
      loan_amount: parseFloat(formData.loanAmount) || 0,
      purchase_price: parseFloat(formData.purchasePrice) || 0
    };

    if (formData.address) requestBody.address = formData.address;
    if (formData.closeDate) requestBody.close_date = formData.closeDate;
    
    // Add loan info if provided
    const loanInfo = {};
    if (formData.propType) loanInfo.prop_type = parseInt(formData.propType);
    if (formData.loanType) loanInfo.loan_type = parseInt(formData.loanType);
    if (formData.amortType) loanInfo.amort_type = parseInt(formData.amortType);
    if (formData.firstTimeBuyer) loanInfo.is_first_time_home_buyer = 1;
    if (formData.federalCreditUnion) loanInfo.is_federal_credit_union = 1;
    
    if (Object.keys(loanInfo).length > 0) {
      requestBody.loan_info = loanInfo;
    }

    console.log('Request:', requestBody);
    
    const response = await apiCall('/api/closing-costs', {
      method: 'POST',
      body: requestBody
    });

    console.log('Response:', response);
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      displayClosingCostResults(response);
      showToast('Calculation complete', 'success');
    }
  } catch (error) {
    showToast('Calculation failed: ' + error.message, 'error');
  }
  hideLoading();
}

function displayClosingCostResults(data) {
  elements.resultsSection.classList.remove('hidden');
  
  // Search ID
  document.getElementById('search-id-value').textContent = data.search_id || '-';
  
  // Premiums
  document.getElementById('loan-policy-borrower').textContent = formatCurrency(data.loan_policy_premium?.borrower);
  document.getElementById('loan-policy-seller').textContent = formatCurrency(data.loan_policy_premium?.seller);
  document.getElementById('owners-policy-borrower').textContent = formatCurrency(data.owners_policy_premium?.borrower);
  document.getElementById('owners-policy-seller').textContent = formatCurrency(data.owners_policy_premium?.seller);
  document.getElementById('simissue').textContent = formatCurrency(data.simissue);
  
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
            <div class="fee-meta">${fee.MismoMap || ''}</div>
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
      </div>
    `;
  }
  
  container.innerHTML = html || '<div class="tax-card"><p>No data available</p></div>';
}

// ==================== Endorsements ====================
async function loadEndorsements(stateCode, county, purpose) {
  showLoading();
  try {
    const params = new URLSearchParams({ state: stateCode, county, purpose, session_id: state.sessionId });
    const response = await apiCall(`/api/endorsements?${params}`);
    
    if (response.error) {
      showToast(response.error, 'error');
    } else {
      displayEndorsements(response);
    }
  } catch (error) {
    showToast('Failed to load endorsements', 'error');
  }
  hideLoading();
}

function displayEndorsements(data) {
  elements.endoResults.classList.remove('hidden');
  const container = document.getElementById('endorsements-list');
  
  if (!data.endorsements || data.endorsements.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No endorsements available</p>';
    return;
  }
  
  container.innerHTML = data.endorsements.map(endo => `
    <div class="endorsement-card ${endo.default === 1 ? 'default' : ''}">
      <input type="checkbox" class="endorsement-checkbox" ${endo.default === 1 ? 'checked' : ''} 
             data-endo-id="${endo.endo_id}">
      <div class="endorsement-info">
        <div class="endorsement-name">${endo.name}</div>
        <div class="endorsement-id">ID: ${endo.endo_id}</div>
      </div>
      ${endo.default === 1 ? '<span class="endorsement-badge">Default</span>' : ''}
    </div>
  `).join('');
}

// ==================== Locations Browser ====================
function displayCounties(counties) {
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
      loadTownships(selectedState, selectedCounty, null, displayTownships);
    });
  });
}

function displayTownships(townships) {
  if (!townships || townships.length === 0) {
    elements.townshipsList.innerHTML = '<p class="placeholder-text">No townships available</p>';
    return;
  }
  
  elements.townshipsList.innerHTML = townships.map(township => `
    <div class="location-item">${township}</div>
  `).join('');
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
  
  // Closing Costs Form
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
  
  elements.ccForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    calculateClosingCosts({
      state: elements.ccState.value,
      county: elements.ccCounty.value,
      township: elements.ccTownship.value,
      searchType: document.getElementById('cc-search-type').value,
      purpose: document.getElementById('cc-purpose').value,
      purchasePrice: document.getElementById('cc-purchase-price').value,
      loanAmount: document.getElementById('cc-loan-amount').value,
      address: document.getElementById('cc-address').value,
      closeDate: document.getElementById('cc-close-date').value,
      propType: document.getElementById('cc-prop-type').value,
      loanType: document.getElementById('cc-loan-type').value,
      amortType: document.getElementById('cc-amort-type').value,
      firstTimeBuyer: document.getElementById('cc-first-time-buyer').checked,
      federalCreditUnion: document.getElementById('cc-federal-credit-union').checked
    });
  });
  
  document.getElementById('clear-form-btn').addEventListener('click', () => {
    elements.ccForm.reset();
    elements.resultsSection.classList.add('hidden');
    elements.ccCounty.disabled = true;
    elements.ccTownship.disabled = true;
  });
  
  // Property Tax Form
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
      purchasePrice: document.getElementById('pt-purchase-price').value
    });
  });
  
  // Endorsements Form
  elements.endoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.isConnected) {
      showToast('Please connect first', 'error');
      return;
    }
    
    loadEndorsements(
      elements.endoState.value,
      document.getElementById('endo-county').value,
      document.getElementById('endo-purpose').value
    );
  });
  
  // Locations browser
  elements.locState.addEventListener('change', (e) => {
    if (e.target.value && state.isConnected) {
      const selectedState = e.target.value;
      loadCounties(selectedState, null, displayCounties);
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
  
  console.log('LodeStar Web App initialized');
});
