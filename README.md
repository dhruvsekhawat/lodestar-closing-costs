# LodeStar Closing Cost Calculator - Web Interface

A beautiful, modern web interface for the LodeStar API that allows you to calculate closing costs, property taxes, and browse reference data.

![LodeStar Web App](https://img.shields.io/badge/LodeStar-API%20v2.4.1-10b981)

## Features

- 🏠 **Closing Cost Calculator** - Calculate transfer taxes, recording fees, title fees, and title premiums
- 📋 **Property Tax Lookup** - Get estimated property tax information for any address
- ✅ **Endorsements Browser** - View available endorsements for any location
- 📍 **Location Browser** - Browse counties and townships by state

## Quick Start

### 1. Install Dependencies

```bash
cd web-app
npm install
```

### 2. Configure Environment

Create a `.env` file in the `web-app` directory:

```bash
# LodeStar API Configuration
LODESTAR_CLIENT_NAME=Settlewise
LODESTAR_USERNAME=your_email@example.com
LODESTAR_PASSWORD=your_password

# Server Configuration
PORT=3000
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Connecting to LodeStar

1. Click the **Connect** button in the header
2. The app will automatically log in using your configured credentials
3. Once connected, you'll see a green "Connected" status

### Calculating Closing Costs

1. Select **State** → **County** → **Township**
2. Choose transaction type (Purchase/Refinance)
3. Enter purchase price and loan amount
4. Optionally fill in loan information
5. Click **Calculate Closing Costs**

### Looking Up Property Tax

1. Navigate to **Property Tax** in the sidebar
2. Fill in the property details
3. Click **Lookup Property Tax**

## API Endpoints

The web app exposes the following API routes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auto-login` | POST | Login with configured credentials |
| `/api/login` | POST | Login with custom credentials |
| `/api/counties` | GET | Get counties for a state |
| `/api/townships` | GET | Get townships for a county |
| `/api/endorsements` | GET | Get available endorsements |
| `/api/closing-costs` | POST | Calculate closing costs |
| `/api/property-tax` | GET | Get property tax information |

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript, CSS3
- **Fonts**: DM Sans, JetBrains Mono
- **Design**: Dark theme with emerald accent

## Project Structure

```
web-app/
├── server.js          # Express server & API proxy
├── package.json       # Dependencies
├── .env               # Configuration (create this)
├── README.md          # This file
└── public/
    ├── index.html     # Main HTML
    ├── styles.css     # Styling
    └── app.js         # Frontend logic
```

## Troubleshooting

### "Not Connected" Error
- Check your `.env` file has correct credentials
- Verify the LodeStar API is accessible
- Check server console for error messages

### Counties/Townships Not Loading
- Make sure you're connected first
- Some states may have limited coverage

### CORS Errors
- The Express server proxies all requests to avoid CORS issues
- Don't call the LodeStar API directly from the browser

## License

MIT - Built for demo purposes with the LodeStar API.
