import {mountManualPhoneSync} from './manual-phone-sync.js?v=phone1';
import * as sdk from './firebase.js?v=email-settings-20261005';
import {onIdTokenChanged} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {USER_FIREBASE_CONFIG} from './config.js';
import {isSettingsOwner} from './settings-auth.mjs?v=owner-20261105';
import {mountDeliveryQueue,mountPendingOrders} from './web-delivery-ui.js?v=choice2';
const target=document.getElementById('web-delivery-queue');
const auth=sdk.getAuth(sdk.initializeApp(USER_FIREBASE_CONFIG,'grafiplot-delivery'));
let queue=null,requests=null,timer=null,manual=null;
function stop(){manual?.stop();manual=null;clearInterval(timer);queue?.stop();requests?.stop();queue=null;requests=null;target.replaceChildren();target.hidden=true}
onIdTokenChanged(auth,user=>{
 stop();if(!user||user.isAnonymous)return;
 target.hidden=false;
 if(!isSettingsOwner(user)){
  const note=document.createElement('p');note.textContent='Para ver los pedidos del carrito, ingresa con la cuenta verificada del dueño.';
  const link=document.createElement('a');link.href='./pedidos-delivery.html';link.textContent='Abrir pedidos web y alertas';target.append(note,link);return;
 }
 const title=document.createElement('h2');title.textContent='Pedidos recibidos desde la web';
 const note=document.createElement('p');note.textContent='Los pedidos del carrito aparecen aquí al registrarse. Confírmalos para iniciar su delivery. Los contadores inferiores corresponden a registros manuales.';
 const pending=document.createElement('section'),deliveries=document.createElement('section');target.append(title,note,pending,deliveries);
 manual=mountManualPhoneSync(user,target);
 queue=mountDeliveryQueue(deliveries,user);requests=mountPendingOrders(pending,user,()=>queue?.refresh());
 timer=setInterval(()=>{requests?.refresh();queue?.refresh()},15000);
});
window.addEventListener('pagehide',stop);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
