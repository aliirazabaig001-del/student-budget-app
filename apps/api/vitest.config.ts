import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC is used instead of esbuild because NestJS dependency injection needs
// `emitDecoratorMetadata`, which esbuild does not support.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
