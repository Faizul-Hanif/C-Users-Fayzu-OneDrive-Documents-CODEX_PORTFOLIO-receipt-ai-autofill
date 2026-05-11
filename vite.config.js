import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function bundleExistingAppScript() {
  return {
    name: "bundle-existing-app-script",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(
          '<script src="/app.js" defer></script>',
          '<script type="module" src="/app.js"></script>'
        );
      }
    }
  };
}

export default defineConfig({
  root: "public",
  plugins: [bundleExistingAppScript(), react()],
  publicDir: false,
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
