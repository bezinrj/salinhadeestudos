import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const backendProjectId = "lwadfvkaywbdebvwdfgb";
const backendUrl = process.env.VITE_SUPABASE_URL || `https://${backendProjectId}.supabase.co`;
const backendPublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YWRmdmtheXdiZGVidndkZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDc2NzUsImV4cCI6MjA4OTE4MzY3NX0.TNmTjo9xJQthG4xZsvxPI_-J4G0r9d6BsrIkyRHV2HM";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(backendUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(backendPublishableKey),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
