import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(new URL('../ClientApp/package.json', import.meta.url));
const { build } = require('esbuild');
await import(pathToFileURL(require.resolve('@angular/compiler')).href);
const { Injector, runInInjectionContext, ChangeDetectorRef } = await import(pathToFileURL(require.resolve('@angular/core')).href);
const { DomSanitizer } = await import(pathToFileURL(require.resolve('@angular/platform-browser')).href);
const compiledPath = fileURLToPath(new URL('../ClientApp/node_modules/.cache/unifield-test/app.mjs', import.meta.url));
await build({ entryPoints: [fileURLToPath(new URL('../ClientApp/src/app.ts', import.meta.url))], bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'es2022', outfile: compiledPath });
const { App } = await import(pathToFileURL(compiledPath).href);
const sales = JSON.parse(await readFile(new URL('../Data/sales.json', import.meta.url)));
const histories = JSON.parse(await readFile(new URL('../Data/service.json', import.meta.url)));
const pending = new Map();
const originalFetch = globalThis.fetch;
globalThis.fetch = url => new Promise(resolve => pending.set(String(url), resolve));
function respond(url, body, status = 200) {
  assert.ok(pending.has(url), `Request started: ${url}`);
  pending.get(url)(new Response(JSON.stringify(body), {status})); pending.delete(url);
}
let app;
const notifications = [];
const injector = Injector.create({providers: [
  {provide: DomSanitizer, useValue: {bypassSecurityTrustResourceUrl: url => url}},
  {provide: ChangeDetectorRef, useValue: {markForCheck: () => notifications.push({loading:app.loading, sale:app.sale, error:app.error, pdf:app.pdf, catalog:app.vehicles.length})}}
]});
app = runInInjectionContext(injector, () => new App());
try {
  const catalog = app.ngOnInit();
  respond('/api/vehicles', sales);
  await catalog;
  assert.equal(notifications.at(-1).catalog, 50);
  notifications.length = 0;
  app.registrationNumber = 'mh 12-ab 1234';
  const search = app.search();
  assert.equal(app.loading, true);
  // The independent requests must both start before either completes.
  assert.ok(pending.has('/api/sales/' + app.registrationNumber));
  assert.ok(pending.has('/api/services/' + app.registrationNumber));
  respond('/api/sales/' + app.registrationNumber, sales[0]);
  respond('/api/services/' + app.registrationNumber, histories[0]);
  await search;
  assert.equal(notifications.length, 1, 'Search completion must notify Angular without another input event');
  assert.equal(notifications[0].loading, false);
  assert.equal(notifications[0].sale.registrationNumber, sales[0].registrationNumber);
  assert.ok(notifications[0].pdf.getNumberOfPages() > 0);
  assert.equal(app.history.records.length, 3);
  assert.equal(app.registrationNumber, 'MH12AB1234');
  assert.equal(app.latestOdometerKm, 30000);
  const pdfText = app.pdf.output();
  assert.ok(pdfText.includes('INR 12,50,000'));
  assert.ok(pdfText.includes('30,000 km'));
  assert.ok(!pdfText.includes('USD'));
  assert.ok(app.pdfUrl.startsWith('blob:'));
  notifications.length = 0;
  app.registrationNumber = 'MH12ZZ9999';
  const kmssing = app.search();
  respond('/api/sales/' + app.registrationNumber, {message:'No vehicle record exists for this registration number.'}, 404);
  respond('/api/services/' + app.registrationNumber, {message:'No vehicle record exists for this registration number.'}, 404);
  await kmssing;
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].loading, false);
  assert.match(notifications[0].error, /No vehicle record/);
  assert.equal(app.sale, null);
  assert.equal(app.pdfUrl, null);
  console.log('PASS: catalog and search completion notify Angular; parallel API success creates report/PDF, and not-found clears loading without another input event.');
} finally { app.ngOnDestroy(); globalThis.fetch = originalFetch; injector.destroy(); }
