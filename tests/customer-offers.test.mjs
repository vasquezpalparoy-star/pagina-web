import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOffer,currentOffer,OWNER_UID} from '../supabase/functions/grafiplot-store/core.mjs';
import {handleAction} from '../supabase/functions/grafiplot-store/actions.mjs';
const sample={title:'Cliente frecuente',kind:'percent',amount:10,active:true,expiresOn:'2026-11-30'};
test('private offers validate amounts and use the final day in Peru for expiration',()=>{
  assert.equal(validateOffer(sample).expires_at,'2026-12-01T04:59:59.999Z');
  for(const amount of [0,0.001,-1,101,NaN])assert.throws(()=>validateOffer({...sample,amount}));
  for(const expiresOn of ['2026-02-30','not-a-date'])assert.throws(()=>validateOffer({...sample,expiresOn}));
  assert.equal(validateOffer({...sample,kind:'fixed',amount:500}).amount,500);
  assert.equal(currentOffer({...sample,active:false}),null);
  assert.equal(currentOffer({...sample,expires_at:'2020-01-01T00:00:00Z'}),null);
});
test('only the verified owner can read or modify a selected customer discount',async()=>{
  for(const action of ['admin_offer','admin_save_offer']){
    let databaseCalled=false;
    await assert.rejects(handleAction({action,customer:'customer-2',offer:sample},{sub:'customer-1'},async()=>{databaseCalled=true}),e=>e.status===403);
    assert.equal(databaseCalled,false);
    await assert.rejects(handleAction({action,customer:'customer-2',offer:sample},{sub:OWNER_UID,email_verified:false},async()=>[]),e=>e.status===403);
  }
});
test('customer profile only returns its own active offer',async()=>{
  const calls=[];
  const result=await handleAction({action:'profile',customer:'someone-else'},{sub:'customer-1'},async path=>{
    calls.push(path);
    return path.startsWith('gp_web_customer_offers')?[{title:'Privado',amount:10,kind:'percent',active:true,expires_at:null}]:[];
  });
  assert.ok(calls.every(path=>path.includes('customer_uid=eq.customer-1')));
  assert.equal(result.offer.title,'Privado');
});
test('discount updates bind customer and actor on the server',async()=>{
  let payload;
  await handleAction({action:'admin_save_offer',customer:'customer-1',offer:sample},{sub:OWNER_UID,email_verified:true},async(path,method,data)=>{
    if(method==='POST'){payload=data;return [data]}
    return [{customer_uid:'customer-1'}];
  });
  assert.equal(payload.customer_uid,'customer-1');
  assert.equal(payload.updated_by,OWNER_UID);
  assert.equal(payload.amount,10);
});
