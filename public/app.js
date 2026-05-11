const STORAGE_KEY = "receiptSubmissions";
const LOW_CONFIDENCE = 70;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COMMON_CURRENCY_CODES = ["MYR", "USD", "SGD", "EUR", "GBP"];

const FIELD_CONFIG = [
  {
    fieldKey: "merchant_name",
    inputId: "merchantName",
    messageId: "merchantNameMessage",
    confidenceKey: "merchantNameConfidence",
    confidenceTextId: "merchantNameConfidenceText",
    confidenceBarId: "merchantNameConfidenceBar",
    confidenceNoteId: "merchantNameConfidenceNote",
    confidencePillId: "merchantNameConfidencePill",
    label: "Merchant name"
  },
  {
    fieldKey: "date",
    inputId: "receiptDate",
    messageId: "dateMessage",
    confidenceKey: "dateConfidence",
    confidenceTextId: "dateConfidenceText",
    confidenceBarId: "dateConfidenceBar",
    confidenceNoteId: "dateConfidenceNote",
    confidencePillId: "dateConfidencePill",
    label: "Date"
  },
  {
    fieldKey: "total_amount",
    inputId: "totalAmount",
    messageId: "totalAmountMessage",
    confidenceKey: "totalAmountConfidence",
    confidenceTextId: "totalAmountConfidenceText",
    confidenceBarId: "totalAmountConfidenceBar",
    confidenceNoteId: "totalAmountConfidenceNote",
    confidencePillId: "totalAmountConfidencePill",
    label: "Total amount"
  },
  {
    fieldKey: "currency",
    inputId: "currency",
    messageId: "currencyMessage",
    confidenceKey: "currencyConfidence",
    confidenceTextId: "currencyConfidenceText",
    confidenceBarId: "currencyConfidenceBar",
    confidenceNoteId: "currencyConfidenceNote",
    confidencePillId: "currencyConfidencePill",
    label: "Currency"
  }
];

const SAMPLE_RESULT = {
  extraction: {
    merchantName: "Jaya Grocer KLCC",
    date: "2026-05-10",
    totalAmount: 87.45,
    currency: "MYR",
    confidence: {
      merchantName: 94,
      date: 88,
      totalAmount: 96,
      currency: 64
    },
    notes: "Demo data only. No API call was made."
  },
  fields: {
    merchant_name: "Jaya Grocer KLCC",
    date: "2026-05-10",
    total_amount: "87.45",
    currency: "MYR",
    merchantNameConfidence: 94,
    dateConfidence: 88,
    totalAmountConfidence: 96,
    currencyConfidence: 64
  },
  confidence: {
    merchantNameConfidence: 94,
    dateConfidence: 88,
    totalAmountConfidence: 96,
    currencyConfidence: 64
  },
  model: "Demo sample"
};

const els = {
  apiStatus: document.querySelector("#apiStatus"),
  clearButton: document.querySelector("#clearButton"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  copyJsonButton: document.querySelector("#copyJsonButton"),
  currency: document.querySelector("#currency"),
  currencyConfidenceBar: document.querySelector("#currencyConfidenceBar"),
  currencyConfidenceNote: document.querySelector("#currencyConfidenceNote"),
  currencyConfidencePill: document.querySelector("#currencyConfidencePill"),
  currencyConfidenceText: document.querySelector("#currencyConfidenceText"),
  currencyMessage: document.querySelector("#currencyMessage"),
  dateConfidenceBar: document.querySelector("#dateConfidenceBar"),
  dateConfidenceNote: document.querySelector("#dateConfidenceNote"),
  dateConfidencePill: document.querySelector("#dateConfidencePill"),
  dateConfidenceText: document.querySelector("#dateConfidenceText"),
  dateMessage: document.querySelector("#dateMessage"),
  downloadCsvButton: document.querySelector("#downloadCsvButton"),
  dropzone: document.querySelector("#dropzone"),
  errorAlert: document.querySelector("#errorAlert"),
  extractButton: document.querySelector("#extractButton"),
  extractionSummary: document.querySelector("#extractionSummary"),
  fileMeta: document.querySelector("#fileMeta"),
  form: document.querySelector("#receiptForm"),
  formSummary: document.querySelector("#formSummary"),
  historyCount: document.querySelector("#historyCount"),
  historyEmpty: document.querySelector("#historyEmpty"),
  historyTableBody: document.querySelector("#historyTableBody"),
  historyTableWrap: document.querySelector("#historyTableWrap"),
  merchantName: document.querySelector("#merchantName"),
  merchantNameConfidenceBar: document.querySelector("#merchantNameConfidenceBar"),
  merchantNameConfidenceNote: document.querySelector("#merchantNameConfidenceNote"),
  merchantNameConfidencePill: document.querySelector("#merchantNameConfidencePill"),
  merchantNameConfidenceText: document.querySelector("#merchantNameConfidenceText"),
  merchantNameMessage: document.querySelector("#merchantNameMessage"),
  modeTag: document.querySelector("#modeTag"),
  modelTag: document.querySelector("#modelTag"),
  previewImage: document.querySelector("#previewImage"),
  previewWrap: document.querySelector("#previewWrap"),
  receiptDate: document.querySelector("#receiptDate"),
  receiptInput: document.querySelector("#receiptInput"),
  reviewBadge: document.querySelector("#reviewBadge"),
  sampleButton: document.querySelector("#sampleButton"),
  submitButton: document.querySelector("#submitButton"),
  summaryCard: document.querySelector("#summaryCard"),
  totalAmount: document.querySelector("#totalAmount"),
  totalAmountConfidenceBar: document.querySelector("#totalAmountConfidenceBar"),
  totalAmountConfidenceNote: document.querySelector("#totalAmountConfidenceNote"),
  totalAmountConfidencePill: document.querySelector("#totalAmountConfidencePill"),
  totalAmountConfidenceText: document.querySelector("#totalAmountConfidenceText"),
  totalAmountMessage: document.querySelector("#totalAmountMessage"),
  workflowExtract: document.querySelector("#workflowExtract"),
  workflowReview: document.querySelector("#workflowReview"),
  workflowUpload: document.querySelector("#workflowUpload")
};

const state = {
  imageDataUrl: "",
  fileName: "",
  mode: "live",
  model: "Pending",
  status: "Ready",
  extractedAt: "",
  extraction: null,
  confidence: emptyConfidence(),
  submissions: loadSubmissions()
};

function emptyConfidence() {
  return {
    merchantNameConfidence: 0,
    dateConfidence: 0,
    totalAmountConfidence: 0,
    currencyConfidence: 0
  };
}

function loadSubmissions() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(normalizeStoredSubmission) : [];
  } catch (_) {
    return [];
  }
}

function normalizeStoredSubmission(item) {
  return {
    merchant: item.merchant || item.merchant_name || "",
    date: item.date || "",
    totalAmount: item.totalAmount || item.total_amount || "",
    currency: item.currency || "",
    submittedAt: item.submittedAt || item.submitted_at || "",
    sourceMode: item.sourceMode || "live",
    confidence: item.confidence || emptyConfidence()
  };
}

function saveSubmissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.submissions));
}

function setStatus(status) {
  state.status = status;
  els.apiStatus.textContent = status;
  els.apiStatus.className = statusClass(status);
}

function statusClass(status) {
  const base =
    "inline-flex min-w-40 items-center justify-center rounded-full border px-4 py-2 text-sm font-bold";
  const classes = {
    Ready: "border-slate-200 bg-slate-100 text-slate-700",
    "Receipt uploaded": "border-teal-200 bg-teal-50 text-teal-700",
    "Analyzing receipt": "border-amber-200 bg-amber-50 text-amber-700",
    "Extracted successfully": "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Needs review": "border-amber-200 bg-amber-50 text-amber-700",
    Error: "border-red-200 bg-red-50 text-red-700"
  };

  return `${base} ${classes[status] || classes.Ready}`;
}

function showError(message) {
  els.errorAlert.textContent = message;
  els.errorAlert.classList.remove("hidden");
  setStatus("Error");
}

function clearError() {
  els.errorAlert.textContent = "";
  els.errorAlert.classList.add("hidden");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = dataUrl;
  });
}

async function compressImage(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.88);
}

async function handleFile(file) {
  clearError();

  if (!file) {
    showError("No receipt uploaded. Please choose a receipt image first.");
    return;
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    showError("Unsupported file type. Please upload a JPG, PNG, WebP, or GIF receipt image.");
    return;
  }

  try {
    setStatus("Receipt uploaded");
    state.imageDataUrl = await compressImage(file);
    state.fileName = file.name;
    state.mode = "live";
    state.model = "Pending";
    state.extractedAt = "";
    state.extraction = null;
    state.confidence = emptyConfidence();

    els.previewImage.src = state.imageDataUrl;
    els.previewWrap.classList.remove("is-empty");
    els.extractButton.disabled = false;
    els.copyJsonButton.disabled = true;
    els.modeTag.textContent = "Live API";
    els.modelTag.textContent = "Pending";
    els.fileMeta.textContent = `${file.name} - ${formatBytes(file.size)} ready for AI extraction.`;
    els.reviewBadge.textContent = "Ready to analyze";

    resetFormFields();
    renderConfidence();
    renderSummary();
    updateWorkflow();
  } catch (error) {
    resetReceipt({ keepHistory: true });
    showError(error.message);
  }
}

function resetFormFields() {
  els.merchantName.value = "";
  els.receiptDate.value = "";
  els.totalAmount.value = "";
  els.currency.value = "";
  clearValidationMessages();
}

function resetReceipt() {
  clearError();
  state.imageDataUrl = "";
  state.fileName = "";
  state.mode = "live";
  state.model = "Pending";
  state.extractedAt = "";
  state.extraction = null;
  state.confidence = emptyConfidence();

  els.receiptInput.value = "";
  els.previewImage.removeAttribute("src");
  els.previewWrap.classList.add("is-empty");
  els.extractButton.disabled = true;
  els.copyJsonButton.disabled = true;
  els.fileMeta.textContent = "Waiting for an image upload.";
  els.modeTag.textContent = "Live API";
  els.modelTag.textContent = "Pending";
  els.reviewBadge.textContent = "Awaiting receipt";

  resetFormFields();
  renderConfidence();
  renderSummary();
  setStatus("Ready");
  updateWorkflow();
}

async function extractReceipt() {
  clearError();

  if (!state.imageDataUrl) {
    showError("No receipt uploaded. Upload a receipt image before running extraction.");
    return;
  }

  setStatus("Analyzing receipt");
  els.extractButton.disabled = true;
  els.extractButton.textContent = "Analyzing...";
  els.reviewBadge.textContent = "Analyzing";

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: state.imageDataUrl })
    });

    const payload = await response.json().catch(() => {
      throw new Error("Invalid AI response. The server did not return JSON.");
    });

    if (!response.ok) {
      throw new Error(payload.error || "Network/API error. Receipt extraction failed.");
    }

    if (!payload.fields || typeof payload.fields !== "object") {
      throw new Error("Invalid AI response. Missing extracted fields.");
    }

    applyExtractionResult(payload, "live");
  } catch (error) {
    els.reviewBadge.textContent = "Error";
    showError(error.message || "Network/API error. Receipt extraction failed.");
  } finally {
    els.extractButton.disabled = false;
    els.extractButton.textContent = "Analyze receipt";
  }
}

function applyExtractionResult(payload, mode) {
  const confidence = normalizeConfidencePayload(
    (payload.extraction && payload.extraction.confidence) || payload.confidence || payload.fields || {}
  );
  const fields = normalizeExtractedFields(payload.extraction || payload.fields || {}, confidence);

  state.mode = mode;
  state.model = payload.model || (mode === "demo" ? "Demo sample" : "Configured model");
  state.extractedAt = new Date().toISOString();
  state.extraction = normalizeExactExtraction(payload.extraction || {}, fields, confidence);
  state.confidence = confidence;

  fillForm(fields);
  renderConfidence();
  renderSummary();
  els.copyJsonButton.disabled = false;
  els.modeTag.textContent = mode === "demo" ? "Demo data" : "Live API";
  els.modelTag.textContent = state.model;

  const validation = validateForm({ commitNormalization: true });
  const needsReview = validation.errors.length > 0 || validation.warnings.length > 0;
  setStatus(needsReview ? "Needs review" : "Extracted successfully");
  els.reviewBadge.textContent = needsReview ? "Needs review" : "Ready to submit";
  updateWorkflow();
}

function normalizeExtractedFields(fields, confidence = emptyConfidence()) {
  const currency = String(fields.currency || "").trim().toUpperCase();

  return {
    merchant_name: String(fields.merchant_name || fields.merchantName || "").trim(),
    date: String(fields.date || "").trim(),
    total_amount: String(fields.total_amount || fields.totalAmount || "").replace(/[^\d.,-]/g, "").trim(),
    currency: currency || "MYR"
  };
}

function normalizeConfidencePayload(confidence) {
  return {
    merchantNameConfidence: clampConfidence(confidence.merchantNameConfidence ?? confidence.merchantName),
    dateConfidence: clampConfidence(confidence.dateConfidence ?? confidence.date),
    totalAmountConfidence: clampConfidence(confidence.totalAmountConfidence ?? confidence.totalAmount),
    currencyConfidence: clampConfidence(confidence.currencyConfidence ?? confidence.currency)
  };
}

function normalizeExactExtraction(extraction, fields, confidence) {
  return {
    merchantName: String(extraction.merchantName || fields.merchant_name || "").trim(),
    date: String(extraction.date || fields.date || "").trim(),
    totalAmount: normalizeAmountNumber(extraction.totalAmount || fields.total_amount),
    currency: String(extraction.currency || fields.currency || "").trim().toUpperCase(),
    confidence: {
      merchantName: confidence.merchantNameConfidence,
      date: confidence.dateConfidence,
      totalAmount: confidence.totalAmountConfidence,
      currency: confidence.currencyConfidence
    },
    notes: String(extraction.notes || "").trim()
  };
}

function normalizeAmountNumber(value) {
  const cleaned = String(value ?? "").replace(/[^\d.,-]/g, "").replace(/,/g, "").trim();
  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Number(numeric.toFixed(2));
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function fillForm(fields) {
  els.merchantName.value = fields.merchant_name || "";
  els.receiptDate.value = fields.date || "";
  els.totalAmount.value = fields.total_amount || "";
  els.currency.value = normalizeCurrencyValue(fields.currency || "");
}

function getFormFields() {
  return {
    merchant_name: els.merchantName.value.trim(),
    date: els.receiptDate.value.trim(),
    total_amount: els.totalAmount.value.trim(),
    currency: els.currency.value.trim().toUpperCase()
  };
}

function parseReceiptDate(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, normalized: "", reason: "Date is required." };
  }

  let match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return normalizeDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = trimmed.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = expandYear(Number(match[3]));
    return normalizeDateParts(year, month, day);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return normalizeDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return { valid: false, normalized: "", reason: "Date must be valid and normalized to YYYY-MM-DD." };
}

function expandYear(year) {
  if (year < 100) {
    return year >= 70 ? 1900 + year : 2000 + year;
  }
  return year;
}

function normalizeDateParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!valid) {
    return { valid: false, normalized: "", reason: "Date must be a real calendar date." };
  }

  return {
    valid: true,
    normalized: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  };
}

function parseAmount(value) {
  const normalized = value.replace(/,/g, "").trim();
  const numeric = Number(normalized);

  if (!normalized) {
    return { valid: false, normalized: "", reason: "Total amount is required." };
  }

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { valid: false, normalized: "", reason: "Total amount must be numeric and greater than 0." };
  }

  return { valid: true, normalized: numeric.toFixed(2), numeric };
}

function validateForm(options = {}) {
  const commitNormalization = options.commitNormalization !== false;
  const fields = getFormFields();
  const errors = [];
  const warnings = [];
  const messages = {};

  clearValidationMessages();

  if (!fields.merchant_name) {
    errors.push("Merchant name required");
    messages.merchantName = { type: "error", text: "Merchant name required." };
  }

  const dateResult = parseReceiptDate(fields.date);
  if (!dateResult.valid) {
    errors.push(dateResult.reason);
    messages.receiptDate = { type: "error", text: dateResult.reason };
  } else if (fields.date !== dateResult.normalized) {
    warnings.push("Date normalized");
    messages.receiptDate = { type: "warning", text: `Normalized to ${dateResult.normalized}.` };
    if (commitNormalization) els.receiptDate.value = dateResult.normalized;
  }

  const amountResult = parseAmount(fields.total_amount);
  if (!amountResult.valid) {
    errors.push(amountResult.reason);
    messages.totalAmount = { type: "error", text: amountResult.reason };
  } else if (fields.total_amount !== amountResult.normalized) {
    if (commitNormalization) els.totalAmount.value = amountResult.normalized;
  }

  const currencyValue = normalizeCurrencyValue(fields.currency);
  if (!currencyValue) {
    errors.push("Currency is required");
    messages.currency = { type: "error", text: "Currency is required. Enter a 3-letter code such as MYR or USD." };
  } else if (!/^[A-Z]{3}$/.test(currencyValue)) {
    errors.push("Currency must be a 3-letter ISO code");
    messages.currency = { type: "error", text: "Currency must be a 3-letter ISO code such as MYR, USD, SGD, EUR, or GBP." };
  } else if (
    !COMMON_CURRENCY_CODES.includes(currencyValue) &&
    (!state.extractedAt || state.confidence.currencyConfidence >= LOW_CONFIDENCE)
  ) {
    warnings.push("Currency code is uncommon");
    messages.currency = { type: "warning", text: "Uncommon currency code. Please confirm it before submitting." };
  }

  if (currencyValue && fields.currency !== currencyValue && commitNormalization) {
    els.currency.value = currencyValue;
  }

  if (state.extractedAt) {
    for (const config of FIELD_CONFIG) {
      const confidence = state.confidence[config.confidenceKey] || 0;
      if (confidence < LOW_CONFIDENCE && !messages[config.inputId]) {
        warnings.push(`${config.label} confidence below 70%`);
        messages[config.inputId] = {
          type: "warning",
          text: "Confidence below 70%. Please review this field."
        };
      }
    }
  }

  applyValidationMessages(messages);
  updateFormSummary(errors, warnings);

  return { errors, warnings };
}

function clearValidationMessages() {
  for (const config of FIELD_CONFIG) {
    const input = els[config.inputId];
    const message = els[config.messageId];
    input.classList.remove("is-invalid", "is-warning");
    message.textContent = "";
    message.className = "min-h-5 text-xs font-semibold text-slate-500";
  }
}

function applyValidationMessages(messages) {
  for (const [inputId, message] of Object.entries(messages)) {
    const input = els[inputId];
    const messageId = inputId === "receiptDate" ? "dateMessage" : `${inputId}Message`;
    const messageEl = els[messageId];

    if (!input || !messageEl) continue;

    input.classList.add(message.type === "error" ? "is-invalid" : "is-warning");
    messageEl.textContent = message.text;
    messageEl.className =
      message.type === "error"
        ? "min-h-5 text-xs font-semibold text-red-700"
        : "min-h-5 text-xs font-semibold text-amber-700";
  }
}

function updateFormSummary(errors, warnings) {
  if (errors.length) {
    els.formSummary.textContent = `Fix ${errors.length} issue${errors.length === 1 ? "" : "s"} before submitting.`;
    els.formSummary.className =
      "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700";
    return;
  }

  if (warnings.length) {
    els.formSummary.textContent = `Ready to submit with ${warnings.length} review warning${warnings.length === 1 ? "" : "s"}.`;
    els.formSummary.className =
      "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800";
    return;
  }

  els.formSummary.textContent = "All required fields are valid and ready to submit.";
  els.formSummary.className =
    "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700";
}

function renderConfidence() {
  for (const config of FIELD_CONFIG) {
    const score = state.confidence[config.confidenceKey] || 0;
    const textEl = els[config.confidenceTextId];
    const barEl = els[config.confidenceBarId];
    const noteEl = els[config.confidenceNoteId];
    const pillEl = els[config.confidencePillId];
    const card = document.querySelector(`[data-confidence-card="${config.confidenceKey}"]`);
    const hasScore = Boolean(state.extractedAt);
    const isLow = hasScore && score < LOW_CONFIDENCE;
    const tone = confidenceTone(score, hasScore);

    textEl.textContent = hasScore ? `${score}%` : "--%";
    pillEl.textContent = hasScore ? `${score}%` : "--%";
    barEl.style.width = hasScore ? `${score}%` : "0%";
    barEl.className = `h-2 rounded-full ${tone.bar}`;
    pillEl.className = `rounded-full px-2 py-1 text-xs font-bold ${tone.pill}`;
    noteEl.textContent = hasScore
      ? isLow
        ? "Below 70%. Human review recommended."
        : "Meets confidence threshold."
      : "No extraction yet.";
    noteEl.className = `mt-2 text-xs ${isLow ? "font-semibold text-amber-700" : "text-slate-500"}`;
    card.classList.toggle("is-low", isLow);
    card.classList.toggle("is-empty", !hasScore);
  }
}

function confidenceTone(score, hasScore) {
  if (!hasScore) {
    return { bar: "bg-slate-300", pill: "bg-slate-100 text-slate-500" };
  }

  if (score < LOW_CONFIDENCE) {
    return { bar: "bg-amber-500", pill: "bg-amber-100 text-amber-800" };
  }

  return { bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700" };
}

function renderSummary() {
  if (!state.extractedAt) {
    els.extractionSummary.textContent =
      "Upload a receipt or try sample data to populate the extraction summary.";
    els.summaryCard.className = "mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4";
    return;
  }

  const fields = getFormFields();
  const filledCount = Object.values(fields).filter(Boolean).length;
  const lowCount = Object.values(state.confidence).filter((score) => score > 0 && score < LOW_CONFIDENCE).length;
  const prefix =
    state.mode === "demo"
      ? "Demo data filled"
      : "AI extracted";

  els.extractionSummary.textContent =
    lowCount > 0
      ? `${prefix} ${filledCount} fields from the receipt. Please review highlighted fields before submitting.`
      : `${prefix} ${filledCount} fields from the receipt. All extracted fields meet the confidence threshold.`;
  els.summaryCard.className =
    lowCount > 0
      ? "mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4"
      : "mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4";
}

function updateWorkflow() {
  const hasReceipt = Boolean(state.imageDataUrl || state.mode === "demo");
  const hasExtraction = Boolean(state.extractedAt);

  els.workflowUpload.classList.toggle("is-complete", hasReceipt);
  els.workflowUpload.classList.toggle("is-active", !hasReceipt);
  els.workflowExtract.classList.toggle("is-active", hasReceipt && !hasExtraction);
  els.workflowExtract.classList.toggle("is-complete", hasExtraction);
  els.workflowReview.classList.toggle("is-active", hasExtraction);
}

function submitReceipt(event) {
  event.preventDefault();
  clearError();

  const validation = validateForm({ commitNormalization: true });
  if (validation.errors.length) {
    setStatus("Needs review");
    els.reviewBadge.textContent = "Needs review";
    return;
  }

  const fields = getFormFields();
  const submission = {
    merchant: fields.merchant_name,
    date: fields.date,
    totalAmount: parseAmount(fields.total_amount).normalized,
    currency: fields.currency,
    submittedAt: new Date().toISOString(),
    sourceMode: state.mode,
    confidence: { ...state.confidence }
  };

  state.submissions = [submission, ...state.submissions].slice(0, 100);
  saveSubmissions();
  renderHistory();
  setStatus(validation.warnings.length ? "Needs review" : "Extracted successfully");
  els.reviewBadge.textContent = "Submitted locally";
  els.formSummary.textContent = "Receipt submitted to localStorage.";
  els.formSummary.className =
    "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700";
}

function renderHistory() {
  els.historyCount.textContent = String(state.submissions.length);
  els.downloadCsvButton.disabled = state.submissions.length === 0;
  els.clearHistoryButton.disabled = state.submissions.length === 0;
  els.historyEmpty.classList.toggle("hidden", state.submissions.length > 0);
  els.historyTableWrap.classList.toggle("hidden", state.submissions.length === 0);
  els.historyTableBody.replaceChildren();

  for (const receipt of state.submissions) {
    const row = document.createElement("tr");
    row.className = "hover:bg-slate-50";

    const cells = [
      receipt.merchant || "-",
      receipt.date || "-",
      receipt.totalAmount || "-",
      receipt.currency || "-",
      formatSubmittedAt(receipt.submittedAt)
    ];

    for (const value of cells) {
      const cell = document.createElement("td");
      cell.className = "whitespace-nowrap px-4 py-3 text-slate-700";
      cell.textContent = value;
      row.appendChild(cell);
    }

    els.historyTableBody.appendChild(row);
  }
}

function formatSubmittedAt(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function clearHistory() {
  state.submissions = [];
  saveSubmissions();
  renderHistory();
}

async function copyExtractedJson() {
  const payload = buildExactReceiptJson();

  try {
    await copyText(JSON.stringify(payload, null, 2));
    temporarilyRenameButton(els.copyJsonButton, "Copied JSON");
  } catch (_) {
    showError("Could not copy JSON. Your browser blocked clipboard access.");
  }
}

function buildExactReceiptJson() {
  const fields = getFormFields();

  return {
    merchantName: fields.merchant_name,
    date: fields.date,
    totalAmount: normalizeAmountNumber(fields.total_amount),
    currency: fields.currency,
    confidence: {
      merchantName: state.confidence.merchantNameConfidence,
      date: state.confidence.dateConfidence,
      totalAmount: state.confidence.totalAmountConfidence,
      currency: state.confidence.currencyConfidence
    },
    notes: state.extraction && state.extraction.notes ? state.extraction.notes : ""
  };
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (_) {
      // Fall back for browsers that expose Clipboard API but deny write permission.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy was blocked.");
  }
}

function downloadCsv() {
  if (!state.submissions.length) return;

  const rows = [
    ["merchant", "date", "totalAmount", "currency", "submittedAt"],
    ...state.submissions.map((receipt) => [
      receipt.merchant,
      receipt.date,
      receipt.totalAmount,
      receipt.currency,
      receipt.submittedAt
    ])
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "submitted-receipts.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function temporarilyRenameButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function trySampleData() {
  clearError();
  state.imageDataUrl = "";
  state.fileName = "sample-demo-receipt";
  els.receiptInput.value = "";
  els.previewImage.removeAttribute("src");
  els.previewWrap.classList.add("is-empty");
  els.extractButton.disabled = true;
  els.fileMeta.textContent = "Demo data loaded. No API call was made.";
  applyExtractionResult(SAMPLE_RESULT, "demo");
}

function normalizeCurrencyValue(value) {
  return String(value || "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
}

function handleCurrencyInput() {
  const cursorPosition = els.currency.selectionStart;
  const previousLength = els.currency.value.length;
  const normalized = normalizeCurrencyValue(els.currency.value);

  if (els.currency.value !== normalized) {
    els.currency.value = normalized;
    const nextPosition = Math.max(0, cursorPosition - (previousLength - normalized.length));
    els.currency.setSelectionRange(nextPosition, nextPosition);
  }
}

for (const field of [els.merchantName, els.receiptDate, els.totalAmount, els.currency]) {
  field.addEventListener("input", () => {
    if (field === els.currency) {
      handleCurrencyInput();
    }

    const validation = validateForm({ commitNormalization: false });
    if (state.extractedAt) {
      setStatus(validation.errors.length || validation.warnings.length ? "Needs review" : "Extracted successfully");
      renderSummary();
    }
  });

  field.addEventListener("blur", () => {
    const validation = validateForm({ commitNormalization: true });
    if (state.extractedAt) {
      setStatus(validation.errors.length || validation.warnings.length ? "Needs review" : "Extracted successfully");
      renderSummary();
    }
  });
}

els.receiptInput.addEventListener("change", (event) => {
  handleFile(event.target.files[0]);
});

els.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropzone.classList.add("is-dragging");
});

els.dropzone.addEventListener("dragleave", () => {
  els.dropzone.classList.remove("is-dragging");
});

els.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropzone.classList.remove("is-dragging");
  handleFile(event.dataTransfer.files[0]);
});

els.extractButton.addEventListener("click", extractReceipt);
els.sampleButton.addEventListener("click", trySampleData);
els.clearButton.addEventListener("click", resetReceipt);
els.form.addEventListener("submit", submitReceipt);
els.copyJsonButton.addEventListener("click", copyExtractedJson);
els.downloadCsvButton.addEventListener("click", downloadCsv);
els.clearHistoryButton.addEventListener("click", clearHistory);

renderHistory();
renderConfidence();
renderSummary();
setStatus("Ready");
updateWorkflow();
