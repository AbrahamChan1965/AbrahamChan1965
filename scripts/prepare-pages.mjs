import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
await copyFile(new URL('../release/road-and-letters.html', import.meta.url), new URL('../docs/index.html', import.meta.url));
await writeFile(new URL('../docs/.nojekyll', import.meta.url), '');
console.log('GitHub Pages files prepared in docs/. Enable Pages from main /docs; no workflow is needed.');
