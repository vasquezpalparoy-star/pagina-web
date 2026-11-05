import {USER_FIREBASE_CONFIG} from './config.js';

const byId=id=>document.getElementById(id);
const details=byId('delivery-details');
const account=byId('delivery-account');
const authForm=byId('delivery-auth-form');
const remember=details.elements.remember;
const notice=byId('delivery-feedback');
const accountStatus=byId('delivery-account-status');
const receipt=byId('delivery-receipt');
const fields=['recipient','phone','address','reference','payment'];
const money=n=>'S/ '+n.toFixed(2);
let uid='', files=[], urls=[], revision=0, authReady;
const profileKey=id=>'grafiplot.delivery.profile.v1.'+id;
function invalidate(){
 revision++;
 urls.forEach(url=>URL.revokeObjectURL(url));urls=[];files=[];
 receipt.hidden=true;byId('delivery-pages').replaceChildren();notice.textContent='';
}
function customerChanged(user){
 const next=user?.uid||'';
 if(uid!==next){if(uid)details.reset();invalidate()}
 uid=next;authForm.hidden=!!uid;byId('delivery-logout').hidden=!uid;
 byId('delivery-remember-label').hidden=!uid;byId('delivery-profile-save').hidden=!uid;
 accountStatus.textContent=user?'Sesión iniciada con '+user.email:'Puedes pedir como invitado o crear una cuenta para tus próximas compras.';
 if(!uid)return;
 try{
  const saved=JSON.parse(localStorage.getItem(profileKey(uid))||'null');
  if(saved){fields.forEach(key=>details.elements[key].value=String(saved[key]||''));remember.checked=true}
 }catch{accountStatus.textContent+=' No se pudieron recuperar los datos guardados.'}
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
remember.onchange=()=>{if(uid&&!remember.checked){try{localStorage.removeItem(profileKey(uid))}catch{notice.textContent='No se pudieron borrar los datos guardados.'}}};
details.oninput=invalidate;
window.addEventListener('gp-delivery-changed',invalidate);
authClient().catch(()=>{accountStatus.textContent='La cuenta no está disponible ahora. Puedes continuar como invitado.'});

function wrap(ctx,text,width){
 const lines=[];let current='';
 for(const word of String(text).trim().split(/\s+/)){
  if(current&&ctx.measureText(current+' '+word).width>width){lines.push(current);current=''}
  for(const ch of (current?' ':'')+word){if(ctx.measureText(current+ch).width>width){lines.push(current);current=''}current+=ch}
 }
 if(current)lines.push(current);return lines;
}
async function makeReceipt(data,items){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1400;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo crear la imagen.');
 const stamp=new Date();const code=crypto.randomUUID().slice(0,8).toUpperCase();
 const lines=[];function add(text,bold=false){ctx.font=(bold?'700 ':'')+'25px Arial';wrap(ctx,text,800).forEach(line=>lines.push({line,bold}))}
 add('DATOS DE ENTREGA',true);add(data.recipient+' · '+data.phone);add(data.address);if(data.reference)add('Referencia: '+data.reference);add('Pago: '+data.payment);
 add('PRODUCTOS',true);let total=0;items.forEach(({quantity,name,price})=>{add(quantity+' × '+name,true);add(money(price)+' c/u   ·   '+money(quantity*price));total+=quantity*price});
 add('Total de productos: '+money(total),true);add('Costo de delivery y disponibilidad por confirmar.');
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
byId('delivery-profile-save').onclick=()=>{
 const data=deliveryData();if(!uid||!data)return;
 try{localStorage.setItem(profileKey(uid),JSON.stringify(data));remember.checked=true;notice.textContent='Datos guardados para tu próxima compra en este dispositivo.'}
 catch{notice.textContent='Este navegador no pudo guardar tus datos.'}
};
window.addEventListener('gp-prepare-delivery',async e=>{
 invalidate();const data=deliveryData();if(!data)return;
 let profileNote='';
 if(uid&&remember.checked){try{localStorage.setItem(profileKey(uid),JSON.stringify(data));profileNote=' Datos recordados en este dispositivo.'}catch{profileNote=' Este navegador no pudo recordar tus datos.'}}
 const version=revision;notice.textContent='Preparando imagen…';
 try{const {result,code}=await makeReceipt(data,e.detail);if(revision!==version)return;
  files=result;files.forEach((file,i)=>{const url=URL.createObjectURL(file);urls.push(url);const figure=document.createElement('figure'),img=document.createElement('img'),a=document.createElement('a');img.src=url;img.alt='Pedido de delivery, página '+(i+1);a.href=url;a.download=file.name;a.textContent='Descargar imagen '+(i+1);figure.append(img,a);byId('delivery-pages').append(figure)});
  byId('delivery-chat').href='https://wa.me/51916133647?text='+encodeURIComponent('Hola Grafiplot, adjunto mi pedido de delivery '+code+'.');
  byId('delivery-share').hidden=!navigator.canShare?.({files});receipt.hidden=false;
  notice.textContent='Pedido listo para revisar y enviar.'+profileNote;receipt.scrollIntoView({block:'nearest'});
 }catch{notice.textContent='No se pudo preparar la imagen. Inténtalo de nuevo.'}
});
byId('delivery-share').onclick=async()=>{try{await navigator.share({files,title:'Pedido de delivery Grafiplot'})}catch(e){if(e.name!=='AbortError')notice.textContent='Descarga la imagen y adjúntala en el chat de delivery.'}};

const shopNav=document.querySelector('.gp-shop-nav');
if(shopNav){
 const button=document.createElement('button');button.type='button';button.textContent='Mi cuenta';
 button.onclick=()=>{byId('gp-cart-nav').click();account.open=true;account.scrollIntoView({block:'center'});account.querySelector('summary').focus()};
 shopNav.append(button);
}
