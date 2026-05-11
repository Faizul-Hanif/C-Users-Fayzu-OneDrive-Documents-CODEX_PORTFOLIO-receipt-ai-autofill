# Receipt AI Auto-Fill

Receipt AI Auto-Fill is a polished AI Intern Assessment project that extracts key fields from a receipt image with the Gemini API, auto-fills an editable review form, and stores submitted receipts locally.

## Project Overview

The app follows a simple three-step workflow:

1. Upload a receipt image.
2. Analyze the receipt through a secure backend API route.
3. Review, edit, and submit the extracted receipt data.

Submitted receipts are saved in browser `localStorage`, displayed in a history table, and can be exported as CSV.

## Features

- Receipt image upload with drag-and-drop support.
- Receipt preview before extraction.
- Secure `/api/extract` backend route for Gemini API calls.
- AI extraction for merchant name, date, total amount, and currency.
- Exact extraction JSON contract with field-level confidence scores.
- Editable review form with smart validation.
- Confidence warnings for fields below 70%.
- Demo mode with realistic sample receipt data and no API call.
- Local receipt history stored in `localStorage`.
- Clear history action.
- Copy extracted JSON.
- Download submitted receipts as CSV.
- Responsive Tailwind CSS dashboard UI.
- Vercel-ready static build output in `dist`.

## Tech Stack

- HTML, CSS, and vanilla JavaScript
- Tailwind CSS via CDN for the assessment UI
- Node.js local development server
- Vercel Serverless Function in `api/extract.js`
- Gemini API through Google AI Studio
- Browser `localStorage`

This is not a Vite React project. The production build copies static assets from `public` to `dist`.

## How to Run Locally

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add your server-side Gemini key from Google AI Studio:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Start the local development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

On Windows PowerShell, if script execution blocks `npm`, use:

```powershell
npm.cmd run dev
```

## Production Build

Run:

```bash
npm run build
```

Build output directory:

```text
dist
```

Optional local preview of the built static output:

```bash
npm run preview
```

## How to Deploy on Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Add the required environment variable in Vercel:
   - `GEMINI_API_KEY`
4. Optionally add:
   - `GEMINI_MODEL=gemini-2.5-flash`
5. Use these Vercel settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Deploy.

The repository includes `vercel.json` with the same build command and output directory.

## Required Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is required for live AI extraction. Create it in Google AI Studio.

`GEMINI_MODEL` is optional. If omitted, the backend defaults to `gemini-2.5-flash`.

API keys are not exposed in frontend code. The browser calls `/api/extract`, and the backend reads `GEMINI_API_KEY` from `process.env`.

## AI Model and Extraction Prompt

Default model:

```text
gemini-2.5-flash
```

Prompt used in `lib/geminiExtractor.js`:

```text
You are an AI receipt extraction assistant.

Analyze the uploaded receipt image and extract only the following fields:
- merchantName
- date
- totalAmount
- currency

Return only valid JSON in this exact format:

{
  "merchantName": "",
  "date": "YYYY-MM-DD",
  "totalAmount": 0,
  "currency": "MYR",
  "confidence": {
    "merchantName": 0,
    "date": 0,
    "totalAmount": 0,
    "currency": 0
  },
  "notes": ""
}

Rules:
- Do not include markdown.
- Do not guess if the field is not visible.
- If a field is unclear, return an empty value and low confidence.
- Normalize the date to YYYY-MM-DD.
- Extract the final payable amount, not subtotal or tax.
- Use MYR if the receipt appears to be from Malaysia.
- Confidence must be a number between 0 and 100.
```

## Error Handling

The app handles:

- No receipt image uploaded.
- Unsupported image file type.
- Missing `GEMINI_API_KEY`.
- Invalid request JSON.
- Gemini network/API failure.
- Empty or malformed Gemini response.
- Invalid date, missing merchant, invalid total amount, and invalid currency before submit.

## Architecture

```text
Browser
  public/index.html
  public/app.js
  public/styles.css
    - Uploads and compresses receipt image
    - Calls /api/extract
    - Renders confidence, validation, history, JSON copy, CSV export

Backend
  api/extract.js
  lib/geminiExtractor.js
    - Reads GEMINI_API_KEY from process.env
    - Sends receipt image to Gemini as inline image data
    - Validates and normalizes the Gemini JSON response

Build
  scripts/build.js
    - Copies public assets into dist for Vercel static hosting
```

## Limitations and Future Improvements

- Receipt quality affects extraction accuracy.
- `localStorage` is browser-local and not shared across devices.
- Tailwind is loaded by CDN for this lightweight assessment build; a larger production app could compile Tailwind during build.
- Future improvements could add authentication, a database, batch upload, OCR fallback, duplicate detection, and line-item extraction.

