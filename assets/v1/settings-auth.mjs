export const OWNER_UID='EUMQy18i2YTDZnuxIKda2DvPxU32';
export function isSettingsOwner(user){return !!user&&!user.isAnonymous&&user.uid===OWNER_UID&&user.emailVerified===true;}
export function ownerEmail(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Escribe un correo electrónico válido.');return email;}
export function createSettingsAuth(sdk,auth){return {
 async watch(fn){await sdk.setPersistence(auth,sdk.browserSessionPersistence);if(auth.currentUser?.isAnonymous)await sdk.signOut(auth);return sdk.onAuthStateChanged(auth,user=>fn(isSettingsOwner(user),user&&!user.isAnonymous&&user.uid===OWNER_UID?user:null));},
 async login(email,password){const result=await sdk.signInWithEmailAndPassword(auth,ownerEmail(email),password);if(result.user.uid!==OWNER_UID){await sdk.signOut(auth);throw Error('Esta cuenta no tiene permiso para editar la página.');}return result.user;},
 async sendVerification(){if(auth.currentUser?.uid!==OWNER_UID)throw Error('Ingresa con la cuenta del propietario.');auth.languageCode='es';await sdk.sendEmailVerification(auth.currentUser);},
 async refresh(){if(auth.currentUser?.uid!==OWNER_UID)throw Error('Ingresa con la cuenta del propietario.');await sdk.reload(auth.currentUser);await sdk.getIdToken(auth.currentUser,true);return auth.currentUser;},
 async reset(email){auth.languageCode='es';try{await sdk.sendPasswordResetEmail(auth,ownerEmail(email));}catch(e){if(e.code!=='auth/user-not-found')throw e;}},
 async logout(){await sdk.signOut(auth);}
};}
export function settingsAuthError(e){return ({'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/wrong-password':'Correo o contraseña incorrectos.','auth/user-not-found':'Correo o contraseña incorrectos.','auth/invalid-email':'Escribe un correo válido.','auth/operation-not-allowed':'El acceso con correo no está activado en Firebase.','auth/too-many-requests':'Demasiados intentos. Espera unos minutos.','auth/network-request-failed':'No se pudo conectar. Revisa tu conexión.'})[e.code]||e.message||'No se pudo verificar la cuenta.';}
