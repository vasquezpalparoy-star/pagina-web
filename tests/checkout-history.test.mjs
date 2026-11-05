import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import vm from 'node:vm';
import {webcrypto,randomUUID} from 'node:crypto';
async function fixture(storeRequest=async()=>({profile:null})){
 const {document,window}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));
 window.HTMLElement.prototype.scrollIntoView=function(){};
 const data={recipient:'Cliente de ejemplo',phone:'900000000',address:'Calle de ejemplo 123',reference:'Frente al parque',payment:'Yape'};
 const fields=Object.fromEntries(Object.entries(data).map(([key,value])=>[key,{value}]));
 const details=document.getElementById('delivery-details');Object.defineProperty(details,'elements',{value:fields});details.reportValidity=()=>true;
 const cache=new Map();const storage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
 let source=await readFile(new URL('../assets/v1/checkout.js',import.meta.url),'utf8');
 source=source.replace(/^import .*;$/gm,'');
 const start=source.indexOf('function authClient(){'),end=source.indexOf('\nconst authError',start);
 source=source.slice(0,start)+"function authClient(){return Promise.resolve({auth:{currentUser:null}})}"+source.slice(end);
 const context=vm.createContext({document,window,storeRequest,createCustomerHistory:()=>({panel:document.createElement('details'),clear(){}}),console,URL,File,TextEncoder,crypto:{subtle:webcrypto.subtle,randomUUID},localStorage:storage,sessionStorage:storage,navigator:{},ClipboardItem:undefined});
 vm.runInContext(source,context);return {document,window,context,fields,data};
}
test('full WhatsApp text remains usable when canvas image generation fails',async()=>{
 const f=await fixture();
 f.window.dispatchEvent(new f.window.CustomEvent('gp-prepare-delivery',{detail:[{name:'Papel A4',quantity:3,price:0.1}]}));
 for(let i=0;i<20;i++)await new Promise(resolve=>setTimeout(resolve,5));
 const url=new URL(f.document.getElementById('delivery-send-text').getAttribute('href'));const message=url.searchParams.get('text');
 assert.equal(url.pathname,'/51916133647');
 for(const part of ['Cliente de ejemplo','900000000','Calle de ejemplo 123','Frente al parque','Yape','3 × Papel A4','S/ 0.30'])assert.ok(message.includes(part),part);
 assert.equal(f.document.getElementById('delivery-receipt').hidden,false);
 assert.match(f.document.getElementById('delivery-feedback').textContent,/texto/);
});
test('pending order ID survives retries and changes for a different basket',async()=>{
 const f=await fixture();f.context.data=f.data;f.context.items=[{name:'Papel',quantity:1,price:1}];
 const first=await vm.runInContext('requestId(data,items)',f.context);const retry=await vm.runInContext('requestId(data,items)',f.context);
 assert.equal(first,retry);
 f.context.items[0].quantity=2;const next=await vm.runInContext('requestId(data,items)',f.context);assert.notEqual(first,next);
});
test('registered customer profile is recovered from Supabase instead of being tied to a device',async()=>{
 const f=await fixture(async()=>({profile:{recipient:'Cliente guardado',phone:'911111111',address:'Dirección guardada',reference:'Puerta azul',payment:'Plin'}}));
 f.context.user={uid:'customer-1',email:'example@example.invalid'};
 await vm.runInContext('customerChanged(user)',f.context);
 assert.equal(f.fields.recipient.value,'Cliente guardado');assert.equal(f.fields.address.value,'Dirección guardada');
 assert.equal(f.document.getElementById('delivery-profile-save').hidden,false);
});
