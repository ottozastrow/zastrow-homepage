import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/zastrow-homepage/",
  plugins: [react()],
  build: {
    outDir: "docs",
  },
});
