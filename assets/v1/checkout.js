import {USER_FIREBASE_CONFIG} from './config.js';
import {storeRequest,createCustomerHistory} from './store-client.js?v=choice2';

const byId=id=>document.getElementById(id);
const details=byId('delivery-details');
const account=byId('delivery-account');
const authForm=byId('delivery-auth-form');

const notice=byId('delivery-feedback');
const accountStatus=byId('delivery-account-status');
const receipt=byId('delivery-receipt');
const fields=['recipient','phone','address','reference','payment'];
const money=n=>'S/ '+n.toFixed(2);
let uid='', files=[], urls=[], revision=0, authReady, preparing=false;
const choice=document.createElement('dialog');choice.id='delivery-option-dialog';choice.setAttribute('aria-labelledby','delivery-option-title');
choice.innerHTML='<h2 id="delivery-option-title">¿Añadimos delivery?</h2><p>Elige cómo deseas coordinar la entrega de este pedido.</p><p id="delivery-option-total"></p><div class="delivery-option-actions"><button type="button" data-option="fixed" class="gp-button">Añadir delivery · S/ 3.00</button><button type="button" data-option="consult" class="gp-button secondary">Consultar con el administrador</button><button type="button" data-cancel>Volver al carrito</button></div><p>El local confirmará la disponibilidad del pedido.</p>';
document.getElementById('grafiplot-preview').append(choice);
const shippingText=data=>data.deliveryOption==='fixed'?'Delivery: S/ 3.00':'Delivery: consultar costo con el administrador';
const history=createCustomerHistory(async()=>{const {auth}=await authClient();return auth.currentUser});
byId('gp-checkout').insertBefore(history.panel,byId('gp-checkout').querySelector('h3'));
history.panel.hidden=true;
const personalOffer=document.createElement('div');personalOffer.id='delivery-personal-offer';personalOffer.hidden=true;
history.panel.after(personalOffer);
function showPersonalOffer(offer){
  personalOffer.replaceChildren();personalOffer.hidden=!offer;
  if(!offer)return;
  const title=document.createElement('strong');title.textContent=offer.title;
  const text=document.createElement('p');
  text.textContent=(offer.kind==='percent'?offer.amount+'% de descuento':money(Number(offer.amount))+' de descuento')+' para tus productos al registrar el pedido.';
  if(offer.expires_at)text.textContent+=' Válido hasta '+new Date(offer.expires_at).toLocaleDateString('es-PE',{timeZone:'America/Lima'})+'.';
  personalOffer.append(title,text);
}

const profileKey=id=>'grafiplot.delivery.profile.v1.'+id;
function invalidate(){
 revision++;
 urls.forEach(url=>URL.revokeObjectURL(url));urls=[];files=[];
 receipt.hidden=true;byId('delivery-pages').replaceChildren();byId('delivery-text').textContent='';notice.textContent='';byId('delivery-copy-image').hidden=true;
}
async function customerChanged(user){
 const next=user?.uid||'';
 if(uid!==next){if(uid)details.reset();invalidate();history.clear();showPersonalOffer(null)}
 uid=next;authForm.hidden=!!uid;byId('delivery-logout').hidden=!uid;
 byId('delivery-remember-label').hidden=true;byId('delivery-profile-save').hidden=!uid;history.panel.hidden=!uid;
 byId('gp-cart-send').textContent=uid?'Registrar pedido y preparar imagen':'Preparar imagen del pedido';
 accountStatus.textContent=user?'Sesión iniciada con '+user.email:'Puedes pedir como invitado o ingresar para guardar tus datos y pedidos en tu cuenta.';
 if(!uid)return;
 const currentRevision=revision;
 try{
  const {profile,offer}=await storeRequest(user,'profile');
  if(user.uid!==uid)return;
  showPersonalOffer(offer);
  if(currentRevision!==revision)return;
  const saved=profile||JSON.parse(localStorage.getItem(profileKey(uid))||'null');
  if(saved)fields.forEach(key=>details.elements[key].value=String(saved[key]||''));
 }catch{if(user.uid===uid)accountStatus.textContent+=' No se pudieron cargar los datos de tu cuenta. Puedes volver a ingresar o completar la dirección para este pedido.'}
}

function authClient(){
 if(!authReady)authReady=(async()=>{
  const [app,api]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js')]);
  const auth=api.getAuth(app.initializeApp(USER_FIREBASE_CONFIG,'grafiplot-checkout'));
  auth.languageCode='es';await api.setPersistence(auth,api.browserLocalPersistence);
  await auth.authStateReady();api.onAuthStateChanged(auth,customerChanged);
  return {auth,api};
 })().catch(error=>{authReady=null;throw error});
 return authReady;
}
const authError=e=>({'auth/email-already-in-use':'Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña.','auth/invalid-credential':'Revisa tu correo y contraseña.','auth/weak-password':'Usa una contraseña de al menos seis caracteres.','auth/too-many-requests':'Espera un momento antes de volver a intentar.'}[e.code]||'No se pudo completar la operación. Comprueba tu conexión e inténtalo otra vez.');
authForm.onsubmit=async e=>{
 e.preventDefault();const action=e.submitter?.value;
 const buttons=authForm.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 try{const {api,auth}=await authClient();const method=action==='register'?api.createUserWithEmailAndPassword:api.signInWithEmailAndPassword;
  await method(auth,authForm.elements.email.value.trim(),authForm.elements.password.value);authForm.elements.password.value='';
 }catch(error){accountStatus.textContent=authError(error)}finally{buttons.forEach(b=>b.disabled=false)}
};
byId('delivery-reset').onclick=async()=>{
 const email=authForm.elements.email;if(!email.reportValidity())return;
 try{const {auth,api}=await authClient();await api.sendPasswordResetEmail(auth,email.value.trim());accountStatus.textContent='Si existe una cuenta, recibirás instrucciones en tu correo.'}catch(e){accountStatus.textContent=authError(e)}
};
byId('delivery-logout').onclick=async()=>{try{const {auth,api}=await authClient();await api.signOut(auth)}catch(e){accountStatus.textContent=authError(e)}};
details.oninput=invalidate;
let previousCart='';
window.addEventListener('gp-delivery-changed',event=>{
 const signature=JSON.stringify(event.detail||[]);
 if(signature!==previousCart){
  previousCart=signature;
  try{sessionStorage.removeItem('gp-delivery-pending-'+(uid||'guest'))}catch{}
 }
 invalidate();
});
authClient().catch(()=>{accountStatus.textContent='La cuenta no está disponible ahora. Puedes continuar como invitado.'});

function wrap(ctx,text,width){
 const lines=[];let current='';
 for(const word of String(text).trim().split(/\s+/)){
  if(current&&ctx.measureText(current+' '+word).width>width){lines.push(current);current=''}
  for(const ch of (current?' ':'')+word){if(ctx.measureText(current+ch).width>width){lines.push(current);current=''}current+=ch}
 }
 if(current)lines.push(current);return lines;
}
async function makeReceipt(data,items,code,summary){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1400;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo crear la imagen.');
 const stamp=new Date();
 const lines=[];function add(text,bold=false){ctx.font=(bold?'700 ':'')+'25px Arial';wrap(ctx,text,800).forEach(line=>lines.push({line,bold}))}
 add('DATOS DE ENTREGA',true);add(data.recipient+' · '+data.phone);add(data.address);if(data.reference)add('Referencia: '+data.reference);add('Pago: '+data.payment);
 add('PRODUCTOS',true);let total=0;items.forEach(({quantity,name,price})=>{add(quantity+' × '+name,true);add(money(price)+' c/u   ·   '+money(quantity*price));total+=quantity*price});
 if(Number(summary?.discount_amount)>0){
  add('Subtotal: '+money(Number(summary.subtotal)));
  add('Descuento: −'+money(Number(summary.discount_amount))+' · '+summary.offer_snapshot.title,true);
 }
 add('Total de productos: '+money(Number(summary?.total??total)),true);add(shippingText(data));
 if(data.deliveryOption==='fixed')add('Total con delivery: '+money(Number(summary?.total??total)+3),true);
 add('Disponibilidad sujeta a confirmación del local.');
 const result=[],perPage=31,count=Math.ceil(lines.length/perPage);
 for(let page=0;page<count;page++){
  const rows=lines.slice(page*perPage,(page+1)*perPage);canvas.height=230+rows.length*36;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,900,canvas.height);ctx.fillStyle='#101e33';ctx.fillRect(0,0,900,118);
  ctx.fillStyle='#fff';ctx.font='bold 38px Arial';ctx.fillText('GRAFIPLOT VASQUEZ',48,55);ctx.font='24px Arial';ctx.fillText('Pedido de delivery · '+code,48,93);
  ctx.fillStyle='#cf1232';ctx.fillRect(0,118,900,6);
  rows.forEach(({line,bold},i)=>{ctx.fillStyle=bold?'#12223a':'#37455b';ctx.font=(bold?'700 ':'')+'25px Arial';ctx.fillText(line,48,172+i*36)});
  ctx.font='20px Arial';ctx.fillStyle='#46546b';ctx.fillText(stamp.toLocaleDateString('es-PE')+'   ·   Delivery 916 133 647',48,canvas.height-26);ctx.fillText((page+1)+' / '+count,780,canvas.height-26);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/png'));
  result.push(new File([blob],'Grafiplot-'+code+'-'+(page+1)+'.png',{type:'image/png'}));
 }
 return {result,code};
}
function deliveryData(){
 if(!details.reportValidity())return null;
 const data=Object.fromEntries(fields.map(k=>[k,details.elements[k].value.trim()]));
 if(!data.recipient||!data.address||!/^\+?[\d\s()-]+$/.test(data.phone)||!/^\d{7,15}$/.test(data.phone.replace(/\D/g,''))){
  notice.textContent='Completa el nombre, la dirección y un número de contacto válido.';return null;
 }
 return data;
}
byId('delivery-profile-save').onclick=async()=>{
 const data=deliveryData();if(!uid||!data)return;
 const button=byId('delivery-profile-save');button.disabled=true;
 try{
  const {auth}=await authClient();await storeRequest(auth.currentUser,'save_profile',{profile:data});
  notice.textContent='Datos guardados en tu cuenta. Se cargarán también al ingresar desde otro dispositivo.';
 }catch(error){notice.textContent=error.message}finally{button.disabled=false}
};
async function requestId(data,items){
 const encoded=new TextEncoder().encode(JSON.stringify([uid,data,items]));
 const hash=await crypto.subtle.digest('SHA-256',encoded);
 const signature=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
 const key='gp-delivery-pending-'+(uid||'guest');
 try{const previous=JSON.parse(sessionStorage.getItem(key)||'null');if(previous?.signature===signature)return previous.id}catch{}
 const id=crypto.randomUUID();try{sessionStorage.setItem(key,JSON.stringify({signature,id}))}catch{}
 return id;
}
function orderText(data,items,code,summary){
 const total=items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0)/100;
 return ['GRAFIPLOT VASQUEZ · PEDIDO DE DELIVERY '+code,
  'Cliente: '+data.recipient,'Contacto: '+data.phone,'Dirección: '+data.address,
  data.reference?'Referencia: '+data.reference:'','Pago: '+data.payment,'',
  ...items.map(item=>item.quantity+' × '+item.name+' · '+money(item.price)+' c/u · '+money(item.quantity*item.price)),
  '',...(Number(summary?.discount_amount)>0?['Subtotal: '+money(Number(summary.subtotal)),'Descuento: −'+money(Number(summary.discount_amount))+' · '+summary.offer_snapshot.title]:[]),
  'Total de productos: '+money(Number(summary?.total??total)),shippingText(data),
  ...(data.deliveryOption==='fixed'?['Total con delivery: '+money(Number(summary?.total??total)+3)]:[]),'Disponibilidad sujeta a confirmación del local.'
 ].filter(line=>line!=='').join('\n');
}
function copyImage(file,chatUrl){
 return async()=>{
  try{
   await navigator.clipboard.write([new ClipboardItem({'image/png':file})]);
   notice.textContent='Imagen copiada. En WhatsApp presiona Pegar o Ctrl + V y confirma el envío.';
   window.open(chatUrl,'_blank','noopener,noreferrer');
  }catch{notice.textContent='Este navegador no pudo copiar la imagen. Descárgala o envía el pedido en texto.'}
 };
}
async function prepareDelivery(items,option){
 invalidate();const data=deliveryData();if(!data)return;
 data.deliveryOption=option;preparing=true;
 const version=revision;const currentUid=uid;
 notice.textContent=uid?'Registrando pedido…':'Preparando pedido…';
 let saveNote='';
 try{
  const id=await requestId(data,items);const code=id.slice(0,8).toUpperCase();
  if(version!==revision)return;
  let summary=null;
  let text=orderText(data,items,code,summary);
  let chatUrl='https://wa.me/51916133647?text='+encodeURIComponent(text);
  byId('delivery-text').textContent=text;byId('delivery-send-text').href=chatUrl;byId('delivery-chat').href=chatUrl;receipt.hidden=false;
  if(currentUid){
   try{
    const {auth}=await authClient();
    if(auth.currentUser?.uid!==currentUid)throw Error('Tu sesión cambió. Revisa el pedido.');
    const saved=await storeRequest(auth.currentUser,'submit_order',{order:{id,delivery:data,items}});
    summary=saved.order;
    showPersonalOffer(Number(summary.discount_amount)>0?summary.offer_snapshot:null);
    saveNote=' Solicitud guardada y enviada al panel del local para confirmar.';history.refresh?.();
   }catch(error){saveNote=' No se pudo guardar en tu historial: '+error.message+' Puedes volver a pulsar Registrar pedido para reintentar.'}
  }
  if(version!==revision)return;
  try{
   text=orderText(data,items,code,summary);
   chatUrl='https://wa.me/51916133647?text='+encodeURIComponent(text);
   byId('delivery-text').textContent=text;byId('delivery-send-text').href=chatUrl;byId('delivery-chat').href=chatUrl;
   const {result}=await makeReceipt(data,items,code,summary);if(revision!==version)return;
   files=result;
   files.forEach((file,i)=>{
    const url=URL.createObjectURL(file);urls.push(url);
    const figure=document.createElement('figure'),img=document.createElement('img'),a=document.createElement('a');
    img.src=url;img.alt='Pedido de delivery, página '+(i+1);a.href=url;a.download=file.name;a.textContent='Descargar imagen '+(i+1);figure.append(img,a);
    if(i>0&&navigator.clipboard?.write&&window.ClipboardItem){const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar imagen '+(i+1)+' y abrir WhatsApp';copy.onclick=copyImage(file,chatUrl);figure.append(copy)}
    byId('delivery-pages').append(figure);
   });
   byId('delivery-copy-image').hidden=!(navigator.clipboard?.write&&window.ClipboardItem);
   byId('delivery-copy-image').onclick=copyImage(files[0],chatUrl);
   byId('delivery-share').hidden=!navigator.canShare?.({files});
   notice.textContent='Pedido listo para revisar y enviar.'+saveNote;
  }catch{notice.textContent='Puedes enviar el pedido completo en texto. La imagen no se pudo generar.'+saveNote}
  receipt.scrollIntoView({block:'nearest'});
 }catch{if(version===revision)notice.textContent='No se pudo preparar el pedido. Inténtalo de nuevo.'}
 finally{preparing=false}
}
window.addEventListener('gp-prepare-delivery',e=>{
 if(preparing){notice.textContent='El pedido se está registrando. Espera un momento.';return}
 invalidate();if(!deliveryData()||!Array.isArray(e.detail)||!e.detail.length)return;
 const items=e.detail.map(item=>({...item})),version=revision,accountUid=uid;
 const total=items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0)/100;
 byId('delivery-option-total').textContent='Productos: '+money(total)+' · Con delivery: '+money(total+3)+' antes de descuentos personales.';
 choice.querySelectorAll('[data-option]').forEach(button=>button.onclick=()=>{
  choice.close();if(version!==revision||uid!==accountUid){notice.textContent='El pedido cambió. Vuelve a revisarlo antes de registrar.';return}
  prepareDelivery(items,button.dataset.option);
 });
 choice.querySelector('[data-cancel]').onclick=()=>choice.close();
 if(!choice.open)choice.showModal();
});
byId('delivery-share').onclick=async()=>{try{await navigator.share({files,title:'Pedido de delivery Grafiplot'})}catch(e){if(e.name!=='AbortError')notice.textContent='Descarga la imagen y adjúntala en el chat de delivery.'}};

const shopNav=document.querySelector('.gp-shop-nav');
if(shopNav){
 const button=document.createElement('button');button.type='button';button.textContent='Mi cuenta';
 button.onclick=()=>{byId('gp-cart-nav').click();account.open=true;account.scrollIntoView({block:'center'});account.querySelector('summary').focus()};
 shopNav.append(button);
}
