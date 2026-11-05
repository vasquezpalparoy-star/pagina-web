import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import vm from 'node:vm';
import {webcrypto,randomUUID} from 'node:crypto';
async function fixture(storeRequest=async()=>({profile:null})){
 const {document,window}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));
 window.HTMLElement.prototype.scrollIntoView=function(){};
 window.HTMLElement.prototype.showModal=function(){this.open=true};
 window.HTMLElement.prototype.close=function(){this.open=false};
 const data={recipient:'Cliente de ejemplo',phone:'900000000',address:'Calle de ejemplo 123',reference:'Frente al parque',payment:'Yape'};
 const fields=Object.fromEntries(Object.entries(data).map(([key,value])=>[key,{value}]));
 const details=document.getElementById('delivery-details');Object.defineProperty(details,'elements',{value:fields});details.reportValidity=()=>true;
 const cache=new Map();const storage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
 let source=await readFile(new URL('../assets/v1/checkout.js',import.meta.url),'utf8');
 source=source.replace(/^import .*;$/gm,'');
 const start=source.indexOf('function authClient(){'),end=source.indexOf('\nconst authError',start);
 source=source.slice(0,start)+"function authClient(){return Promise.resolve({auth:testAuth})}"+source.slice(end);
 const context=vm.createContext({document,window,testAuth:{currentUser:null},storeRequest,createCustomerHistory:()=>({panel:document.createElement('details'),clear(){}}),console,URL,File,TextEncoder,crypto:{subtle:webcrypto.subtle,randomUUID},localStorage:storage,sessionStorage:storage,navigator:{},ClipboardItem:undefined});
 vm.runInContext(source,context);return {document,window,context,fields,data};
}
test('full WhatsApp text remains usable when canvas image generation fails',async()=>{
 const f=await fixture();
 f.window.dispatchEvent(new f.window.CustomEvent('gp-prepare-delivery',{detail:[{name:'Papel A4',quantity:3,price:0.1}]}));
 assert.equal(f.document.getElementById('delivery-receipt').hidden,true);
 f.document.querySelector('[data-option=consult]').click();
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

test('text receipt shows the discount and the server-confirmed products total',async()=>{
 const f=await fixture();
 f.context.data=f.data;f.context.items=[{name:'Papel',quantity:1,price:100}];
 f.context.summary={subtotal:100,discount_amount:10,total:90,offer_snapshot:{title:'Cliente frecuente'}};
 const text=vm.runInContext("orderText(data,items,'TEST',summary)",f.context);
 assert.match(text,/Subtotal: S\/ 100.00/);
 assert.match(text,/Descuento: −S\/ 10.00/);
 assert.match(text,/Total de productos: S\/ 90.00/);
});

test('delivery choice is required before saving and server discount plus delivery appears in fallback text',async()=>{
 const calls=[];
 const f=await fixture(async(user,action,payload)=>{
  calls.push({action,payload});
  if(action==='profile')return {profile:null};
  return {order:{subtotal:10,discount_amount:2,total:8,offer_snapshot:{title:'Cliente frecuente'}}};
 });
 const user={uid:'customer-1',email:'example@example.invalid'};
 f.context.testAuth.currentUser=user;f.context.user=user;
 await vm.runInContext('customerChanged(user)',f.context);
 f.window.dispatchEvent(new f.window.CustomEvent('gp-prepare-delivery',{detail:[{name:'Papel',quantity:1,price:10}]}));
 assert.equal(calls.filter(c=>c.action==='submit_order').length,0);
 assert.equal(f.document.getElementById('delivery-option-dialog').open,true);
 f.document.querySelector('[data-option=fixed]').click();
 for(let i=0;i<20;i++)await new Promise(resolve=>setTimeout(resolve,5));
 const saved=calls.find(c=>c.action==='submit_order');assert.equal(saved.payload.order.delivery.deliveryOption,'fixed');
 const text=new URL(f.document.getElementById('delivery-send-text').getAttribute('href')).searchParams.get('text');
 assert.match(text,/Delivery: S\/ 3.00/);assert.match(text,/Total con delivery: S\/ 11.00/);
});
test('closing the delivery choice does not register an order',async()=>{
 let submitted=false;const f=await fixture(async()=>{submitted=true;return {}});
 f.window.dispatchEvent(new f.window.CustomEvent('gp-prepare-delivery',{detail:[{name:'Papel',quantity:1,price:10}]}));
 f.document.querySelector('[data-cancel]').click();
 assert.equal(submitted,false);assert.equal(f.document.getElementById('delivery-option-dialog').open,false);
 assert.equal(f.document.getElementById('delivery-receipt').hidden,true);
});
