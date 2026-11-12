import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * 빌드 결과물(dist/index.html)을 서버 없이 더블클릭으로 열어도 동작하게 한다.
 * 브라우저는 file:// 에서 type="module" 스크립트를 막으므로,
 * 하나의 일반 스크립트(IIFE)로 묶고 태그를 defer 스크립트로 바꾼다.
 */
function openFromFile(): Plugin {
  return {
    name: 'open-from-file',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, '<script defer')
        .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), openFromFile()],
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
