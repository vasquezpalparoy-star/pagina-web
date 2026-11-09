export function validateRanges(rows){
 if(!Array.isArray(rows)||rows.length>40)throw Error('Usa hasta 40 rangos por tarifa.');
 const result=rows.map(row=>{
  const min=Number(row.min),max=row.max===''||row.max===null?null:Number(row.max);
  const price=row.price===''||row.price===null?null:Number(row.price);
  if(!Number.isSafeInteger(min)||min<1||max!==null&&(!Number.isSafeInteger(max)||max<min)||price!==null&&(!Number.isFinite(price)||price<0||price>1000000))throw Error('Revisa los rangos: desde 1, hasta mayor o igual a desde y precio positivo o cero.');
  return {min,max,price};
 }).sort((a,b)=>a.min-b.min);
 for(let i=1;i<result.length;i++)if(result[i-1].max===null||result[i].min<=result[i-1].max)throw Error('Los rangos se superponen. Ejemplo válido: 1–9, 10–29 y 30 en adelante.');
 return result;
}
export function rangePrice(rows,quantity){
 if(!Number.isSafeInteger(quantity)||quantity<1)return null;
 const match=validateRanges(rows).find(row=>quantity>=row.min&&(row.max===null||quantity<=row.max));
 return match?.price??null;
}
export const defaultQuoteServices=()=>[
 {id:'scan-a4',name:'Escaneo A4',unit:'hoja',formats:[{id:'a4',label:'A4',ranges:blankRanges()}]},
 {id:'scan-plans',name:'Escaneo de planos',unit:'plano',formats:['A3','A2','A1','A0'].map(label=>({id:label.toLowerCase(),label,ranges:blankRanges()}))}
];
function blankRanges(){return [{min:1,max:9,price:null},{min:10,max:29,price:null},{min:30,max:null,price:null}]}
export function validateQuoteServices(services){
 if(!Array.isArray(services)||services.length>40)throw Error('Añade hasta 40 servicios al cotizador.');
 const ids=new Set();
 return services.map(service=>{
  if(!/^[\w-]{1,80}$/.test(service.id)||ids.has(service.id))throw Error('El identificador del servicio es inválido o está repetido.');ids.add(service.id);
  const name=String(service.name||'').trim(),unit=String(service.unit||'unidad').trim();
  if(!name||name.length>100||!unit||unit.length>30||!Array.isArray(service.formats)||!service.formats.length||service.formats.length>20)throw Error('Cada servicio necesita nombre, unidad y al menos un formato.');
  const formats=new Set();return {id:service.id,name,unit,formats:service.formats.map(format=>{
   if(!/^[\w-]{1,80}$/.test(format.id)||formats.has(format.id)||!String(format.label||'').trim())throw Error('Revisa los formatos del servicio '+name+'.');formats.add(format.id);
   return {id:format.id,label:String(format.label).trim().slice(0,100),ranges:validateRanges(format.ranges)};
  })};
 });
}
export function calculateServiceQuote(service,formatId,quantity){
 const format=service.formats.find(f=>f.id===formatId);const count=Number(quantity);
 if(!Number.isSafeInteger(count)||count<1||count>1000000)throw Error('Escribe una cantidad entera entre 1 y 1 000 000.');
 if(!format)throw Error('Selecciona el formato.');
 const price=rangePrice(format.ranges,count);
 const range=format.ranges.find(r=>count>=r.min&&(r.max===null||count<=r.max));
 return {service:service.name,format:format.label,quantity:count,unit:service.unit,price,range,total:price===null?null:Math.round(price*100)*count/100};
}
