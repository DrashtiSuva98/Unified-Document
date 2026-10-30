import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { getJson, log, PortalError } from './diagnostics';

interface Vehicle { registrationNumber:string; make:string; model:string; year:number }
interface Sale extends Vehicle { color:string; owner:string; dealer:string; saleDate:string; price:number; warranty:string; documents:{name:string;reference:string;date:string;content:string}[] }
interface Visit { id:string;date:string;odometerKm:number;type:string;center:string;technician:string;cost:number;notes:string;work:string[] }
interface History { registrationNumber:string;nextService:string;nextServiceKm:number;records:Visit[] }

@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],template:`
<header><a class="brand" href="/" aria-label="Unifield home"><span class="mark">U</span>unifield<span class="brand-sub">VEHICLE INTELLIGENCE</span></a><span class="environment"></span></header>
<main><div class="eyebrow">VEHICLE DOCUMENT INTELLIGENCE PORTAL</div><h1>One vehicle. The complete picture.</h1><p class="intro">Bring sales documents and service history together in a single, editable report.</p>
<section class="search-card"><form (ngSubmit)="search()"><label for="registrationNumber">Vehicle registration number</label><div class="search-row"><div class="registration-input"><span aria-hidden="true">⌕</span><input id="registrationNumber" name="registrationNumber" [(ngModel)]="registrationNumber" maxlength="20" placeholder="e.g. MH12AB1234 or MH 12 AB 1234" autocomplete="off" spellcheck="false"></div><button class="primary" [disabled]="loading">{{loading ? 'Retrieving records…' : 'Find vehicle →'}}</button></div></form><div class="search-hint">50 vehicles available <button class="text-button" (click)="showSamples=!showSamples">{{showSamples ? 'Hide' : 'Browse'}} registration numbers</button></div>
@if(showSamples){<div class="samples"><label for="sample">Choose a vehicle</label><select id="sample" (change)="selectSample($event)"><option value="">Select vehicle…</option>@for(v of vehicles;track v.registrationNumber){<option [value]="v.registrationNumber">{{v.year}} {{v.make}} {{v.model}} · {{v.registrationNumber}}</option>}</select></div>}
</section>
@if(error){<div class="error" role="alert">{{error}}</div>}
@if(loading){<section class="loading" role="status">Retrieving sales documents and service records…</section>}
@if(sale && history && !loading){
<section class="vehicle-heading"><div><div class="eyebrow">VEHICLE OVERVIEW</div><h2>{{sale.year}} {{sale.make}} {{sale.model}}</h2><span class="mono">{{sale.registrationNumber}}</span><span class="color-dot"></span><span>{{sale.color}}</span></div><span class="badge">✓ Both sources connected</span></section>
<div class="stats"><article><span>Purchase price</span><strong>{{sale.price | currency:'INR':'symbol':'1.0-0'}}</strong><small>Sold {{sale.saleDate | date:'mediumDate'}}</small></article><article><span>Service visits</span><strong>{{history.records.length.toString().padStart(2,'0')}}</strong><small>Complete maintenance timeline</small></article><article><span>Last recorded odometer</span><strong>{{latestOdometerKm | number}} <em>km</em></strong><small>From the latest service record</small></article><article><span>Next scheduled service</span><strong>{{history.nextService | date:'d MMM y'}}</strong><small>or at {{history.nextServiceKm | number}} km</small></article></div>
<div class="workspace"><section class="report-panel"><div class="panel-toolbar"><div><h3>Unified vehicle report</h3><p>Sales, documents & service records · PDF</p></div><div class="actions"><button (click)="beginEdit()">✎ Edit report</button><button class="primary" (click)="download()">↓ Download PDF</button></div></div><div class="pdf-shell">@if(pdfUrl){<iframe title="Unified vehicle PDF report" [src]="pdfUrl"></iframe>}<p class="pdf-help">If your browser cannot display the PDF, use Download PDF to open it.</p></div></section>
<aside><section class="side-card"><div class="eyebrow">SALES & OWNERSHIP</div><h3>{{sale.owner}}</h3><dl><dt>Dealership</dt><dd>{{sale.dealer}}</dd><dt>Warranty</dt><dd>{{sale.warranty}}</dd></dl><div class="document-list">@for(d of sale.documents;track d.reference){<div><span class="file-icon">PDF</span><span>{{d.name}}<small>{{d.reference}}</small></span><span class="included">✓</span></div>}</div><p class="muted">Sales document contents are included in the unified PDF.</p></section><section class="side-card timeline"><div class="side-title"><h3>Service history</h3><span>{{history.records.length}} visits</span></div>@for(r of sortedRecords;track r.id){<article><span class="timeline-dot"></span><time>{{r.date | date:'mediumDate'}}</time><h4>{{r.type}}</h4><p>{{r.odometerKm | number}} km · {{r.center}}</p><details><summary>View service details</summary><p>{{r.notes}}</p><ul>@for(w of r.work;track $index){<li>{{w}}</li>}</ul><p>{{r.technician}} · {{r.cost | currency:'INR':'symbol':'1.0-0'}}</p></details></article>}</section></aside></div>
} @else if(!loading){<section class="empty"><span class="empty-icon">▤</span><h2>Your vehicle's story starts here</h2><p>Search a registration number or choose one of the 50 vehicles.<br>Sales documents and service records will appear together.</p><button (click)="loadDemo()">Explore a vehicle →</button></section>}
<footer><span>UNIFIELD / DOCUMENT INTELLIGENCE</span><span>INR · Kilometres</span></footer></main>
@if(editing && draft){<div class="modal-backdrop"><section class="editor" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div class="side-title"><h2 id="edit-title">Edit vehicle report</h2><button (click)="editing=false" aria-label="Close editor">✕</button></div><p>Changes update the PDF and are saved in this browser for this registration number.</p><form (ngSubmit)="saveEdit()"><label>Owner<input name="owner" [(ngModel)]="draft.owner" required maxlength="160"></label><label>Dealership<input name="dealer" [(ngModel)]="draft.dealer" required maxlength="160"></label><label>Warranty<textarea name="warranty" [(ngModel)]="draft.warranty" maxlength="1000"></textarea></label><label>Additional report notes<textarea name="notes" [(ngModel)]="draftNotes" rows="6" maxlength="10000" placeholder="Add inspection findings, corrections, or other information…"></textarea></label><p class="muted">Source JSON stays unchanged. This editor adds report information; it does not modify uploaded PDF files. Standard Latin text is supported in PDF exports.</p>@if(editError){<p class="error" role="alert">{{editError}}</p>}<div class="editor-actions"><button type="button" (click)="editing=false">Cancel</button><button type="submit" class="primary">Save & refresh PDF</button></div></form></section></div>}
`})
export class App implements OnInit,OnDestroy {
  private sanitizer=inject(DomSanitizer);
  private changeDetector=inject(ChangeDetectorRef);
  registrationNumber=''; vehicles:Vehicle[]=[]; showSamples=false; loading=false;error=''; sale:Sale|null=null;history:History|null=null;
  pdfUrl:SafeResourceUrl|null=null; blobUrl='';pdf:jsPDF|null=null;editing=false;draft:Sale|null=null;notes='';draftNotes='';editError='';
  async ngOnInit(){
    log('info','catalog.load.started');
    try{
      const vehicles=await getJson<Vehicle[]>('/api/vehicles');
      if(!Array.isArray(vehicles)||vehicles.some(v=>!v||typeof v.registrationNumber!=='string'||typeof v.make!=='string'||typeof v.model!=='string'))throw new PortalError('Vehicle list is incomplete. Please refresh to retry.');
      this.vehicles=vehicles;log('info','catalog.load.completed',{count:vehicles.length});
    }catch(e){this.error=e instanceof PortalError?e.message:'Unable to load vehicles. Please refresh to retry.';log('error','catalog.load.failed');}
    finally{this.changeDetector.markForCheck();}
  }
  get sortedRecords(){return [...(this.history?.records??[])].sort((a,b)=>b.date.localeCompare(a.date));}
  get latestOdometerKm(){return this.sortedRecords[0]?.odometerKm??0;}
  selectSample(e:Event){this.registrationNumber=(e.target as HTMLSelectElement).value;if(this.registrationNumber)this.search();}
  loadDemo(){if(this.vehicles.length){this.registrationNumber=this.vehicles[0].registrationNumber;this.search();}}
  async search(){
    if(this.loading)return;this.registrationNumber=this.registrationNumber.replace(/[\s-]/g,'').toUpperCase();this.error='';
    if(!/^(?:[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/.test(this.registrationNumber)){this.error='Enter a registration number such as MH12AB1234. Spaces and hyphens are accepted.';log('warn','search.validation.failed');return;}
    this.loading=true;this.sale=null;this.history=null;this.clearPdf();
    const requestedRegistration=this.registrationNumber;
    log('info','search.started');
    try{
      const [sale,history]=await Promise.all([getJson<Sale>('/api/sales/'+requestedRegistration),getJson<History>('/api/services/'+requestedRegistration)]);
      if(!sale||!history||sale.registrationNumber!==requestedRegistration||history.registrationNumber!==requestedRegistration||!Number.isFinite(sale.price)||!Array.isArray(sale.documents)||!Array.isArray(history.records)||sale.documents.some(d=>!d||typeof d.content!=='string')||history.records.some(r=>!r||!Array.isArray(r.work)||!Number.isFinite(r.cost)||!Number.isFinite(r.odometerKm)))throw new PortalError('The vehicle records are incomplete or inconsistent. Please retry.');
      this.sale=sale;this.history=history;this.notes='';
      try{const saved=JSON.parse(localStorage.getItem('unifield:'+requestedRegistration)||'null');if(saved && typeof saved.owner==='string' && typeof saved.dealer==='string' && typeof saved.warranty==='string' && typeof saved.notes==='string'){Object.assign(this.sale!,{owner:saved.owner,dealer:saved.dealer,warranty:saved.warranty});this.notes=saved.notes;log('info','report.saved_edits.restored');}}catch{log('warn','report.saved_edits.unavailable');}
      this.generatePdf();
      log('info','search.completed',{documents:sale.documents.length,visits:history.records.length});
    }catch(e){this.sale=null;this.history=null;this.clearPdf();this.error=e instanceof PortalError?e.message:'Unable to prepare the vehicle report. Please try again.';log('error','search.failed',{errorType:e instanceof Error?e.name:'Unknown'});}finally{
      this.loading=false;
      // Native async/await may resume outside Angular's zone. Notify Angular
      // after all response/PDF state changes instead of waiting for another input event.
      this.changeDetector.markForCheck();
    }
  }
  beginEdit(){if(!this.sale)return;this.draft=structuredClone(this.sale);this.draftNotes=this.notes;this.editError='';this.editing=true;log('info','report.edit.opened');}
  saveEdit(){
    if(!this.draft)return;
    if(!this.draft.owner.trim()||!this.draft.dealer.trim()){this.editError='Owner and dealership are required.';log('warn','report.edit.validation_failed');return;}
    const oldSale=this.sale,oldNotes=this.notes;
    this.sale=this.draft;this.notes=this.draftNotes;
    try{this.generatePdf();}catch{this.sale=oldSale;this.notes=oldNotes;this.editError='Unable to update the PDF. Your previous report is still available. Please retry.';log('error','report.edit.pdf_failed');return;}
    try{localStorage.setItem('unifield:'+this.sale.registrationNumber,JSON.stringify({owner:this.sale.owner,dealer:this.sale.dealer,warranty:this.sale.warranty,notes:this.notes}));this.editing=false;log('info','report.edit.saved');}
    catch{this.editError='PDF updated, but browser storage is unavailable. Download your PDF before leaving.';log('warn','report.edit.storage_failed');}
  }
  clearPdf(){if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.blobUrl='';this.pdfUrl=null;this.pdf=null;}
  generatePdf(){
    try {
    if(!this.sale||!this.history)throw new PortalError('Load a vehicle before generating a PDF.');log('info','pdf.generate.started');const s=this.sale,h=this.history,doc=new jsPDF();let y=0;
    const header=()=>{doc.setFillColor(19,43,49);doc.rect(0,0,210,28,'F');doc.setTextColor(255);doc.setFontSize(16);doc.text('UNIFIELD / VEHICLE INTELLIGENCE',16,18);doc.setTextColor(35,52,57);y=42;};header();
    const line=(text:string,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(text,176) as string[];for(const l of lines){if(y>274){doc.addPage();header();}doc.text(l,17,y);y+=size*0.48+2;}y+=2;};
    const section=(title:string)=>{if(y>250){doc.addPage();header();}y+=5;doc.setDrawColor(190,211,211);doc.line(17,y,193,y);y+=9;line(title,12,true);};
    line(`${s.year} ${s.make} ${s.model}`,22,true);line(`Registration number: ${s.registrationNumber} | Color: ${s.color}`);line(`Report generated: ${new Date().toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'})}`,9);
    section('01 / Sales & ownership');line(`Owner: ${s.owner}`);line(`Dealer: ${s.dealer}`);line(`Sale date: ${s.saleDate} | Purchase price: INR ${s.price.toLocaleString('en-IN')}`);line(`Warranty: ${s.warranty}`);
    section('02 / Sales documents');for(const d of s.documents){line(d.name,11,true);line(`Reference: ${d.reference} | Issued: ${d.date}`,9);line(d.content);}
    section('03 / Service history');line(`Next service: ${h.nextService} or ${h.nextServiceKm.toLocaleString('en-IN')} km`);for(const r of this.sortedRecords){line(`${r.date} - ${r.type} - ${r.odometerKm.toLocaleString('en-IN')} km`,11,true);line(`${r.center} | Technician: ${r.technician} | INR ${r.cost.toFixed(2)}`);for(const w of r.work)line('- '+w);line(r.notes);}
    if(this.notes.trim()){section('04 / Manually added notes');line(this.notes);}
    const count=doc.getNumberOfPages();for(let p=1;p<=count;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(100);doc.text(`${s.registrationNumber} | Unifield vehicle report`,17,289);doc.text(`${p} / ${count}`,181,289);}
    const newUrl=URL.createObjectURL(doc.output('blob'));
    let safeUrl:SafeResourceUrl;
    try{safeUrl=this.sanitizer.bypassSecurityTrustResourceUrl(newUrl+'#toolbar=1&navpanes=0');}catch(e){URL.revokeObjectURL(newUrl);throw e;}
    this.clearPdf();this.pdf=doc;this.blobUrl=newUrl;this.pdfUrl=safeUrl;log('info','pdf.generate.completed',{pages:count});
    } catch(error) { log('error','pdf.generate.failed',{errorType:error instanceof Error?error.name:'Unknown'}); throw error; }
  }
  async download(){try{if(!this.pdf)throw new PortalError('Load a vehicle before downloading its report.');log('info','pdf.download.started');await this.pdf.save(`Unifield-${this.sale?.registrationNumber}.pdf`,{returnPromise:true});log('info','pdf.download.prepared');}catch(e){this.error=e instanceof PortalError?e.message:'Unable to download the PDF. Please try again.';log('error','pdf.download.failed');}finally{this.changeDetector.markForCheck();}}
  ngOnDestroy(){this.clearPdf();}
}
