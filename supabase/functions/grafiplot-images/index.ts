import {createRemoteJWKSet,jwtVerify} from 'npm:jose@6.1.0';
import {BUCKET,MAX_BYTES,imageExtension} from './images.mjs';
const project='pagina-web-grafiplot-oficial';
const owner='EUMQy18i2YTDZnuxIKda2DvPxU32';
const apiKey='AIzaSyClluUAu9eVV2cdh0GGA2-VdyHDaZilZHo';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const origins=new Set(['https://www.grafiplotvasquez.com','https://grafiplotvasquez.com','https://vasquezpalparoy-star.github.io']);
const base=Deno.env.get('SUPABASE_URL')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const serviceHeaders={Authorization:'Bearer '+secret,apikey:secret};
let bucketReady=false;
async function ensureBucket(){
 if(bucketReady)return;
 const headers={...serviceHeaders,'Content-Type':'application/json'};
 let response=await fetch(base+'/storage/v1/bucket/'+BUCKET,{headers,signal:AbortSignal.timeout(12000)});
 if(!response.ok){
  response=await fetch(base+'/storage/v1/bucket',{method:'POST',headers,body:JSON.stringify({id:BUCKET,name:BUCKET,public:true,file_size_limit:MAX_BYTES,allowed_mime_types:['image/jpeg','image/png','image/webp']}),signal:AbortSignal.timeout(12000)});
  if(!response.ok){
   const existing=await fetch(base+'/storage/v1/bucket/'+BUCKET,{headers,signal:AbortSignal.timeout(12000)});
   if(!existing.ok)throw Error('No se pudo preparar el almacenamiento de imágenes.');
  }
 }
 bucketReady=true;
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://www.grafiplotvasquez.com','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin'};
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'Origen no permitido.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return reply({error:'Ingresa con la cuenta del propietario.'},401);
 try{
  const {payload}=await jwtVerify(token,keys,{issuer:'https://securetoken.google.com/'+project,audience:project,algorithms:['RS256'],requiredClaims:['exp','iat','sub']});
  if(payload.sub!==owner||payload.email_verified!==true||(payload.firebase as {sign_in_provider?:string})?.sign_in_provider==='anonymous')return reply({error:'Solo el propietario verificado puede subir imágenes.'},403);
  const check=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(8000)});
  const account=await check.json();
  if(!check.ok||account.users?.[0]?.localId!==owner||account.users[0].disabled)return reply({error:'Tu sesión venció. Vuelve a ingresar.'},401);
 }catch{return reply({error:'Tu sesión venció. Vuelve a ingresar.'},401)}
 try{
  const reader=req.body?.getReader();if(!reader)return reply({error:'Selecciona una imagen.'},400);
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BYTES){await reader.cancel();return reply({error:'La imagen supera los 5 MB.'},413)}chunks.push(value)}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  const type=req.headers.get('content-type')?.split(';')[0]||'';
  let ext;try{ext=imageExtension(type,bytes)}catch(error){return reply({error:(error as Error).message},400)}
  await ensureBucket();
  const path='website/'+crypto.randomUUID()+'.'+ext;
  const response=await fetch(base+'/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{...serviceHeaders,'Content-Type':type,'Cache-Control':'max-age=31536000','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('No se pudo guardar la imagen en Supabase. Inténtalo nuevamente.');
  return reply({url:base+'/storage/v1/object/public/'+BUCKET+'/'+path});
 }catch(error){return reply({error:(error as Error).message||'No se pudo subir la imagen.'},503)}
});
