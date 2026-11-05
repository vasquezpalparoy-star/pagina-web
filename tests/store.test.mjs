import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAction} from '../supabase/functions/grafiplot-store/actions.mjs';
import {validateOrder,OWNER_UID} from '../supabase/functions/grafiplot-store/core.mjs';
const delivery={recipient:'Cliente de prueba',phone:'900000000',address:'Calle de ejemplo 123',reference:'',payment:'Yape'};
const order={id:'d2c2714c-dd87-4e1b-80b5-811f031cbb07',delivery,items:[{name:'Papel',quantity:3,price:0.1}]};
test('order validation computes money from line items and rejects malformed prices and quantities',()=>{
 assert.equal(validateOrder({...order,total:0}).total,0.3);
 for(const item of [{name:'x',price:1,quantity:0},{name:'x',price:NaN,quantity:1},{name:'x',price:-1,quantity:1}])assert.throws(()=>validateOrder({...order,items:[item]}));
 assert.throws(()=>validateOrder({...order,delivery:{...delivery,payment:'Tarjeta robada'}}));
});
test('customer cannot list other customers or change any order status',async()=>{
 for(const action of ['admin_customers','admin_orders','admin_status']){
  let called=false;
  await assert.rejects(handleAction({action,id:order.id,status:'entregado'},{sub:'customer-1'},async()=>{called=true}),e=>e.status===403);
  assert.equal(called,false);
 }
});
test('history and profile force the token owner even when another UID is supplied',async()=>{
 const calls=[];const database=async path=>{calls.push(path);return []};
 await handleAction({action:'orders',customer:'customer-2'},{sub:'customer-1'},database);
 await handleAction({action:'profile',customer:'customer-2'},{sub:'customer-1'},database);
 assert.ok(calls.every(path=>path.includes('customer_uid=eq.customer-1')));
});
test('submission derives owner and email from verified identity and recalculates total',async()=>{
 let call;
 await handleAction({action:'submit_order',order:{...order,customer_uid:'other',total:900}},{sub:'customer-1',email:'test@example.invalid'},async(...args)=>{call=args;return {id:order.id}});
 assert.equal(call[2].p_uid,'customer-1');assert.equal(call[2].p_email,'test@example.invalid');assert.equal(call[2].p_total,0.3);
});
test('owner access also requires verified email',async()=>{
 await assert.rejects(handleAction({action:'admin_orders'},{sub:OWNER_UID,email_verified:false},async()=>[]),e=>e.status===403);
 const result=await handleAction({action:'admin_orders'},{sub:OWNER_UID,email_verified:true},async()=>[]);
 assert.deepEqual(result,{orders:[],more:false});
});

test('live alerts and delivery management are restricted to the verified owner',async()=>{
 for(const action of ['admin_live','admin_deliveries','admin_delivery_update']){
  let called=false;
  await assert.rejects(handleAction({action},{sub:'customer'},async()=>{called=true}),error=>error.status===403);
  assert.equal(called,false);
 }
});
test('confirming an order calls the atomic queue operation',async()=>{
 let call;
 const result=await handleAction({action:'admin_status',id:order.id,status:'confirmado'},{sub:OWNER_UID,email_verified:true},async(...args)=>{call=args;return {id:order.id,status:'confirmado'}});
 assert.equal(call[0],'rpc/gp_web_set_order_status');
 assert.deepEqual(call[2],{p_id:order.id,p_status:'confirmado'});
 assert.equal(result.order.status,'confirmado');
});
test('customer delivery information is limited to the same account and returned orders',async()=>{
 const calls=[];
 const result=await handleAction({action:'orders',customer:'other'},{sub:'customer'},async path=>{
  calls.push(path);return path.startsWith('gp_web_orders')?[{...order,customer_uid:'customer'}]:[{order_id:order.id,status:'en_camino'}];
 });
 assert.ok(calls.every(path=>path.includes('customer_uid=eq.customer')));
 assert.equal(result.orders[0].shipping.status,'en_camino');
});
test('live alert cursor follows server sequence and rejects malformed cursors',async()=>{
 const identity={sub:OWNER_UID,email_verified:true};
 const baseline=await handleAction({action:'admin_live'},identity,async()=>[{event_seq:8}]);
 assert.deepEqual(baseline,{events:[],cursor:'8',more:false});
 const next=await handleAction({action:'admin_live',cursor:'8'},identity,async path=>path.includes('order=event_seq.desc')?[{event_seq:10}]:[{event_seq:9},{event_seq:10}]);
 assert.equal(next.cursor,'10');assert.equal(next.events.length,2);
 await assert.rejects(handleAction({action:'admin_live',cursor:'bad'},identity,async()=>[]),/Cursor/);
});
