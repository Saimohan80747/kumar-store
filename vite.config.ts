import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Vite configuration for the React application
/** Vite config wrapper enforcing build rules */
/** Vite config wrapper enforcing build rules */
export default defineConfig({
  clearScreen: false,
  build: {
    sourcemap: true,
    outDir: "dist",
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 8080,
    open: true,
  },
  /* Config plugins */
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
