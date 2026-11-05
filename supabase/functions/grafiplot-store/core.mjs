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
  if(input.delivery.deliveryOption!==undefined){
    if(!['fixed','consult'].includes(input.delivery.deliveryOption))throw Error('Selecciona la opción de delivery.');
    delivery.deliveryOption=input.delivery.deliveryOption;
    delivery.deliveryFee=delivery.deliveryOption==='fixed'?3:null;
  }
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

export function validateOffer(input){
  if(typeof input?.title!=='string')throw Error('Escribe el nombre del beneficio.');
  const title=input.title.trim();
  if(!title||title.length>120)throw Error('Escribe un título de hasta 120 caracteres.');
  if(!['percent','fixed'].includes(input?.kind))throw Error('Selecciona porcentaje o soles.');
  const amount=Math.round(input.amount*100)/100;
  if(typeof input.amount!=='number'||!Number.isFinite(amount)||amount<=0||amount>1000000||(input.kind==='percent'&&amount>100)){
    throw Error('Revisa el descuento. El porcentaje debe estar entre 0 y 100.');
  }
  if(typeof input.active!=='boolean')throw Error('Indica si el descuento está activo.');
  let expires_at=null;
  if(input.expiresOn){
    if(typeof input.expiresOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn))throw Error('Revisa la fecha de vencimiento.');
    const calendar=new Date(input.expiresOn+'T00:00:00Z');
    if(!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,10)!==input.expiresOn)throw Error('Revisa la fecha de vencimiento.');
    expires_at=new Date(input.expiresOn+'T23:59:59.999-05:00').toISOString();
  }
  return {title,kind:input.kind,amount:Math.round(amount*100)/100,active:input.active,expires_at};
}
export function currentOffer(offer,now=Date.now()){
  return offer?.active&&(!offer.expires_at||Date.parse(offer.expires_at)>now)?offer:null;
}
