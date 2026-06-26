import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('./.oxfmtrc.json', import.meta.url), 'utf8'));

export default config;
