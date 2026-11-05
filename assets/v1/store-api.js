const ENDPOINT='https://gyvztqpvgtinxoqhyfbw.supabase.co/functions/v1/grafiplot-store';
export async function storeRequest(user,action,data={}){
  if(!user)throw Error('Ingresa con tu cuenta para consultar o guardar en tu historial.');
  const token=await user.getIdToken();
  const response=await fetch(ENDPOINT,{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({...data,action}),signal:AbortSignal.timeout(20000)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok){const error=Error(result.error||'No se pudo conectar con el historial.');error.status=response.status;throw error}
  return result;
}
