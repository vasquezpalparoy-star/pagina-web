import * as sdk from './firebase.js?v=email-settings-20261005';
import {USER_FIREBASE_CONFIG} from './config.js';
import {createSettingsAuth,isSettingsOwner,settingsAuthError} from './settings-auth.mjs?v=owner-20261105';
import {storeRequest} from './store-api.js?v=delivery-live1';
import {mountDeliveryQueue,mountPendingOrders} from './web-delivery-ui.js?v=live1';

const $=id=>document.getElementById(id);
const auth=sdk.getAuth(sdk.initializeApp(USER_FIREBASE_CONFIG));
const owner=createSettingsAuth(sdk,auth);
let sessionEpoch=0,timer=null,queue=null,requests=null,user=null,unread=0,audio=null,sound=false,pollNow=null;
let currentView='pending';
let appearance='light';try{appearance=localStorage.getItem('gp-theme')||'light'}catch{}
function paintTheme(){document.body.dataset.appearance=appearance;$('orders-theme').textContent=appearance==='light'?'Modo oscuro':'Modo claro'}
paintTheme();$('orders-theme').onclick=()=>{appearance=appearance==='light'?'dark':'light';paintTheme();try{localStorage.setItem('gp-theme',appearance)}catch{}};
function showView(view){
 currentView=view;$('orders-pending').hidden=view!=='pending';$('orders-deliveries').hidden=view!=='deliveries';
 $('orders-view-pending').setAttribute('aria-pressed',String(view==='pending'));$('orders-view-delivery').setAttribute('aria-pressed',String(view==='deliveries'));
}
$('orders-view-pending').onclick=()=>showView('pending');$('orders-view-delivery').onclick=()=>showView('deliveries');
function feedback(text){$('orders-feedback').textContent=text}
function beep(){
 if(!sound||!audio)return;
 try{audio.resume();const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.frequency.value=740;gain.gain.setValueAtTime(.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.5);oscillator.start();oscillator.stop(audio.currentTime+.5)}catch{}
}
function notify(events){
 const pending=events.filter(event=>event.status==='solicitado');
 if(!pending.length)return;
 unread+=pending.length;$('orders-new').hidden=false;$('orders-new-text').textContent=unread+' pedidos nuevos de delivery';
 document.title='('+unread+') Pedidos de delivery | Grafiplot';beep();
 if('Notification' in window&&Notification.permission==='granted'){
  try{const notification=new Notification('Nuevo pedido de delivery',{body:pending.length+' pedidos recibidos. Abre el panel para revisar los detalles.',tag:'grafiplot-delivery'});
  notification.onclick=()=>{window.focus();showView('pending');notification.close()}}catch{}
 }
}
$('orders-read').onclick=()=>{unread=0;$('orders-new').hidden=true;document.title='Pedidos y alertas de delivery | Grafiplot'};
$('orders-sound').onclick=async()=>{
 if(sound){sound=false;$('orders-sound').textContent='Activar sonido';$('orders-sound').setAttribute('aria-pressed','false');return}
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio=audio||new Audio();await audio.resume();sound=true;$('orders-sound').textContent='Desactivar sonido';$('orders-sound').setAttribute('aria-pressed','true');beep()}
 catch{feedback('Este navegador no pudo activar el sonido. Los avisos en pantalla siguen disponibles.')}
};
$('orders-notifications').onclick=async()=>{
 if(!('Notification' in window)){feedback('Este navegador muestra los avisos dentro de la página.');return}
 try{const permission=await Notification.requestPermission();feedback(permission==='granted'?'Avisos del navegador activados mientras esta página esté abierta.':'Puedes seguir usando el aviso en pantalla y el sonido.')}catch{feedback('No se pudo activar el aviso del navegador.')}
};
function stop(){
 sessionEpoch++;pollNow=null;clearTimeout(timer);timer=null;queue?.stop();requests?.stop();queue=null;requests=null;
 unread=0;$('orders-new').hidden=true;$('orders-connection').textContent='Sin sesión';document.title='Pedidos y alertas de delivery | Grafiplot';
}
function displaySession(allowed,account){
 stop();user=allowed?account:null;
 $('orders-workspace').hidden=!allowed;$('orders-login').hidden=allowed||!!account;
 $('orders-verification').hidden=!account||allowed;$('orders-verification-email').textContent=account?.email||'';
 $('orders-logout').hidden=!account;
 if(!allowed)return;
 feedback('');const version=sessionEpoch;
 queue=mountDeliveryQueue($('orders-deliveries'),user);
 requests=mountPendingOrders($('orders-pending'),user,()=>queue?.refresh());
 showView(new URL(location.href).searchParams.get('view')==='deliveries'?'deliveries':currentView);
 let cursor=null;const checkpoint='gp-delivery-alert-cursor-'+user.uid;
 try{const saved=localStorage.getItem(checkpoint);if(saved&&/^\\d+$/.test(saved))cursor=saved}catch{}
 let polling=false;
 async function poll(){
  if(version!==sessionEpoch||!user||polling)return;
  polling=true;
  try{
   const result=await storeRequest(user,'admin_live',cursor===null?{}:{cursor});
   if(version!==sessionEpoch)return;
   if(cursor!==null)notify(result.events);
   cursor=result.cursor;try{localStorage.setItem(checkpoint,cursor)}catch{}
   $('orders-connection').textContent='Conectado · última revisión '+new Date().toLocaleTimeString('es-PE',{timeZone:'America/Lima'});
   requests?.refresh();queue?.refresh();
   timer=setTimeout(poll,result.more?250:15000);
  }catch(error){
   if(version!==sessionEpoch)return;
   if(error.status===401||error.status===403){displaySession(false,null);feedback(error.message);return}
   $('orders-connection').textContent='Conexión interrumpida. Reintentando…';timer=setTimeout(poll,20000);
  }finally{polling=false}
 }
 pollNow=poll;poll();
}
$('orders-login-form').onsubmit=async event=>{
 event.preventDefault();const form=event.currentTarget,button=$('orders-login-submit');button.disabled=true;
 try{const account=await owner.login(form.elements.email.value,form.elements.password.value);displaySession(isSettingsOwner(account),account)}
 catch(error){feedback(settingsAuthError(error))}
 finally{form.elements.password.value='';button.disabled=false}
};
$('orders-reset').onclick=async()=>{
 const field=$('orders-login-form').elements.email;if(!field.reportValidity())return;
 try{await owner.reset(field.value);feedback('Si el correo tiene una cuenta, recibirás el enlace de recuperación.')}catch(error){feedback(settingsAuthError(error))}
};
$('orders-logout').onclick=async()=>{displaySession(false,null);try{await owner.logout();feedback('Sesión cerrada.')}catch(error){feedback(settingsAuthError(error))}};
$('orders-verify-send').onclick=async()=>{try{await owner.sendVerification();feedback('Revisa tu correo y abre el enlace de verificación.')}catch(error){feedback(settingsAuthError(error))}};
$('orders-verify-check').onclick=async()=>{try{const account=await owner.refresh();displaySession(isSettingsOwner(account),account)}catch(error){feedback(settingsAuthError(error))}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user){clearTimeout(timer);pollNow?.();queue?.refresh();requests?.refresh()}});
owner.watch(displaySession).then(()=>{$('orders-login-submit').disabled=false;$('orders-reset').disabled=false}).catch(error=>feedback(settingsAuthError(error)));
window.addEventListener('pagehide',stop);

window.addEventListener('pageshow',event=>{if(event.persisted)owner.assertOwner().then(account=>displaySession(true,account)).catch(()=>displaySession(false,null))});
