import { defineConfig } from 'oxlint';

import config from '__PKG__';

export default defineConfig({
  extends: [config],
  // Add project-specific rules / ignorePatterns here.
});
