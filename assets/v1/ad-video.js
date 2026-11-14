/* Validación estricta de enlaces de videos publicitarios de Google Drive y YouTube. */
(function(){
'use strict';
function parse(value){
 let url;try{url=new URL(String(value||'').trim());}catch{return null}
 if(url.protocol!=='https:')return null;
 const host=url.hostname.toLowerCase().replace(/^www\./,'');
 const parts=url.pathname.split('/').filter(Boolean);
 let id='',provider='';
 if(host==='drive.google.com'){
  if(parts[0]==='file'&&parts[1]==='d')id=parts[2]||'';
  else if(parts[0]==='open'||parts[0]==='uc')id=url.searchParams.get('id')||'';
  if(!/^[a-zA-Z0-9_-]{10,200}$/.test(id))return null;
  provider='drive';
  return {provider,embed:'https://drive.google.com/file/d/'+id+'/preview',url:url.href};
 }
 if(host==='youtube.com'||host==='m.youtube.com'||host==='youtube-nocookie.com'){
  if(parts[0]==='watch')id=url.searchParams.get('v')||'';
  else if(['embed','shorts','live'].includes(parts[0]))id=parts[1]||'';
 }else if(host==='youtu.be'){id=parts[0]||''}
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
 provider='youtube';
 return {provider,embed:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1&rel=0&controls=1',url:url.href};
}
function frame(source,label){
 const info=parse(source);if(!info)return null;
 const el=document.createElement('iframe');
 el.src=info.embed;
 el.title=label||'Video de promoción GRAFIPLOT';
 el.loading='eager';el.referrerPolicy='strict-origin-when-cross-origin';
 el.dataset.provider=info.provider;
 el.allow='autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
 el.allowFullscreen=true;el.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');
 return el;
}
// Los iframe de terceros no admiten object-fit: cover.
// Ajustar relación 16:9 de YouTube para cubrir el recuadro sin bandas negras.
function cover(frame,box){
 if(!frame||!box||frame.dataset.provider!=='youtube')return ()=>{};
 const update=()=>{
  const w=box.clientWidth,h=box.clientHeight;
  if(!w||!h)return;
  const width=Math.max(w,h*16/9),height=Math.max(h,w*9/16);
  Object.assign(frame.style,{position:'absolute',left:'50%',top:'50%',width:width+'px',height:height+'px',transform:'translate(-50%,-50%)',maxWidth:'none',maxHeight:'none'});
 };
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;
 if(observer)observer.observe(box);
 update();
 return ()=>observer?.disconnect();
}
window.GrafiplotAdVideo={parse,frame,cover};
})();