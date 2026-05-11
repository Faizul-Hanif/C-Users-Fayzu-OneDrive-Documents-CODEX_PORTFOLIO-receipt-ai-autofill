const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const EXTRACTION_PROMPT = `You are an AI receipt extraction assistant.

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
- Confidence must be a number between 0 and 100.`;

function readEnv(name) {
  return process.env[name] || "";
}

function hasUsableApiKey(value) {
  const key = String(value || "").trim();

  return Boolean(key) && !key.includes("your_") && !key.includes("_here");
}

function parseImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    throw new Error("No receipt image uploaded. Please upload a receipt image first.");
  }

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid receipt image upload. Expected a base64 image data URL.");
  }

  const approximateBytes = Math.ceil((match[2].length * 3) / 4);
  const maxBytes = 8 * 1024 * 1024;

  if (approximateBytes > maxBytes) {
    throw new Error("Image is too large after compression. Please try a smaller receipt image.");
  }

  return {
    mimeType: match[1],
    base64Data: match[2]
  };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Invalid Gemini response: no JSON object was returned.");
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      throw new Error("Invalid Gemini response: malformed JSON returned by the model.");
    }
  }
}

function normalizeConfidence(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeAmount(value) {
  const cleaned = String(value ?? "").replace(/[^\d.,-]/g, "").replace(/,/g, "").trim();
  const numeric = Number(cleaned);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Number(numeric.toFixed(2));
}

function normalizeExtraction(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const confidence = value.confidence && typeof value.confidence === "object" ? value.confidence : {};

  return {
    merchantName: String(value.merchantName || "").trim(),
    date: String(value.date || "").trim(),
    totalAmount: normalizeAmount(value.totalAmount),
    currency: String(value.currency || "").trim().toUpperCase(),
    confidence: {
      merchantName: normalizeConfidence(confidence.merchantName),
      date: normalizeConfidence(confidence.date),
      totalAmount: normalizeConfidence(confidence.totalAmount),
      currency: normalizeConfidence(confidence.currency)
    },
    notes: String(value.notes || "").trim()
  };
}

function toUiFields(extraction) {
  return {
    merchant_name: extraction.merchantName,
    date: extraction.date,
    total_amount: extraction.totalAmount > 0 ? String(extraction.totalAmount) : "",
    currency: extraction.currency,
    merchantNameConfidence: extraction.confidence.merchantName,
    dateConfidence: extraction.confidence.date,
    totalAmountConfidence: extraction.confidence.totalAmount,
    currencyConfidence: extraction.confidence.currency
  };
}

function toUiConfidence(extraction) {
  return {
    merchantNameConfidence: extraction.confidence.merchantName,
    dateConfidence: extraction.confidence.date,
    totalAmountConfidence: extraction.confidence.totalAmount,
    currencyConfidence: extraction.confidence.currency
  };
}

function readGeminiText(payload) {
  const candidate = payload.candidates && payload.candidates[0];

  if (!candidate) {
    const reason = payload.promptFeedback && payload.promptFeedback.blockReason
      ? ` Block reason: ${payload.promptFeedback.blockReason}.`
      : "";
    throw new Error(`Invalid Gemini response: no candidate was returned.${reason}`);
  }

  const parts = candidate.content && Array.isArray(candidate.content.parts)
    ? candidate.content.parts
    : [];
  const text = parts.map((part) => part.text || "").join("").trim();

  if (!text) {
    throw new Error("Invalid Gemini response: the extraction result was empty.");
  }

  return text;
}

function geminiApiErrorMessage(response, payload, model) {
  const rawMessage =
    payload.error && payload.error.message
      ? String(payload.error.message)
      : "Gemini request failed.";
  const lowerMessage = rawMessage.toLowerCase();

  if (response.status === 429 || lowerMessage.includes("quota")) {
    return `Gemini quota exceeded for ${model}. Check Google AI Studio quota/billing, wait for quota reset, or use another Gemini API key.`;
  }

  if (response.status === 400 && lowerMessage.includes("not found")) {
    return `Gemini model ${model} is not available for this API key. Set GEMINI_MODEL to a supported model in your .env file.`;
  }

  if (response.status === 400 && lowerMessage.includes("api key")) {
    return "Gemini API key is invalid. Check GEMINI_API_KEY in your .env file.";
  }

  if (response.status === 403 || lowerMessage.includes("permission")) {
    return "Gemini API access denied. Check that your API key is enabled for the Gemini API in Google AI Studio.";
  }

  return `Network/API error. Gemini request failed: ${rawMessage}`;
}

async function extractReceiptFromImage(imageDataUrl) {
  const { mimeType, base64Data } = parseImageDataUrl(imageDataUrl);
  const apiKey = readEnv("GEMINI_API_KEY");
  const model = readEnv("GEMINI_MODEL") || "gemini-2.5-flash";

  if (!hasUsableApiKey(apiKey)) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to a .env file in the project root or to your Vercel environment variables."
    );
  }

  let response;

  try {
    response = await fetch(`${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: EXTRACTION_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          response_mime_type: "application/json"
        }
      })
    });
  } catch (_) {
    throw new Error("Network/API error. Could not reach the Gemini extraction service.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(geminiApiErrorMessage(response, payload, model));
  }

  const extraction = normalizeExtraction(safeJsonParse(readGeminiText(payload)));

  return {
    fields: toUiFields(extraction),
    confidence: toUiConfidence(extraction),
    extraction,
    model
  };
}

module.exports = {
  EXTRACTION_PROMPT,
  extractReceiptFromImage
};
