import test from 'node:test';import assert from 'node:assert/strict';import {OWNER_UID,isSettingsOwner,createSettingsAuth} from '../assets/v1/settings-auth.mjs';
const owner={uid:OWNER_UID,isAnonymous:false,emailVerified:true};
test('only the verified owner account unlocks settings',()=>{assert.equal(isSettingsOwner(owner),true);for(const user of [null,{...owner,isAnonymous:true},{...owner,uid:'other'},{...owner,emailVerified:false}])assert.equal(isSettingsOwner(user),false);});
test('wrong owner is signed out; anonymous sessions are removed; recovery does not require password',async()=>{let reset,signouts=0;const auth={currentUser:{isAnonymous:true}};const sdk={setPersistence:async()=>{},browserSessionPersistence:'session',signOut:async()=>{signouts++;auth.currentUser=null;},onAuthStateChanged:(a,fn)=>fn(null),signInWithEmailAndPassword:async()=>({user:{...owner,uid:'other'}}),sendPasswordResetEmail:async(a,email)=>reset=email};const service=createSettingsAuth(sdk,auth);await service.watch(allowed=>assert.equal(allowed,false));assert.equal(signouts,1);await assert.rejects(service.login('admin@example.com','password'),/permiso/);assert.equal(signouts,2);await service.reset(' Admin@Example.com ');assert.equal(reset,'admin@example.com');await assert.rejects(service.reset('bad'));});

test('writes refresh the owner token and reject unverified or changed sessions',async()=>{
 const user={uid:OWNER_UID,isAnonymous:false,emailVerified:true};
 const auth={currentUser:user};let forced=false;
 const sdk={reload:async()=>{},getIdToken:async(_,force)=>forced=force};
 const service=createSettingsAuth(sdk,auth);
 assert.equal(await service.assertOwner(),user);assert.equal(forced,true);
 user.emailVerified=false;await assert.rejects(service.assertOwner());
 user.emailVerified=true;sdk.reload=async()=>auth.currentUser=null;
 await assert.rejects(service.refresh());
});
test('logout cancels a login that finishes later',async()=>{
 const auth={currentUser:null};let finish;
 const sdk={
  signInWithEmailAndPassword:()=>new Promise(resolve=>{finish=()=>{const user={uid:OWNER_UID,isAnonymous:false,emailVerified:true};auth.currentUser=user;resolve({user})}}),
  signOut:async()=>auth.currentUser=null
 };
 const service=createSettingsAuth(sdk,auth);
 const login=service.login('owner@example.com','test-password');
 await service.logout();finish();
 await assert.rejects(login,/cancelado/);assert.equal(auth.currentUser,null);
});
