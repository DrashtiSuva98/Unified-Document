import { mkdir, writeFile } from 'node:fs/promises';
// Synthetic Maharashtra registrations; no real ownership is implied.
function registrationNumber(index){const codes=['12','01','02','14','04','20','31','15','09','13'];return 'MH'+codes[index%codes.length]+'AB'+String(1234+index);}
const names=['Aarav Patil','Sneha Deshmukh','Rohan Kulkarni','Priya Joshi','Aditya Shinde','Neha Pawar','Sahil More','Ananya Shah','Omkar Jadhav','Riya Mehta'];
const surnames=['Patil','Deshmukh','Kulkarni','Joshi','Shinde'];
const locations={12:'Pune', '01':'Mumbai Central', '02':'Mumbai West',14:'Pimpri-Chinchwad','04':'Thane',20:'Chhatrapati Sambhajinagar',31:'Nagpur',15:'Nashik','09':'Kolhapur',13:'Solapur'};
const technicians=['Ajay Patil','Vikram Joshi','Nikhil More','Sagar Deshmukh','Prasad Shinde','Akshay Kulkarni'];
const money=value=>'INR '+value.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const vehicles=[
 ['Tata','Nexon',1250000,'Petrol'],['Toyota','Innova Crysta',2450000,'Diesel'],['Honda','City',1450000,'Petrol'],
 ['Maruti Suzuki','Swift',850000,'Petrol'],['Hyundai','Creta',1650000,'Diesel'],['Mahindra','Scorpio N',2100000,'Diesel'],
 ['Kia','Seltos',1700000,'Petrol'],['Skoda','Slavia',1550000,'Petrol'],['Volkswagen','Virtus',1600000,'Petrol'],
 ['MG','Hector',1950000,'Petrol'],['Renault','Kiger',950000,'Petrol'],['Nissan','Magnite',900000,'Petrol'],
 ['Citroen','C3',850000,'Petrol'],['Jeep','Compass',2900000,'Diesel'],['Hyundai','Venue',1150000,'Petrol'],
 ['Tata','Punch',900000,'Petrol'],['Tata','Harrier',2450000,'Diesel'],['Tata','Safari',2750000,'Diesel'],
 ['Tata','Tiago EV',1050000,'Electric'],['Tata','Nexon EV',1750000,'Electric'],
 ['Toyota','Fortuner',4200000,'Diesel'],['Toyota','Glanza',1000000,'Petrol'],['Toyota','Urban Cruiser Hyryder',2000000,'Hybrid'],
 ['Toyota','Innova Hycross',3200000,'Hybrid'],['Honda','Amaze',1000000,'Petrol'],['Honda','Elevate',1550000,'Petrol'],
 ['Maruti Suzuki','Baleno',1000000,'Petrol'],['Maruti Suzuki','Brezza',1250000,'Petrol'],['Maruti Suzuki','Ertiga',1300000,'Petrol'],
 ['Maruti Suzuki','Grand Vitara',2100000,'Hybrid'],['Maruti Suzuki','Fronx',1100000,'Petrol'],
 ['Hyundai','i20',1150000,'Petrol'],['Hyundai','Verna',1700000,'Petrol'],['Hyundai','Exter',950000,'Petrol'],
 ['Mahindra','XUV700',2650000,'Diesel'],['Mahindra','Thar',1850000,'Diesel'],['Mahindra','Bolero',1150000,'Diesel'],
 ['Kia','Sonet',1250000,'Petrol'],['Kia','Carens',1800000,'Diesel'],['Skoda','Kushaq',1750000,'Petrol'],
 ['Volkswagen','Taigun',1800000,'Petrol'],['MG','Comet EV',900000,'Electric'],['MG','ZS EV',2450000,'Electric'],
 ['Renault','Triber',950000,'Petrol'],['Citroen','eC3',1300000,'Electric'],
 ['BMW','X1',5500000,'Diesel'],['Mercedes-Benz','C-Class',6500000,'Petrol'],['Audi','Q3',5200000,'Petrol'],
 ['Volvo','XC60',7200000,'Hybrid'],['BYD','Atto 3',3300000,'Electric']
];
const sales=[],service=[];
for(let i=0;i<50;i++){
 const [make,model,price,fuelType]=vehicles[i];
 const id=registrationNumber(i),date=`2024-${String(i%9+1).padStart(2,'0')}-${String(3+i%24).padStart(2,'0')}`,owner=names[i%names.length].split(' ')[0]+' '+surnames[Math.floor(i/10)];
 const city=locations[id.slice(2,4)];
 const warranty=`Warranty agreement WAR-${3001+i}: coverage through ${2027}-${date.slice(5)} or 1,00,000 km, whichever occurs first. Covered components and exclusions follow the signed vehicle-specific agreement.`;
 sales.push({registrationNumber:id,make,model,fuelType,year:2024,color:['White','Grey','Black','Red','Silver'][i%5],owner,dealer:`Unifield ${make} Sales ${city}`,saleDate:date,price,warranty,documents:[{name:'Sales invoice',reference:`INV-2024-${1001+i}`,date,content:`Sales invoice for ${owner}. Vehicle: ${make} ${model}, registration ${id}. Vehicle price INR ${price.toLocaleString('en-IN')}. Payment method: bank transfer. Taxes and registration charges are itemised separately.`},{name:'Ownership record',reference:`OWN-${2001+i}`,date,content:`Purchaser: ${owner}. Vehicle: ${make} ${model}. Registration: ${id}. Purchase date: ${date}. Selling dealership: Unifield ${make} Sales ${city}.`},{name:'Warranty summary',reference:`WAR-${3001+i}`,date,content:`Vehicle: ${make} ${model}, registration ${id}. ${warranty} Routine wear and scheduled maintenance are excluded unless specified in that agreement.`}]});
 service.push({registrationNumber:id,nextService:'2027-01-15',nextServiceKm:40000+i*180,records:[{id:`SR-${i}-1`,date:'2025-01-15',odometerKm:10000+i*30,type:'Scheduled maintenance',center:'Unifield Service Pune',technician:'Ajay Patil',cost:4500,notes:'Inspection completed. No concerns reported.',work:['Engine oil and filter replaced','Tires rotated','Fluids and brakes inspected']},{id:`SR-${i}-2`,date:'2025-10-20',odometerKm:20000+i*80,type:'Brake inspection & tire care',center:'Unifield Service Mumbai',technician:'Vikram Joshi',cost:6500,notes:'Brake pads within specification. Wheel alignment corrected.',work:['Brake system inspected','Four-wheel alignment','Tire pressures adjusted']},{id:`SR-${i}-3`,date:'2026-07-15',odometerKm:30000+i*100,type:'Annual service',center:'Unifield Service Pune',technician:'Ajay Patil',cost:9000,notes:'Vehicle road-tested. Next maintenance scheduled.',work:['Engine oil and filter replaced','Cabin air filter replaced','Battery health checked','Diagnostic scan completed']}]});
 const history=service.at(-1);for(const record of history.records){record.center=`Unifield ${make} Service ${city}`;if(fuelType==='Electric'){record.work=record.work.map(work=>work==='Engine oil and filter replaced'?'Traction battery and charging system inspected':work==='Fluids and brakes inspected'?'Brake fluid and cooling system inspected':work==='Battery health checked'?'12V battery health checked':work);}}
 const sale=sales.at(-1);
 const registrationCharges=32000+i*1100,insurance=24000+i*850,accessories=[0,8500,12500,18000][i%4],discount=[10000,15000,25000,0][i%4];
 const total=price+registrationCharges+insurance+accessories-discount;
 const payment=['Bank transfer','Vehicle finance and down payment','Bank draft'][i%3];
 sale.documents[0].content=`Invoice INV-2024-${1001+i} | ${date}\nSeller: ${sale.dealer}. Buyer: ${owner}.\nVehicle: ${make} ${model} (${fuelType}), ${sale.color}. Registration: ${id}.\nVehicle price: ${money(price)}. Registration charges: ${money(registrationCharges)}. Insurance: ${money(insurance)}. Accessories: ${money(accessories)}. Discount: ${money(discount)}.\nTotal invoice value: ${money(total)}. Payment: ${payment}. Balance due: INR 0.00. Delivery: ${city}, ${date}.`;
 sale.documents[1].content=`Ownership file OWN-${2001+i}\nRegistered keeper: ${owner}. Registration: ${id}. Vehicle: ${make} ${model}, ${fuelType}, model year 2024.\nRegistering office: ${city} (${id.slice(0,4)}). Purchase and delivery date: ${date}. Selling dealership: ${sale.dealer}. Ownership sequence: first owner. Invoice reference: INV-2024-${1001+i}.`;
 const day=String(5+i%20).padStart(2,'0');
 history.records[0].date=`2025-${String(1+i%3).padStart(2,'0')}-${day}`;
 history.records[1].date=`2025-${String(9+i%3).padStart(2,'0')}-${day}`;
 history.records[2].date=`2026-${String(7+i%3).padStart(2,'0')}-${day}`;
 history.nextService=`2027-${String(1+i%3).padStart(2,'0')}-${day}`;
 history.nextServiceKm=history.records[2].odometerKm+10000;
 for(const [visitIndex,record] of history.records.entries()){
   record.id=`JC-${id.slice(0,4)}-${2025+(visitIndex===2?1:0)}-${String(10000+i*3+visitIndex)}`;
   record.technician=technicians[(i+visitIndex)%technicians.length];
   record.cost=Math.round((record.cost+(i%7)*275)*(price>4000000?1.8:price>2000000?1.25:1));
   if(visitIndex===0)record.notes=`Customer concern: ${['routine maintenance due','minor steering vibration at highway speed','tyre pressure warning'][i%3]}. ${['Road test completed; no abnormal noise or vibration.','Wheel balancing completed; steering vibration resolved.','Tyre pressures corrected and warning reset.'][i%3]} Job card closed after quality inspection.`;
   if(visitIndex===1)record.notes=`Front brake pads measured ${6+i%3} mm; rear pads ${7+i%2} mm. ${i%2===0?'Alignment corrected and vehicle road-tested.':'Alignment within specification; no correction required.'} Customer advised to inspect tyres at the next visit.`;
   if(visitIndex===1)record.work=record.work.map(w=>w==='Four-wheel alignment'?(i%2===0?'Four-wheel alignment corrected':'Wheel alignment checked'):w);
   if(visitIndex===2)record.notes=fuelType==='Electric'?`Traction battery health ${96+i%4}%. Charging test passed. No active diagnostic faults. Next inspection due at ${history.nextServiceKm.toLocaleString('en-IN')} km or ${history.nextService}.`:`No active diagnostic faults. ${['Wiper blades replaced after customer approval.','Air filter inspected and cleaned.','Coolant level corrected and leak check completed.'][i%3]} Next maintenance due at ${history.nextServiceKm.toLocaleString('en-IN')} km or ${history.nextService}.`;
   if(visitIndex===0&&i%3===1)record.work.push('Wheel balancing completed');
   if(visitIndex===2&&fuelType!=='Electric')record.work.push(['Wiper blades replaced','Air filter cleaned','Coolant topped up and leak check completed'][i%3]);
 }
}
await mkdir('Data',{recursive:true});await writeFile('Data/sales.json',JSON.stringify(sales,null,2));await writeFile('Data/service.json',JSON.stringify(service,null,2));
console.log(`Generated ${sales.length} vehicle records across ${new Set(sales.map(s=>s.make)).size} brands. Example: ${sales[0].registrationNumber}`);
