import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import router from "vue-router/vite";

export default defineConfig({
  // router() generates the routes from src/pages and must come before vue().
  plugins: [router(), vue(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:3000" } },
});
