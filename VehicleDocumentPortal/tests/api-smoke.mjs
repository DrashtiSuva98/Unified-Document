import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base=process.env.PORTAL_URL||'http://localhost:5080';
const sales=JSON.parse(await readFile(new URL('../Data/sales.json',import.meta.url)));
const services=JSON.parse(await readFile(new URL('../Data/service.json',import.meta.url)));
assert.equal(sales.length,50);assert.equal(services.length,50);assert.equal(new Set(sales.map(s=>s.registrationNumber)).size,50);
for(const s of sales){assert.match(s.registrationNumber,/^(?:[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/);assert.equal(s.documents.length,3);assert.ok(services.some(r=>r.registrationNumber===s.registrationNumber));}
const catalog=await fetch(base+'/api/vehicles').then(r=>r.json());assert.equal(catalog.length,50);
for(const s of sales){const [a,b]=await Promise.all([fetch(base+'/api/sales/'+s.registrationNumber),fetch(base+'/api/services/'+s.registrationNumber)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal((await a.json()).registrationNumber,s.registrationNumber);assert.equal((await b.json()).records.length,3);}
for(const route of ['sales','services']){assert.equal((await fetch(`${base}/api/${route}/INVALID`)).status,400);assert.equal((await fetch(`${base}/api/${route}/MH12ZZ9999`)).status,404);const r=await fetch(`${base}/api/${route}/${sales[0].registrationNumber.toLowerCase()}`);assert.equal(r.status,200);}
const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/<app-root>/);assert.equal((await fetch(base+'/main.js')).status,200);
assert.ok(home.headers.get('X-Request-ID'));
const unknownApi=await fetch(base+'/api/unknown');assert.equal(unknownApi.status,404);assert.match(unknownApi.headers.get('content-type'),/json/);
for(const route of ['sales','services']){
  assert.equal((await fetch(`${base}/api/${route}/${encodeURIComponent('mh 12-ab 1234')}`)).status,200);
  for(const plate of ['KA01AB1234','DL1CAB1234','24BH1234AA']) assert.equal((await fetch(`${base}/api/${route}/${plate}`)).status,404);
}
assert.equal(sales[0].price,1250000);assert.equal(services[0].records[2].odometerKm,30000);
assert.equal(new Set(sales.map(s=>s.make)).size,19);
assert.equal(new Set(sales.map(s=>s.make+' '+s.model)).size,50);
assert.ok(!/\b(mock|demo|synthetic|illustrative|demonstration)\b/i.test(JSON.stringify([sales,services])));
for(const sale of sales.filter(s=>s.fuelType==='Electric')){
  const history=services.find(s=>s.registrationNumber===sale.registrationNumber);
  assert.ok(!JSON.stringify(history).includes('Engine oil'));
}
console.log('PASS: 50 unique fixtures, 100 sales/service API responses, validation, not-found, lowercase normalization, UI assets.');
