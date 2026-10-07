// eslint-plugin-jsx-a11y ships no types; only eslint.config.js imports it.
declare module 'eslint-plugin-jsx-a11y' {
  import type { Linter } from 'eslint';

  const plugin: {
    flatConfigs: { recommended: Linter.Config; strict: Linter.Config };
    configs: Record<string, Linter.LegacyConfig>;
  };
  export default plugin;
}
