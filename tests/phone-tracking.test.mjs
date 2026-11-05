import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {trackPhone} from '../supabase/functions/grafiplot-store/phone.mjs';
import {normalizePhone,OWNER_UID} from '../supabase/functions/grafiplot-store/core.mjs';
import {handleAction} from '../supabase/functions/grafiplot-store/actions.mjs';
import {manualTrackingRows} from '../assets/v1/manual-phone-sync.js';
test('phone normalization accepts Peru prefix and rejects incomplete or non-phone input',()=>{
 assert.equal(normalizePhone('+51 916 133 647'),'916133647');
 assert.equal(normalizePhone('916-133-647'),'916133647');
 for(const phone of ['123','abc916133647','012345678','+1 23456789012',null])assert.throws(()=>normalizePhone(phone));
});
test('public phone endpoint returns only the last active status and never forwards private customer fields',async()=>{
 let call;
 const result=await trackPhone('+51 916133647','test-ip','test-secret',async(...args)=>{
  call=args;return {orders:[{reference:'DONE',status:'entregado'},{reference:'ACTIVE',status:'en_camino',created_at:'2026-11-05T10:00:00Z',estimated_at:null,phone:'916133647',address:'private',items:['private'],customer_uid:'private',total:99},{reference:'OLDER',status:'recibido'}]};
 });
 assert.equal(call[0],'rpc/gp_web_track_phone');assert.equal(call[2].p_phone,'916133647');assert.match(call[2].p_bucket,/^[a-f0-9]{64}$/);
 assert.deepEqual(Object.keys(result.orders[0]),['reference','status','created_at','estimated_at']);
 assert.equal(result.orders.length,1);assert.equal(result.orders[0].reference,'ACTIVE');
 assert.ok(!JSON.stringify(result).includes('private'));
 await assert.rejects(trackPhone('916133647','test','secret',async()=>({limited:true})),e=>e.status===429);
});
test('only verified owner can synchronize minimal manual tracking and extra fields are discarded',async()=>{
 await assert.rejects(handleAction({action:'admin_sync_tracking',rows:[]},{sub:'customer'},async()=>{}),e=>e.status===403);
 let saved;
 await handleAction({action:'admin_sync_tracking',rows:[{id:'manual1',phone:'+51 916133647',status:'listo',created_at:null,estimated_at:null,address:'private',name:'private'}]},{sub:OWNER_UID,email_verified:true},async(...args)=>{saved=args;return null});
 assert.equal(saved[0],'rpc/gp_web_sync_manual_tracking');assert.equal(saved[2].p_rows[0].phone,'916133647');assert.ok(!JSON.stringify(saved).includes('private'));
 const rows=manualTrackingRows([{id:'one',customerUid:'c',status:'listo',createdAt:new Date('2026-11-05'),details:'private'}],[{uid:'c',phone:'+51 916133647',name:'private'}]);
 assert.equal(rows[0].phone,'916133647');assert.ok(!JSON.stringify(rows).includes('private'));
});
async function uiFixture(reply,illustrated=false){
 const {window,document}=parseHTML('<section id="gp-delivery-access"><form id="gp-phone-tracking"><input name="phone"><button>Consultar</button></form><p class="gp-phone-message"></p><div id="gp-phone-results"></div></section>');
 const form=document.querySelector('form'),phone=document.querySelector('input');phone.value='916133647';Object.defineProperty(form,'elements',{value:{phone}});
 const context=vm.createContext({document,window,AbortController,setTimeout,clearTimeout,Date,fetch:async()=>reply});
 if(illustrated)vm.runInContext(await readFile(new URL('../assets/v1/tracking-visual.js',import.meta.url),'utf8'),context);
 vm.runInContext(await readFile(new URL('../assets/v1/phone-tracking.js',import.meta.url),'utf8'),context);
 return {document,window,form,phone};
}
test('phone lookup updates the timeline, clears old results and omits closed deliveries',async()=>{
 const f=await uiFixture(Response.json({orders:[{reference:'CLOSED',status:'entregado'},{reference:'LATEST',status:'en_camino',created_at:'2026-11-05T10:00:00Z',estimated_at:null},{reference:'OLDER',status:'recibido'}]}));
 await f.form.onsubmit({preventDefault(){}});
 assert.equal(f.document.querySelectorAll('.gp-phone-result').length,1);
 assert.match(f.document.querySelector('#gp-phone-results').textContent,/LATEST/);
 assert.ok(!f.document.querySelector('#gp-phone-results').textContent.includes('OLDER'));
 assert.equal(f.document.querySelector('[aria-current=step]').textContent,'● En camino');
 f.phone.dispatchEvent(new f.window.Event('input'));assert.equal(f.document.querySelector('#gp-phone-results').textContent,'');
});
test('closed-only response shows no active delivery and rate-limit errors remain readable',async()=>{
 const f=await uiFixture(Response.json({orders:[{reference:'CLOSED',status:'cancelado'}]}));
 await f.form.onsubmit({preventDefault(){}});assert.match(f.document.querySelector('.gp-phone-message').textContent,/No hay deliveries activos/);
 const limited=await uiFixture(Response.json({error:'Espera un minuto.'},{status:429}));
 await limited.form.onsubmit({preventDefault(){}});assert.equal(limited.document.querySelector('.gp-phone-message').textContent,'Espera un minuto.');
 assert.equal(limited.form.querySelector('button').disabled,false);
});

test('phone lookup uses the real active status in the illustrated tracker',async()=>{
 const f=await uiFixture(Response.json({orders:[{reference:'REAL',status:'listo',created_at:'2026-11-05T10:00:00Z'}]}),true);
 assert.equal(f.document.querySelector('[aria-current=step]'),null);
 await f.form.onsubmit({preventDefault(){}});
 assert.equal(f.document.querySelector('[aria-current=step]').dataset.stage,'listo');
 assert.equal(f.document.querySelectorAll('.gv-art img').length,5);
});
