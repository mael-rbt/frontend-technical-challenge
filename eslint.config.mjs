import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  globalIgnores(['dist/**', 'coverage/**', 'src/paraglide/**']),
  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
