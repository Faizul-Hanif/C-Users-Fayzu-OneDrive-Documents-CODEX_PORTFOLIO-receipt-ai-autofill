require("dotenv").config();

const { extractReceiptFromImage } = require("../lib/geminiExtractor");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body;

    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch {
      throw new Error("Invalid request body. Expected JSON with imageDataUrl.");
    }

    const { imageDataUrl } = body;
    const result = await extractReceiptFromImage(imageDataUrl);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Receipt extraction failed." });
  }
};
