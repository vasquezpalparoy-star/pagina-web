import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mountDeliveryQueue,mountPendingOrders} from '../assets/v1/web-delivery-ui.js';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const delivery={recipient:'Cliente de prueba',phone:'900000000',address:'Dirección de ejemplo',reference:'Puerta azul',payment:'Yape'};
const original={id,delivery,items:[{name:'Papel',quantity:2,price:5}],total:10,status:'solicitado'};
const user={getIdToken:async()=> 'test-only-token'};
const settle=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve))};
function documentFixture(){
 const {document,window}=parseHTML('<main><section id="requests"></section><section id="queue"></section></main>');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.getAttribute('data-value')||''},set(value){this.setAttribute('data-value',value)},configurable:true});
 globalThis.document=document;return document;
}
test('confirming a web request refreshes one delivery with the original customer details',async()=>{
 const savedFetch=globalThis.fetch;
 const document=documentFixture();let pending=[original],deliveries=[],updates=0;
 globalThis.fetch=async(_url,options)=>{
  const input=JSON.parse(options.body);
  if(input.action==='admin_orders')return Response.json({orders:pending,more:false});
  if(input.action==='admin_deliveries')return Response.json({deliveries,more:false});
  if(input.action==='admin_status'){
   updates++;pending=[];deliveries=[{order_id:id,delivery,items:original.items,products_total:10,delivery_fee:null,status:'recibido',estimated_at:null}];
   return Response.json({order:{...original,status:'confirmado'}});
  }
  throw Error(input.action);
 };
 const queue=mountDeliveryQueue(document.getElementById('queue'),user);
 const requests=mountPendingOrders(document.getElementById('requests'),user,()=>queue.refresh());
 try{
  await settle();
  document.querySelector('#requests .web-order-controls button').click();
  await settle();
  assert.equal(updates,1);
  assert.equal(document.querySelectorAll('#queue .web-order-card').length,1);
  assert.match(document.querySelector('#queue').textContent,/Dirección de ejemplo/);
  assert.match(document.querySelector('#queue').textContent,/900000000/);
  assert.match(document.querySelector('#queue').textContent,/Yape/);
  assert.match(document.querySelector('#requests').textContent,/No hay pedidos pendientes/);
 }finally{requests.stop();queue.stop();globalThis.fetch=savedFetch;delete globalThis.document}
});
test('delivery editing sends the selected status, fee and Peru time',async()=>{
 const savedFetch=globalThis.fetch;
 const document=documentFixture();let captured;
 const row={order_id:id,delivery,items:original.items,products_total:10,delivery_fee:null,status:'recibido',estimated_at:null};
 globalThis.fetch=async(_url,options)=>{
  const input=JSON.parse(options.body);
  if(input.action==='admin_delivery_update'){captured=input.delivery;return Response.json({delivery:{...row,status:input.delivery.status}})}
  return Response.json({deliveries:[row],more:false});
 };
 const queue=mountDeliveryQueue(document.getElementById('queue'),user);
 try{
  await settle();
  const form=document.querySelector('.web-delivery-form');
  form.querySelector('select').value='en_camino';
  form.querySelector('input[type=number]').value='4.50';
  form.querySelector('input[type=datetime-local]').value='2026-11-05T15:30';
  await form.onsubmit({preventDefault(){}});
  assert.equal(captured.status,'en_camino');assert.equal(captured.fee,4.5);
  assert.equal(captured.estimatedAt,'2026-11-05T15:30:00-05:00');
 }finally{queue.stop();globalThis.fetch=savedFetch;delete globalThis.document}
});
test('a rejected private request clears delivery details from the panel',async()=>{
 const savedFetch=globalThis.fetch;
 const document=documentFixture();let reject=false;
 globalThis.fetch=async()=>reject?Response.json({error:'Sesión vencida'},{status:401}):Response.json({deliveries:[{order_id:id,delivery,items:original.items,products_total:10,delivery_fee:0,status:'recibido',estimated_at:null}],more:false});
 const queue=mountDeliveryQueue(document.getElementById('queue'),user);
 try{
  await settle();assert.equal(document.querySelectorAll('.web-order-card').length,1);
  reject=true;await queue.refresh();
  assert.equal(document.querySelectorAll('.web-order-card').length,0);
  assert.match(document.querySelector('#queue').textContent,/Sesión vencida/);
 }finally{queue.stop();globalThis.fetch=savedFetch;delete globalThis.document}
});

test('the delivery administrator bridge lists cart requests before confirmation',async()=>{
 const {readFile}=await import('node:fs/promises');const vm=await import('node:vm');
 const savedFetch=globalThis.fetch;const document=documentFixture();
 const target=document.createElement('section');target.id='web-delivery-queue';document.body.append(target);
 const actions=[];let changed;let timer;
 globalThis.fetch=async(_url,options)=>{const input=JSON.parse(options.body);actions.push(input.action);return Response.json(input.action==='admin_orders'?{orders:[original],more:false}:{deliveries:[],more:false})};
 const source=(await readFile(new URL('../assets/v1/delivery-web-bridge.js',import.meta.url),'utf8')).replace(/^import .*;$/gm,'');
 const context=vm.createContext({document,window:{addEventListener(){}},location:{reload(){}},sdk:{getAuth(){return {}},initializeApp(){}},USER_FIREBASE_CONFIG:{},onIdTokenChanged(_auth,fn){changed=fn},isSettingsOwner:account=>account?.uid==='owner',mountManualPhoneSync:()=>({stop(){}}),mountDeliveryQueue,mountPendingOrders,setInterval(fn){timer=fn;return 1},clearInterval(){}});
 try{
  vm.runInContext(source,context);changed({...user,uid:'owner'});await settle();
  assert.ok(actions.includes('admin_orders'));assert.match(target.textContent,/Cliente de prueba/);
  assert.match(target.textContent,/Confirmar y agregar al delivery/);assert.equal(typeof timer,'function');
  changed(null);assert.equal(target.hidden,true);assert.equal(target.textContent,'');
 }finally{globalThis.fetch=savedFetch;delete globalThis.document}
});
