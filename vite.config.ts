import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/',
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: false,
        rollupOptions: {
            input: ['demo/chat/index.html', 'index.html', 'chatbot/index.html', 'settings/index.html', '404.html', 'restaurantes/index.html', 'restaurantes/ko/index.html', 'restaurantes/vita/index.html', 'restaurantes/ko/platefy/index.html', 'restaurantes/vita/platefy/index.html'],
            maxParallelFileOps: 128,
        },
    },
});
