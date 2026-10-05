import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeliveryService} from '../assets/v1/delivery-core.mjs';
test('real service creates and replaces a legacy order link with a clock ahead by one hour',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-grafiplot-delivery',firestore:{rules:await readFile(new URL('../firebase/firestore.production.rules',import.meta.url),'utf8')}});
 const actualNow=Date.now;
 try{
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await firestore.setDoc(firestore.doc(db,'deliveryAdmins/integration-admin'),{enabled:true});await firestore.setDoc(firestore.doc(db,'deliveryCustomers/integration-client'),{name:'Cliente'});await firestore.setDoc(firestore.doc(db,'deliveryOrders/integration-order'),{customerUid:'integration-client',customerName:'Cliente',details:'Dos tazas',address:'Privada',amount:25,deliveryFee:5,status:'recibido',estimatedAt:null,createdAt:firestore.Timestamp.now(),updatedAt:firestore.Timestamp.now(),leftStoreAt:null,deliveredAt:null});});
  const db=env.authenticatedContext('integration-admin',{email_verified:true,firebase:{sign_in_provider:'password'}}).firestore();const auth={currentUser:null};
  const sdk={...firestore,initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>db,setPersistence:async()=>{},signInWithEmailAndPassword:async()=>{auth.currentUser={uid:'integration-admin',isAnonymous:false,emailVerified:true};},signOut:async()=>{auth.currentUser=null;}};
  const service=createDeliveryService(sdk,{});await service.login('admin@example.com','unused',true);
  Date.now=()=>actualNow()+3600000;
  const newId=await service.createOrder({customerUid:'integration-client',details:'Pedido nuevo',address:'Privada',amount:10,deliveryFee:2,status:'recibido',estimatedAt:null});assert.ok(newId);
  const token=await service.createTrackingLink('integration-order');assert.match(token,/^[a-f0-9]{64}$/);
  Date.now=actualNow;
  const publicDb=env.unauthenticatedContext().firestore();assert.equal((await firestore.getDoc(firestore.doc(publicDb,'deliveryOrderLinks',token))).data().amount,25);
  const next=await service.createTrackingLink('integration-order');assert.notEqual(next,token);
  await assert.rejects(firestore.getDoc(firestore.doc(publicDb,'deliveryOrderLinks',token)));
  await service.updateOrder('integration-order',{details:'Dos tazas',address:'Privada',amount:25,deliveryFee:5,status:'entregado',estimatedAt:null});
  await assert.rejects(firestore.getDoc(firestore.doc(publicDb,'deliveryOrderLinks',next)));
 }finally{Date.now=actualNow;await env.cleanup();}
});
