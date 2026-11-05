import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
test('owner monitoring resumes polling when the page becomes visible and stops on exit',async()=>{
 const {document,window}=parseHTML(await readFile(new URL('../pedidos-delivery.html',import.meta.url),'utf8'));
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 const timers=new Map();let timerId=0,calls=0;
 const storage=new Map();const user={uid:'owner',email:'owner@example.invalid',emailVerified:true};
 const auth={currentUser:user};const queues=[];
 const mount=()=>{const queue={refresh(){},stop(){this.stopped=true}};queues.push(queue);return queue};
 const service={watch:async fn=>fn(false,null),assertOwner:async()=>user};
 const source=(await readFile(new URL('../assets/v1/orders-monitor.js',import.meta.url),'utf8')).replace(/^import .*;$/gm,'');
 const context=vm.createContext({
  document,window,URL,location:{href:'https://www.grafiplotvasquez.com/pedidos-delivery.html'},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  sdk:{getAuth:()=>auth,initializeApp:()=>({})},USER_FIREBASE_CONFIG:{},createSettingsAuth:()=>service,isSettingsOwner:()=>true,settingsAuthError:error=>error.message,
  storeRequest:async()=>{calls++;return {events:[],cursor:String(calls),more:false}},
  mountDeliveryQueue:mount,mountPendingOrders:mount,
  setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)
 });
 vm.runInContext(source,context);context.testUser=user;
 vm.runInContext('displaySession(true,testUser)',context);
 for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,1);assert.equal(timers.size,1);
 document.dispatchEvent(new window.Event('visibilitychange'));
 for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2);assert.equal(timers.size,1);
 window.dispatchEvent(new window.Event('pagehide'));
 assert.equal(timers.size,0);assert.ok(queues.every(queue=>queue.stopped));
});
