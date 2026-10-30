import * as esbuild from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('../wwwroot', { recursive: true });
await copyFile('src/index.html', '../wwwroot/index.html');
const options = { entryPoints: ['src/main.ts'], bundle: true, format: 'esm', target: 'es2022', outdir: '../wwwroot', minify: true, sourcemap: true, loader: { '.css': 'css' } };
if (process.argv.includes('--watch')) { const ctx = await esbuild.context(options); await ctx.watch(); console.log('Watching Angular sources.'); }
else await esbuild.build(options);
