import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const assembly=process.argv[2];
assert.ok(assembly,'Pass the absolute path to the built VehicleDocumentPortal.dll');
const cwd=fileURLToPath(new URL('../',import.meta.url));
function start(extra=[]){
 let output='';
 const child=spawn('dotnet',[assembly,'--urls','http://127.0.0.1:0',...extra],{cwd,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
 const exited=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code));});
 return {child,exited,output:()=>output};
}
const server=start();
try{
 let url;
 for(let attempt=0;attempt<150;attempt++){
  for(const line of server.output().split(/\r?\n/))try{const log=JSON.parse(line);if(log.Message?.startsWith('Now listening on:'))url=log.State.address;}catch{}
  if(url)break;
  if(server.child.exitCode!==null)assert.fail('Server exited before startup: '+server.output());
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(url,'Server did not start');
 const success=await fetch(url+'/api/sales/MH12AB1234');assert.equal(success.status,200);assert.ok(success.headers.get('X-Request-ID'));
 const invalid=await fetch(url+'/api/services/INVALID');assert.equal(invalid.status,400);
 const missing=await fetch(url+'/api/unknown');assert.equal(missing.status,404);
 await missing.text();
 await new Promise(resolve=>setTimeout(resolve,100));
 const logs=server.output().split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
 assert.ok(logs.some(log=>log.State?.RequestId===success.headers.get('X-Request-ID')&&log.State?.StatusCode===200));
 assert.ok(logs.some(log=>log.LogLevel==='Warning'&&log.State?.StatusCode===400));
 assert.ok(!server.output().includes('MH12AB1234'),'Registration leaked into routine logs');
}finally{server.child.kill();await server.exited;}
const invalidRoot=await mkdtemp(join(tmpdir(),'unifield-invalid-data-'));
await mkdir(join(invalidRoot,'Data'));
await writeFile(join(invalidRoot,'Data','sales.json'),'{invalid JSON');
const failed=start(['--contentRoot',invalidRoot]);
const code=await failed.exited;
assert.notEqual(code,0);assert.match(failed.output(),/"LogLevel":"Critical"/);assert.match(failed.output(),/Portal startup failed/);
console.log('PASS: structured request logs, matching request IDs, warning levels, no registration in routine logs, and critical startup failure for invalid JSON.');
