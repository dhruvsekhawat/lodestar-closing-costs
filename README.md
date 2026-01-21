# LodeStar Closing Cost Calculator - Full Feature Web App

A comprehensive web interface for the LodeStar API that supports all endpoints and features for calculating closing costs, transfer taxes, recording fees, title premiums, property taxes, and more.

## Features

### Core Calculations
- **Closing Cost Calculator** - Full CFPB and Title-only calculations with all parameters
- **Property Tax Lookup** - Tax assessments, escrow calculations, and payment calendars

### Reference Data
- **Endorsements** - View and select available title endorsements
- **Dynamic Questions** - State/purpose-specific questions for accurate calculations
- **Sub-Agents** - Browse available title/escrow agents with contact info
- **Location Browser** - Explore counties and townships by state
- **Geocode Check** - Verify tax-relevant township for property addresses

### Advanced Features
- Refinance-specific inputs (prior insurance, existing debt)
- Document type specifications for recording fees
- Policy level selection (Standard/Enhanced)
- Sub-agent/title company selection
- Full policy amount breakdowns
- PDF report generation
- Payee information
- LE/CD section mapping
- Raw JSON response viewer

## Setup

### 1. Install Dependencies

```bash
cd web-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `web-app` directory:

```env
LODESTAR_USERNAME=api@mloengine.com
LODESTAR_PASSWORD=2B?5xA3NcEt5
LODESTAR_CLIENT_NAME=LodeStar_Discovery_API
```

### 3. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The app will be available at `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auto-login` | POST | Authenticate using configured credentials |
| `/api/counties` | GET | Get counties for a state |
| `/api/townships` | GET | Get townships for a county |
| `/api/geocode-check` | GET | Verify tax-relevant township |
| `/api/questions` | GET | Get dynamic questions for state/purpose |
| `/api/endorsements` | GET | Get available endorsements |
| `/api/sub-agents` | GET | Get available title/escrow agents |
| `/api/appraisal-modifiers` | GET | Get appraisal modifier options |
| `/api/closing-costs` | POST | Calculate closing costs (full) |
| `/api/property-tax` | GET | Get property tax information |
| `/api/search-results` | GET | Retrieve previous search by file name |

## Closing Cost Request Parameters

### Required Fields
- `state` - Two-letter state code (e.g., "NJ")
- `county` - County name
- `township` - Township/municipality name
- `search_type` - "CFPB" (full) or "Title" (title only)
- `purpose` - "11" (Purchase), "00" (Refinance), "04" (Refinance Reissue)

### Financial Fields
- `loan_amount` - Loan amount
- `purchase_price` - Purchase price
- `address` - Property street address
- `close_date` - Closing date (YYYY-MM-DD)
- `filename` - Unique file/loan identifier

### Refinance Fields
- `prior_insurance` - Prior insurance amount
- `exdebt` - Existing debt amount
- `prior_insurance_date` - Prior policy date

### Loan Info Object
```json
{
  "prop_type": 1,           // 1-7: SFH, Multi, Condo, Coop, PUD, Manufactured, Land
  "loan_type": 1,           // 1-4: Conventional, FHA, VA, USDA
  "amort_type": 1,          // 1-2: Fixed, ARM
  "prop_purpose": 1,        // 1-3: Primary, Secondary, Investment
  "prop_usage": 1,          // 1-3: Residential, Commercial, Mixed-use
  "number_of_families": 1,
  "is_first_time_home_buyer": 0,
  "is_federal_credit_union": 0,
  "is_same_lender_as_previous": 0,
  "is_same_borrowers_as_previous": 0
}
```

### Document Type Object
```json
{
  "deed": { "page_count": 10, "num_grantors": 1, "num_grantees": 1 },
  "mort": { "page_count": 25, "num_grantors": 1, "num_grantees": 1 },
  "release": { "page_count": 3, "num_count": 1 },
  "assign": { "page_count": 2, "num_count": 1 }
}
```

### Output Options (set to 1 to enable)
- `include_full_policy_amount` - Full policy breakdowns
- `include_section` - LE/CD section mapping
- `include_payee_info` - Payee information
- `include_pdf` - Base64 PDF output
- `include_seller_responsible` - Seller-paid flags
- `include_property_tax` - Inline property tax (extra charge)
- `include_appraisal` - Inline appraisal (extra charge)

## Deployment (Vercel)

The app is configured for Vercel serverless deployment:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `LODESTAR_USERNAME`
   - `LODESTAR_PASSWORD`
   - `LODESTAR_CLIENT_NAME`
4. Deploy

## Project Structure

```
web-app/
├── api/                    # Vercel serverless functions
│   ├── auto-login.js
│   ├── closing-costs.js
│   ├── counties.js
│   ├── endorsements.js
│   ├── geocode-check.js
│   ├── property-tax.js
│   ├── questions.js
│   ├── search-results.js
│   ├── sub-agents.js
│   └── townships.js
├── public/                 # Static frontend files
│   ├── app.js             # Frontend JavaScript
│   ├── index.html         # Main HTML
│   └── styles.css         # Styles
├── .env                   # Environment variables (create this)
├── package.json
├── server.js              # Express server (local dev)
└── vercel.json            # Vercel configuration
```

## LodeStar API Documentation

For complete API documentation, refer to the official LodeStar documentation or contact support@lssoftwaresolutions.com.

### Important Notes

- Purpose codes have leading zeros: "00", "04", "11"
- Dates must be YYYY-MM-DD format
- `include_property_tax` and `include_appraisal` incur additional charges
- County names should not include the word "County"
- Fuzzy matching is used for county names if not from LodeStar's list
