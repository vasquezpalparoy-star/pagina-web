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
