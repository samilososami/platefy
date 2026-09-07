import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        // WebLLM ships its GPU runtime as a large lazy chunk and duplicates it in the
        // dedicated worker so generation never blocks the interface.
        chunkSizeWarningLimit: 6500,
        rollupOptions: {
            input: ['index.html', 'chatbot/index.html', '404.html'],
            maxParallelFileOps: 128,
        },
    },
});
