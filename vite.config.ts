import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      emitTsDeclarations: true,
      strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
    }),
    vue(),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
  },
})
