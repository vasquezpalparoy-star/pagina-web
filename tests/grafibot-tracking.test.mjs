import test from 'node:test';import assert from 'node:assert/strict';
import {detectTracking,lookupTracking,publicStatus} from '../assets/v1/grafibot-tracking.mjs';
const token='a'.repeat(64);
test('automatically detects a bare Peruvian phone and international formats',()=>{
 for(const s of ['900123456','900 123 456','+51 900-123-456','51900123456'])assert.deepEqual(detectTracking(s),{kind:'phone',value:'900123456'});
 for(const s of ['100','100 hojas','90012345','123456789','100 lapiceros'])assert.equal(detectTracking(s),null);
});
test('recognizes only legitimate private tracking links',()=>{
 assert.deepEqual(detectTracking('https://www.grafiplotvasquez.com/delivery-track.html#'+token),{kind:'link',value:token});
 assert.deepEqual(detectTracking(token),{kind:'link',value:token});
 assert.equal(detectTracking('https://example.com/delivery-track.html#'+token).kind,'invalid');
 assert.equal(detectTracking('https://www.grafiplotvasquez.com/delivery-track.html#bad').kind,'invalid');
 assert.equal(detectTracking('https://www.grafiplotvasquez.com.evil.test/delivery-track.html#'+token).kind,'invalid');
});
test('phone lookup uses existing endpoint and exposes only the latest active status',async()=>{
 let request;
 const result=await lookupTracking(detectTracking('900123456'),{fetcher:async(url,opt)=>{request={url,body:JSON.parse(opt.body)};return {ok:true,json:async()=>({orders:[{status:'entregado'},{reference:'GP-1',status:'en_proceso',estimated_at:'2026-11-20T21:00:00Z',address:'private',customerName:'private'}]})}}});
 assert.equal(request.body.action,'track_phone');assert.equal(request.body.phone,'900123456');
 assert.deepEqual(result,{reference:'GP-1',status:'en_proceso',estimatedAt:'2026-11-20T21:00:00.000Z'});
});
test('private link lookup respects expiry and active order status',async()=>{
 const q=detectTracking(token),now=()=>1000;
 const data={orderId:'abcdef12345678',status:'listo',expiresAt:new Date(2000),details:'private',amount:10};
 assert.deepEqual(await lookupTracking(q,{now,readLink:async()=>data}),{reference:'12345678',status:'listo',estimatedAt:null});
 assert.equal(await lookupTracking(q,{now,readLink:async()=>({...data,expiresAt:new Date(999)})}),null);
 assert.equal(await lookupTracking(q,{now,readLink:async()=>({...data,status:'entregado'})}),null);
 assert.equal(publicStatus({status:'invented'},'link'),null);
});
test('no active phone order and invalid input do not fabricate a status',async()=>{
 assert.equal(await lookupTracking(detectTracking('900123456'),{fetcher:async()=>({ok:true,json:async()=>({orders:[{status:'cancelado'}]})})}),null);
 assert.equal(await lookupTracking({kind:'invalid'},{fetcher:()=>{throw Error('must not fetch')}}),null);
});
