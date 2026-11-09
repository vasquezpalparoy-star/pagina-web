const ENDPOINT='https://gyvztqpvgtinxoqhyfbw.supabase.co/functions/v1/grafiplot-images';
export async function prepareImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>20*1024*1024)throw Error('Elige una imagen JPG, PNG o WebP de hasta 20 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>60000000)throw Error('La imagen es demasiado grande. Reduce sus dimensiones.');
  const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.88));
  if(!blob||blob.size>5*1024*1024)throw Error('No se pudo reducir la imagen a 5 MB. Selecciona otra foto.');
  return blob;
 }finally{bitmap.close()}
}
export async function uploadImage(user,file){
 const image=await prepareImage(file);
 const token=await user.getIdToken(true);
 const response=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':image.type},body:image,signal:AbortSignal.timeout(60000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||'No se pudo subir la imagen. Inténtalo nuevamente.');
 if(typeof result.url!=='string'||!result.url.startsWith('https://gyvztqpvgtinxoqhyfbw.supabase.co/storage/v1/object/public/grafiplot-web-images/'))throw Error('No se confirmó la imagen guardada.');
 return result.url;
}
export function initImageUploads(root,send=uploadImage){
 const document=root.ownerDocument,window=document.defaultView,form=root.querySelector('#gp-settings-editor');
 if(!form)return;
 let user=null,generation=0,pending=0;const widgets=new Map();
 window.addEventListener('gp-owner-session',event=>{user=event.detail;generation++;refresh()});
 const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 function refresh(){
  for(const [input,widget] of widgets){
   if(!input.isConnected){widgets.delete(input);continue}
   const values=input.value.split(/\r?\n/).filter(Boolean);
   if(widget.value!==input.value){
    widget.value=input.value;widget.preview.replaceChildren();
    for(const url of values){if(!/^https:\/\//.test(url))continue;const img=make('img');img.src=url;img.alt='Imagen seleccionada';img.loading='lazy';
     if(widget.multiple){const figure=make('span');const remove=make('button','Quitar foto');remove.type='button';remove.onclick=e=>{e.preventDefault();if(widget.busy)return;input.value=input.value.split(/\r?\n/).filter(value=>value!==url).join('\n');input.dispatchEvent(new window.Event('input',{bubbles:true}));refresh()};figure.append(img,remove);widget.preview.append(figure)}else widget.preview.append(img);
    }
   }
   const disabled=!user||widget.busy;if(widget.button.disabled!==disabled)widget.button.disabled=disabled;
  }
 }
 function attach(input,multiple=false){
  if(widgets.has(input))return;
  const label=input.closest('label');if(!label)return;
  const box=make('span');box.className='gp-image-uploader';
  const preview=make('span');preview.className='gp-upload-preview';
  const button=make('button',multiple?'Añadir fotos':'Subir imagen');button.type='button';button.className='gp-button secondary';
  const picker=make('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp';picker.multiple=multiple;picker.hidden=true;
  const status=make('span',multiple?'Selecciona una o varias fotos.':'Elige una foto de tu PC o celular.');status.setAttribute('role','status');
  const widget={preview,button,value:null,busy:false,multiple};widgets.set(input,widget);
  input.hidden=true;if(input.tagName==='INPUT')input.type='hidden';
  const text=label.firstChild;
  if(text?.nodeType===3)text.textContent=text.textContent.replace(/\s*[·(]?\s*(enlace.*|un enlace.*|\(https.*)/i,'').trim()||'Imagen';
  box.append(preview,button,picker,status);label.append(box);
  button.onclick=e=>{e.preventDefault();picker.click()};
  picker.onchange=async()=>{
   const files=Array.from(picker.files||[]);if(!files.length)return;
   if(!user){status.textContent='Ingresa con tu cuenta de propietario.';return}
   if(files.length>20){status.textContent='Selecciona hasta 20 fotos a la vez.';picker.value='';return}
   const activeUser=user,version=generation;widget.busy=true;pending++;refresh();
   let completed=0;
   try{
    for(const file of files){
     status.textContent='Subiendo imagen '+(completed+1)+' de '+files.length+'…';
     const url=await send(activeUser,file);
     if(version!==generation||!input.isConnected)throw Error('La edición cambió. Vuelve a abrir la sección.');
     input.value=multiple?[input.value.trim(),url].filter(Boolean).join('\n'):url;
     input.dispatchEvent(new window.Event('input',{bubbles:true}));
     input.dispatchEvent(new window.Event('change',{bubbles:true}));completed++;refresh();
    }
    status.textContent='Imagen'+(completed>1?'es guardadas':' guardada')+' en Supabase. Pulsa Guardar cambios para publicarla'+(completed>1?'s':'')+'.';
   }catch(error){status.textContent=(completed?'Se subieron '+completed+' fotos. ':'')+(error.name==='AbortError'?'La subida tardó demasiado. Inténtalo de nuevo.':error.message)}
   finally{widget.busy=false;pending--;picker.value='';refresh()}
  };
 }
 function scan(){
  form.querySelectorAll('input[type="url"]').forEach(input=>{
   if(['gp-settings-map','gp-settings-sublimacion','gp-settings-textil'].includes(input.id))return;
   attach(input);
  });
  form.querySelectorAll('[data-upload-photos]').forEach(input=>attach(input,true));refresh();
 }
 form.addEventListener('submit',event=>{if(pending){event.preventDefault();event.stopImmediatePropagation();const status=root.querySelector('#gp-settings-feedback');status.textContent='Espera a que termine la subida de las imágenes antes de guardar.'}},true);
 const observer=new window.MutationObserver(records=>{if(records.some(record=>record.type==='childList'))scan()});observer.observe(form,{childList:true,subtree:true});scan();
 return {refresh};
}
if(typeof document!=='undefined'){
 const root=document.getElementById('grafiplot-preview');if(root)initImageUploads(root);
}
