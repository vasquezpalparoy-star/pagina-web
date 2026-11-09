export const BUCKET='grafiplot-web-images';
export const MAX_BYTES=5*1024*1024;
export function imageExtension(type,bytes){
 const match=type==='image/png'&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)?'png':
  type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':
  type==='image/webp'&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'webp':null;
 if(!match||!bytes.length||bytes.length>MAX_BYTES)throw Error('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.');
 return match;
}
