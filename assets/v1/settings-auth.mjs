export const OWNER_UID='EUMQy18i2YTDZnuxIKda2DvPxU32';

export function isSettingsOwner(user){
  return !!user && !user.isAnonymous && user.uid===OWNER_UID && user.emailVerified===true;
}
export function ownerEmail(value){
  const email=String(value||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Escribe un correo electrónico válido.');
  return email;
}
function accessError(){
  const error=Error('Esta cuenta no tiene permiso para editar. Ingresa con la cuenta verificada del propietario.');
  error.code='auth/unauthorized-owner';
  return error;
}
export function createSettingsAuth(sdk,auth){
  let generation=0;
  let loginBusy=false;
  async function refresh(){
    const user=auth.currentUser;
    if(!user||user.isAnonymous||user.uid!==OWNER_UID)throw accessError();
    await sdk.reload(user);
    await sdk.getIdToken(user,true);
    if(auth.currentUser?.uid!==user.uid)throw accessError();
    return user;
  }
  return {
    async watch(fn){
      await sdk.setPersistence(auth,sdk.browserSessionPersistence);
      if(auth.currentUser?.isAnonymous)await sdk.signOut(auth);
      return sdk.onAuthStateChanged(auth,user=>{
        fn(isSettingsOwner(user),user&&!user.isAnonymous&&user.uid===OWNER_UID?user:null);
      });
    },
    async login(email,password){
      if(loginBusy)throw Error('El acceso está en proceso. Espera un momento.');
      const normalized=ownerEmail(email);
      const attempt=++generation;
      loginBusy=true;
      try{
        const result=await sdk.signInWithEmailAndPassword(auth,normalized,password);
        if(attempt!==generation){
          await sdk.signOut(auth);
          throw Error('El acceso fue cancelado. Puedes volver a ingresar.');
        }
        if(result.user.isAnonymous||result.user.uid!==OWNER_UID){
          await sdk.signOut(auth);
          throw accessError();
        }
        return result.user;
      }finally{loginBusy=false}
    },
    async sendVerification(){
      const user=auth.currentUser;
      if(!user||user.isAnonymous||user.uid!==OWNER_UID)throw accessError();
      auth.languageCode='es';
      await sdk.sendEmailVerification(user);
    },
    refresh,
    async assertOwner(){
      const user=await refresh();
      if(!isSettingsOwner(user))throw accessError();
      return user;
    },
    async reset(email){
      auth.languageCode='es';
      try{await sdk.sendPasswordResetEmail(auth,ownerEmail(email))}
      catch(error){if(error.code!=='auth/user-not-found')throw error}
    },
    async logout(){
      generation++;
      await sdk.signOut(auth);
    }
  };
}
export function settingsAuthError(error){
  return ({
    'auth/invalid-credential':'Correo o contraseña incorrectos.',
    'auth/wrong-password':'Correo o contraseña incorrectos.',
    'auth/user-not-found':'Correo o contraseña incorrectos.',
    'auth/invalid-email':'Escribe un correo válido.',
    'auth/user-disabled':'Esta cuenta está deshabilitada.',
    'auth/user-token-expired':'Tu sesión venció. Vuelve a ingresar.',
    'auth/invalid-user-token':'Tu sesión venció. Vuelve a ingresar.',
    'auth/unauthorized-owner':'Ingresa con la cuenta verificada del propietario.',
    'auth/operation-not-allowed':'El acceso con correo no está activado en Firebase.',
    'auth/too-many-requests':'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed':'No se pudo conectar. Revisa tu conexión.'
  })[error.code]||error.message||'No se pudo verificar la cuenta.';
}
