import {createRemoteJWKSet,jwtVerify} from 'npm:jose@6.1.0';
import {handleAction,RequestError} from './actions.mjs';
import {trackPhone} from './phone.mjs';

const firebaseProject='pagina-web-grafiplot-oficial';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const allowedOrigins=new Set(['https://www.grafiplotvasquez.com','https://grafiplotvasquez.com','https://vasquezpalparoy-star.github.io']);
const dbUrl=Deno.env.get('SUPABASE_URL')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firebaseApiKey='AIzaSyClluUAu9eVV2cdh0GGA2-VdyHDaZilZHo';

async function database(path:string,method='GET',data?:unknown){
  const response=await fetch(dbUrl+'/rest/v1/'+path,{
    method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},
    body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(12000)
  });
  if(!response.ok){
    const error=await response.json().catch(()=>({}));
    if(error.message?.includes('ORDER_CONFLICT'))throw new RequestError('El código ya pertenece a otro pedido.',409);
    if(error.message?.includes('ORDER_NOT_FOUND'))throw new RequestError('No se encontró el pedido.',404);
    if(error.message?.includes('DELIVERY_ALREADY_CREATED'))throw new RequestError('Este pedido ya tiene un delivery. Puedes confirmarlo, entregarlo o cancelarlo.',409);
    if(error.message?.includes('INVALID_DELIVERY'))throw new RequestError('Revisa los datos del delivery.');
    if(error.message?.includes('ORDER_LIMIT'))throw new RequestError('Alcanzaste el límite de pedidos de hoy.',429);
    throw new RequestError('No se pudo guardar o consultar. Inténtalo de nuevo.',503);
  }
  return response.json();
}
async function identify(req:Request){
  const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)throw new RequestError('Ingresa con tu cuenta.',401);
  try{
    const {payload}=await jwtVerify(token,keys,{issuer:'https://securetoken.google.com/'+firebaseProject,audience:firebaseProject,algorithms:['RS256'],requiredClaims:['exp','iat','sub','auth_time']});
    const provider=(payload.firebase as {sign_in_provider?:string})?.sign_in_provider;
    if(!payload.sub||payload.sub.length>128||provider==='anonymous'||!payload.email)throw Error();
    const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+firebaseApiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(8000)});
    const account=await response.json();
    if(!response.ok||account.users?.[0]?.localId!==payload.sub||account.users[0].disabled)throw Error();
    return payload;
  }catch{throw new RequestError('Tu sesión caducó. Vuelve a ingresar.',401)}
}
Deno.serve(async req=>{
  const origin=req.headers.get('origin')||'';
  const headers={'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://www.grafiplotvasquez.com','Access-Control-Allow-Headers':'authorization,content-type,apikey','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin'};
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(origin&&!allowedOrigins.has(origin))return reply({error:'Origen no permitido.'},403);
  if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
  try{
    const text=await req.text();if(text.length>100000)throw new RequestError('Pedido demasiado extenso.',413);
    let input;try{input=JSON.parse(text)}catch{throw new RequestError('Solicitud inválida.')}
    if(input?.action==='track_phone'){
      const address=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
      return reply(await trackPhone(input.phone,address,secret,database));
    }
    const claims=await identify(req);
    return reply(await handleAction(input,claims,database));
  }catch(error){return reply({error:error instanceof RequestError?error.message:'No se pudo completar la operación.'},error instanceof RequestError?error.status:500)}
});
