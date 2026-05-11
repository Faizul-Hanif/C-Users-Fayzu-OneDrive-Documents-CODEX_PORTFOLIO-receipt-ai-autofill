require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { extractReceiptFromImage } = require("./lib/geminiExtractor");

const STATIC_DIR = process.argv.includes("--dist") ? path.join(__dirname, "dist") : path.join(__dirname, "public");
const MAX_BODY_BYTES = 7 * 1024 * 1024;

const PORT = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStaticFile(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const filePath = path.normalize(path.join(STATIC_DIR, urlPath === "/" ? "index.html" : urlPath));
  const relativePath = path.relative(STATIC_DIR, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleExtract(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end("Method not allowed");
    return;
  }

  try {
    const body = await readRequestBody(req);
    let parsedBody;

    try {
      parsedBody = JSON.parse(body || "{}");
    } catch {
      throw new Error("Invalid request body. Expected JSON with imageDataUrl.");
    }

    const { imageDataUrl } = parsedBody;
    const result = await extractReceiptFromImage(imageDataUrl);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Receipt extraction failed." });
  }
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/extract")) {
    handleExtract(req, res);
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Receipt AI Auto-Fill running at http://localhost:${PORT}`);
});
