export const STATES = [
  ['recibido','Recibido'],['en_proceso','En proceso'],['listo','Listo para salir'],
  ['en_camino','Salió con el delivery'],['entregado','Entregado']
];
export function usernameEmail(value) {
  const email=String(value||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Escribe un correo electrónico válido.');
  return email;
}
export function customerUsername(value) {
  const username=String(value||'').trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username))throw Error('Usa un nombre de usuario de 3 a 40 caracteres, sin espacios ni tildes.');
  return username;
}
export function customerEmail(value) {return customerUsername(value)+'@delivery.grafiplotvasquez.com';}
export function securePassword(crypto=globalThis.crypto) {
  const bytes=crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
}
export function trackingToken(crypto=globalThis.crypto){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
// Leave a day below the server's 30-day maximum to tolerate device clock drift.
const trackingExpiry=()=>new Date(Date.now()+29*86400000);
export function publicTracking(order,orderId,expiresAt){const {details,amount,deliveryFee,status,estimatedAt,updatedAt,leftStoreAt,deliveredAt}=order;return {orderId,details,amount,deliveryFee,status,estimatedAt,updatedAt,leftStoreAt,deliveredAt,expiresAt};}
export function validateOrder(input) {
  const customerUid=String(input.customerUid||'').trim();
  const details=String(input.details||'').trim();
  const address=String(input.address||'').trim();
  const amount=Number(input.amount),deliveryFee=Number(input.deliveryFee);
  const status=input.status||'recibido';
  if(!customerUid||!details||details.length>3000||!address||address.length>500)throw Error('Selecciona un cliente y completa los detalles y la dirección.');
  if(input.amount===''||input.deliveryFee===''||!Number.isFinite(amount)||!Number.isFinite(deliveryFee)||amount<0||deliveryFee<0||amount>100000||deliveryFee>10000)throw Error('Revisa los montos del pedido y del delivery.');
  if(!STATES.some(s=>s[0]===status))throw Error('Estado de pedido inválido.');
  const eta=input.estimatedAt?new Date(input.estimatedAt):null;
  if(eta&&!Number.isFinite(eta.getTime()))throw Error('La fecha de entrega no es válida.');
  return {customerUid,details,address,amount:Math.round(amount*100)/100,deliveryFee:Math.round(deliveryFee*100)/100,status,estimatedAt:eta};
}
export function createDeliveryService(sdk,config) {
  const app=sdk.initializeApp(config,'grafiplot-delivery');
  const auth=sdk.getAuth(app),db=sdk.getFirestore(app);
  const ready=sdk.setPersistence(auth,sdk.browserSessionPersistence);
  let adminUid=null;
  const isPasswordUser=u=>u&&!u.isAnonymous;
  const needAdmin=()=>{if(!isPasswordUser(auth.currentUser)||!auth.currentUser.emailVerified||auth.currentUser.uid!==adminUid)throw Error('Inicia sesión con una cuenta autorizada de la tienda.');};
  return {
    async login(username,password,admin=false){await ready;adminUid=null;const email=admin?usernameEmail(username):customerEmail(username);await sdk.signInWithEmailAndPassword(auth,email,password);if(admin){try{const record=await sdk.getDoc(sdk.doc(db,'deliveryAdmins',auth.currentUser.uid));if(!record.exists()||record.data().enabled!==true)throw Error('Esta cuenta no está autorizada para administrar delivery.');adminUid=auth.currentUser.uid;}catch(e){await sdk.signOut(auth);throw e;}}return auth.currentUser;},
    async watchSession(fn){await ready;return sdk.onAuthStateChanged(auth,async user=>{adminUid=null;let admin=false;if(isPasswordUser(user)){try{const record=await sdk.getDoc(sdk.doc(db,'deliveryAdmins',user.uid));admin=record.exists()&&record.data().enabled===true;}catch(_){}if(auth.currentUser?.uid!==user.uid)return;if(admin)adminUid=user.uid;}fn(isPasswordUser(user)?user:null,admin);});},
    async sendVerification(){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');auth.languageCode='es';await sdk.sendEmailVerification(auth.currentUser);},
    async refreshVerification(){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');await sdk.reload(auth.currentUser);await sdk.getIdToken(auth.currentUser,true);return auth.currentUser;},
    async resetPassword(email){await ready;auth.languageCode='es';try{await sdk.sendPasswordResetEmail(auth,usernameEmail(email));}catch(e){if(e.code!=='auth/user-not-found')throw e;}},
    async logout(){adminUid=null;await sdk.signOut(auth);},
    async changePassword(password){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');if(password.length<12)throw Error('La nueva contraseña debe tener al menos 12 caracteres.');await sdk.updatePassword(auth.currentUser,password);},
    subscribeOrders(next,fail,admin=false){if(admin)needAdmin();if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión para consultar los pedidos.');const ref=sdk.collection(db,'deliveryOrders');const q=admin?ref:sdk.query(ref,sdk.where('customerUid','==',auth.currentUser.uid));return sdk.onSnapshot(q,snapshot=>next(snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0))),fail);},
    subscribeCustomers(next,fail){needAdmin();return sdk.onSnapshot(sdk.collection(db,'deliveryCustomers'),snapshot=>next(snapshot.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name))),fail);},
    async getCustomer(uid){needAdmin();const snap=await sdk.getDoc(sdk.doc(db,'deliveryCustomers',uid));return snap.exists()?{uid,...snap.data()}:null;},
    async createCustomer({name,username,phone,password}){
      needAdmin();name=String(name||'').trim();phone=String(phone||'').trim();username=customerUsername(username);const email=customerEmail(username);password=String(password||'');if(password.length<6||password.length>128)throw Error('La contraseña debe tener entre 6 y 128 caracteres.');if(!name||name.length>120||phone.length>30)throw Error('Revisa el nombre y teléfono del cliente.');
      const secondary=sdk.initializeApp(config,'delivery-provision-'+securePassword().slice(0,12));const customerAuth=sdk.getAuth(secondary);let user;
      try{await sdk.setPersistence(customerAuth,sdk.inMemoryPersistence);user=(await sdk.createUserWithEmailAndPassword(customerAuth,email,password)).user;await sdk.setDoc(sdk.doc(db,'deliveryCustomers',user.uid),{name,email,username,phone,createdAt:sdk.serverTimestamp()});return {uid:user.uid,username,password};}
      catch(error){if(user){try{await sdk.deleteUser(user);}catch(_){throw Error('No se guardó el cliente y no se pudo retirar su cuenta. Revisa Authentication en Firebase antes de volver a crear ese usuario.');}}throw error;}
      finally{await sdk.signOut(customerAuth).catch(()=>{});await sdk.deleteApp(secondary).catch(()=>{});}
    },
    async createOrder(input){needAdmin();const data=validateOrder(input);const customer=await sdk.getDoc(sdk.doc(db,'deliveryCustomers',data.customerUid));if(!customer.exists())throw Error('El cliente no está registrado.');const ref=sdk.doc(sdk.collection(db,'deliveryOrders'));const now=sdk.serverTimestamp();const token=trackingToken();const order={...data,trackingToken:token,customerName:customer.data().name,createdAt:now,updatedAt:now,leftStoreAt:['en_camino','entregado'].includes(data.status)?now:null,deliveredAt:data.status==='entregado'?now:null};await sdk.runTransaction(db,async tx=>{tx.set(ref,order);tx.set(sdk.doc(db,'deliveryOrderLinks',token),publicTracking(order,ref.id,data.status==='entregado'?new Date(0):trackingExpiry()));});return ref.id;},
    async ensureTrackingLink(id){needAdmin();const snap=await sdk.getDoc(sdk.doc(db,'deliveryOrders',id));if(!snap.exists())throw Error('Este pedido no existe.');const order=snap.data();if(order.status==='entregado')throw Error('El pedido ya concluyó.');if(order.trackingToken){const link=await sdk.getDoc(sdk.doc(db,'deliveryOrderLinks',order.trackingToken));const expiry=link.exists()?link.data().expiresAt:null;const time=new Date(expiry?.toDate?.()||expiry).getTime();if(link.exists()&&time>Date.now()&&link.data().status!=='entregado')return order.trackingToken;}return this.createTrackingLink(id);},
    async createTrackingLink(id){needAdmin();const token=trackingToken(),ref=sdk.doc(db,'deliveryOrders',id);await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw Error('Este pedido no existe.');const order=snap.data();if(order.status==='entregado')throw Error('El pedido ya concluyó. No se puede generar un enlace activo.');const oldLinkRef=order.trackingToken?sdk.doc(db,'deliveryOrderLinks',order.trackingToken):null;const oldLink=oldLinkRef?await tx.get(oldLinkRef):null;if(oldLink?.exists())tx.update(oldLinkRef,{expiresAt:new Date(0)});tx.update(ref,{trackingToken:token,updatedAt:sdk.serverTimestamp()});tx.set(sdk.doc(db,'deliveryOrderLinks',token),publicTracking({...order,updatedAt:sdk.serverTimestamp()},id,trackingExpiry()));});return token;},
    subscribeTracking(token,next,fail){if(!/^[a-f0-9]{64}$/.test(token))throw Error('El enlace no es válido.');let timer;const reject=e=>{clearTimeout(timer);fail(e);};const unsubscribe=sdk.onSnapshot(sdk.doc(db,'deliveryOrderLinks',token),snapshot=>{clearTimeout(timer);if(!snapshot.exists())return reject(Error('Este enlace ya no está disponible.'));const data=snapshot.data(),expires=data.expiresAt?.toDate?.()||data.expiresAt;const expiry=new Date(expires).getTime();if(!Number.isFinite(expiry)||expiry<=Date.now()||data.status==='entregado')return reject(Error('El enlace venció o el pedido concluyó.'));next([{id:data.orderId,...data}]);const expire=()=>{const left=expiry-Date.now();if(left<=0)reject(Error('El enlace venció.'));else timer=setTimeout(expire,Math.min(left,2147483647));};expire();},reject);return ()=>{clearTimeout(timer);unsubscribe();};},
    async updateOrder(id,input){needAdmin();const ref=sdk.doc(db,'deliveryOrders',id);await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw Error('Este pedido ya no existe.');const old=snap.data();const linkRef=old.trackingToken?sdk.doc(db,'deliveryOrderLinks',old.trackingToken):null;const link=linkRef?await tx.get(linkRef):null;const data=validateOrder({...input,customerUid:old.customerUid});const now=sdk.serverTimestamp();const patch={...data,updatedAt:now,leftStoreAt:['en_camino','entregado'].includes(data.status)?old.leftStoreAt||now:null,deliveredAt:data.status==='entregado'?old.deliveredAt||now:null};tx.update(ref,patch);if(link?.exists())tx.set(linkRef,publicTracking({...old,...patch},id,data.status==='entregado'?new Date(0):link.data().expiresAt));});}
  };
}
