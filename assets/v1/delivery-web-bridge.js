import * as sdk from './firebase.js?v=email-settings-20261005';
import {onIdTokenChanged} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {USER_FIREBASE_CONFIG} from './config.js';
import {isSettingsOwner} from './settings-auth.mjs?v=owner-20261105';
import {mountDeliveryQueue} from './web-delivery-ui.js?v=live1';

const target=document.getElementById('web-delivery-queue');
const auth=sdk.getAuth(sdk.initializeApp(USER_FIREBASE_CONFIG,'grafiplot-delivery'));
let queue=null,timer=null;
onIdTokenChanged(auth,user=>{
  clearInterval(timer);queue?.stop();queue=null;target.hidden=true;
  if(!isSettingsOwner(user))return;
  queue=mountDeliveryQueue(target,user);
  timer=setInterval(()=>queue?.refresh(),20000);
});
window.addEventListener('pagehide',()=>{clearInterval(timer);queue?.stop()});
