import { build } from 'vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// No external assets: inline the bundled JS and CSS so the game works on file://.
const result = await build({
  configFile: false,
  base: './',
  build: {
    write: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
if (Array.isArray(result) || !('output' in result)) throw new Error('Expected a single client build');
const scripts = result.output.filter(item => item.type === 'chunk');
if (scripts.length !== 1) throw new Error('Standalone export must contain exactly one script');
const css = result.output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css'));
let html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const js = scripts[0].code.replaceAll('</script', '<\\/script');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', () => `<script type="module">${js}</script>`);
const styles = css.map(item => typeof item.source === 'string' ? item.source : new TextDecoder().decode(item.source)).join('\n');
html = html.replace('</head>', () => `<style>${styles.replaceAll('</style', '<\\/style')}</style></head>`);
await mkdir(new URL('../release/', import.meta.url), { recursive: true });
await writeFile(new URL('../release/road-and-letters.html', import.meta.url), html);
console.log(`Standalone game saved: release/road-and-letters.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
