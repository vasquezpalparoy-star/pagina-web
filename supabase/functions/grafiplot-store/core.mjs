export const OWNER_UID='EUMQy18i2YTDZnuxIKda2DvPxU32';
export const statuses=['solicitado','confirmado','entregado','cancelado'];
export function isOwner(claims){return claims.sub===OWNER_UID && claims.email_verified===true;}
export function validateDelivery(input){
  const result={};
  for(const [key,max] of Object.entries({recipient:100,phone:22,address:420,reference:200,payment:30})){
    const value=input?.[key];
    if(typeof value!=='string'||value.trim().length>max||(!value.trim()&&key!=='reference'))throw Error('Revisa los datos de entrega.');
    result[key]=value.trim();
  }
  if(!/^\+?[\d\s()-]+$/.test(result.phone)||!/^\d{7,15}$/.test(result.phone.replace(/\D/g,'')))throw Error('Revisa el número de contacto.');
  if(!['Efectivo','Yape','Plin','Transferencia'].includes(result.payment))throw Error('Selecciona un método de pago.');
  return result;
}
export function validateOrder(input){
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input?.id||''))throw Error('Pedido inválido.');
  const delivery=validateDelivery(input.delivery);
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>100)throw Error('Revisa los productos del pedido.');
  let totalCents=0;
  const items=input.items.map(item=>{
    if(typeof item.name!=='string'||!item.name.trim()||item.name.length>250)throw Error('Revisa el nombre del producto.');
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10000)throw Error('Cantidad inválida.');
    if(typeof item.price!=='number'||!Number.isFinite(item.price)||item.price<0||item.price>1000000)throw Error('Precio inválido.');
    const cents=Math.round(item.price*100);
    totalCents+=cents*item.quantity;
    return {name:item.name.trim(),quantity:item.quantity,price:cents/100};
  });
  if(totalCents>10000000000)throw Error('El pedido supera el importe permitido.');
  return {id:input.id,delivery,items,total:totalCents/100};
}
