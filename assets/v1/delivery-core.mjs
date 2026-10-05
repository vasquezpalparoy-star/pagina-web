export const STATES = [
  ['recibido','Recibido'],['en_proceso','En proceso'],['listo','Listo para salir'],
  ['en_camino','Salió con el delivery'],['entregado','Entregado']
];
export function usernameEmail(value) {
  const email=String(value||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Escribe un correo electrónico válido.');
  return email;
}
export function securePassword(crypto=globalThis.crypto) {
  const bytes=crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
}
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
    async login(username,password,admin=false){await ready;adminUid=null;const email=usernameEmail(username);await sdk.signInWithEmailAndPassword(auth,email,password);if(admin){try{const record=await sdk.getDoc(sdk.doc(db,'deliveryAdmins',auth.currentUser.uid));if(!record.exists()||record.data().enabled!==true)throw Error('Esta cuenta no está autorizada para administrar delivery.');adminUid=auth.currentUser.uid;}catch(e){await sdk.signOut(auth);throw e;}}return auth.currentUser;},
    async watchSession(fn){await ready;return sdk.onAuthStateChanged(auth,async user=>{adminUid=null;let admin=false;if(isPasswordUser(user)){try{const record=await sdk.getDoc(sdk.doc(db,'deliveryAdmins',user.uid));admin=record.exists()&&record.data().enabled===true;}catch(_){}if(auth.currentUser?.uid!==user.uid)return;if(admin)adminUid=user.uid;}fn(isPasswordUser(user)?user:null,admin);});},
    async sendVerification(){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');auth.languageCode='es';await sdk.sendEmailVerification(auth.currentUser);},
    async refreshVerification(){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');await sdk.reload(auth.currentUser);await sdk.getIdToken(auth.currentUser,true);return auth.currentUser;},
    async resetPassword(email){await ready;auth.languageCode='es';try{await sdk.sendPasswordResetEmail(auth,usernameEmail(email));}catch(e){if(e.code!=='auth/user-not-found')throw e;}},
    async logout(){adminUid=null;await sdk.signOut(auth);},
    async changePassword(password){if(!isPasswordUser(auth.currentUser))throw Error('Inicia sesión primero.');if(password.length<12)throw Error('La nueva contraseña debe tener al menos 12 caracteres.');await sdk.updatePassword(auth.currentUser,password);},
    subscribeOrders(next,fail,admin=false){if(admin)needAdmin();if(!isPasswordUser(auth.currentUser)||!auth.currentUser.emailVerified)throw Error('Verifica tu correo para consultar los pedidos.');const ref=sdk.collection(db,'deliveryOrders');const q=admin?ref:sdk.query(ref,sdk.where('customerUid','==',auth.currentUser.uid));return sdk.onSnapshot(q,snapshot=>next(snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0))),fail);},
    subscribeCustomers(next,fail){needAdmin();return sdk.onSnapshot(sdk.collection(db,'deliveryCustomers'),snapshot=>next(snapshot.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name))),fail);},
    async createCustomer({name,username,phone}){
      needAdmin();name=String(name||'').trim();phone=String(phone||'').trim();const email=usernameEmail(username);if(!name||name.length>120||phone.length>30)throw Error('Revisa el nombre y teléfono del cliente.');
      const password=securePassword();const secondary=sdk.initializeApp(config,'delivery-provision-'+securePassword().slice(0,12));const customerAuth=sdk.getAuth(secondary);let user;
      try{await sdk.setPersistence(customerAuth,sdk.inMemoryPersistence);user=(await sdk.createUserWithEmailAndPassword(customerAuth,email,password)).user;await sdk.setDoc(sdk.doc(db,'deliveryCustomers',user.uid),{name,email,phone,createdAt:sdk.serverTimestamp()});let verificationSent=true;try{customerAuth.languageCode='es';await sdk.sendEmailVerification(user);}catch(_){verificationSent=false;}return {uid:user.uid,email,password,verificationSent};}
      catch(error){if(user){try{await sdk.deleteUser(user);}catch(_){throw Error('No se guardó el cliente y no se pudo retirar su cuenta. Revisa Authentication en Firebase antes de volver a crear ese usuario.');}}throw error;}
      finally{await sdk.signOut(customerAuth).catch(()=>{});await sdk.deleteApp(secondary).catch(()=>{});}
    },
    async createOrder(input){needAdmin();const data=validateOrder(input);const customer=await sdk.getDoc(sdk.doc(db,'deliveryCustomers',data.customerUid));if(!customer.exists())throw Error('El cliente no está registrado.');const ref=sdk.doc(sdk.collection(db,'deliveryOrders'));const now=sdk.serverTimestamp();await sdk.setDoc(ref,{...data,customerName:customer.data().name,createdAt:now,updatedAt:now,leftStoreAt:['en_camino','entregado'].includes(data.status)?now:null,deliveredAt:data.status==='entregado'?now:null});return ref.id;},
    async updateOrder(id,input){needAdmin();const ref=sdk.doc(db,'deliveryOrders',id);await sdk.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw Error('Este pedido ya no existe.');const old=snap.data();const data=validateOrder({...input,customerUid:old.customerUid});const now=sdk.serverTimestamp();tx.update(ref,{...data,updatedAt:now,leftStoreAt:['en_camino','entregado'].includes(data.status)?old.leftStoreAt||now:null,deliveredAt:data.status==='entregado'?old.deliveredAt||now:null});});}
  };
}
