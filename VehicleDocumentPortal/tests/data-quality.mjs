import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sales=JSON.parse(await readFile(new URL('../Data/sales.json',import.meta.url)));
const services=JSON.parse(await readFile(new URL('../Data/service.json',import.meta.url)));
assert.equal(sales.length,50);
assert.equal(new Set(sales.map(s=>s.owner)).size,50);
assert.equal(new Set(sales.map(s=>s.make)).size,19);
const visits=[];
for(const sale of sales){
 const history=services.find(h=>h.registrationNumber===sale.registrationNumber);
 assert.ok(history);
 let lastDate=sale.saleDate,lastKm=0;
 for(const visit of history.records){
  assert.ok(visit.date>lastDate&&visit.date<='2026-10-28');
  assert.ok(visit.odometerKm>lastKm);
  assert.ok(visit.cost>0&&visit.work.length>0);
  assert.ok(visit.center.includes(sale.make));
  if(sale.fuelType==='Electric')assert.ok(!visit.work.some(w=>/engine oil/i.test(w)));
  lastDate=visit.date;lastKm=visit.odometerKm;visits.push(visit);
 }
 assert.ok(history.nextService>lastDate);
 assert.ok(history.nextServiceKm>lastKm);
 const invoice=sale.documents.find(d=>d.name==='Sales invoice').content;
 const amount=label=>{const match=invoice.match(new RegExp(label+': INR ([0-9,]+\\.[0-9]{2})'));assert.ok(match,label);return Math.round(Number(match[1].replaceAll(',',''))*100);};
 assert.equal(amount('Vehicle price'),sale.price*100);
 assert.equal(amount('Total invoice value'),amount('Vehicle price')+amount('Registration charges')+amount('Insurance')+amount('Accessories')-amount('Discount'));
 for(const document of sale.documents){assert.ok(document.content.includes(sale.registrationNumber));assert.equal(document.date,sale.saleDate);}
}
assert.equal(new Set(visits.map(v=>v.id)).size,150);
assert.ok(new Set(visits.map(v=>v.date)).size>20);
assert.ok(new Set(visits.map(v=>v.cost)).size>10);
console.log('PASS: 50 unique owners, 19 brands, reconciled invoices, chronological service histories, increasing odometers, unique job cards, and EV-appropriate work.');
