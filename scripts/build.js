const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const sourceDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "dist");

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
  }
}

if (!fs.existsSync(sourceDir)) {
  throw new Error("Build failed: public directory does not exist.");
}

fs.rmSync(outputDir, { recursive: true, force: true });
copyDirectory(sourceDir, outputDir);

console.log("Build complete: public assets copied to dist.");
