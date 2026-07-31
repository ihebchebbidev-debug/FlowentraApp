import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Plugin: generate version.json on each build for zero-downtime detection
const versionJsonPlugin = () => ({
  name: 'version-json',
  async buildStart() {
    const fs = await import('node:fs');
    const publicDir = path.resolve(process.cwd(), 'public');
    // public/ may be absent in a fresh checkout — create it so the build never fails.
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify({ v: String(Date.now()) }));
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && versionJsonPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-tooltip',
    ],
  },
  build: {
    target: "es2022",
    cssTarget: "chrome80",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            // Application modules: no manual chunks — rely on React.lazy() route splitting.
            // Manually grouping app modules (field/dispatcher/analytics) caused cross-chunk
            // TDZ errors like "Cannot access 'Ide' before initialization" because shared
            // helpers ended up split between the app chunk and vendor in the wrong order.
            return undefined;
          }
          
          // Vendor chunking strategy - keep most libs in vendor to avoid init order issues
          // Only split truly independent libraries with no cross-chunk dependencies
          if (id.includes('xlsx')) return 'excel';
          if (id.includes('mapbox-gl') || id.includes('leaflet')) return 'maps';
          
          // Everything else goes to vendor to prevent cross-chunk initialization errors
          return 'vendor';
        },
      },
    },
    modulePreload: {
      polyfill: true,
    },
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: true,
    // Additional optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
  // Optimizations for dev
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
  },
}));
