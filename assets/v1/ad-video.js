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
 return {provider,embed:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0&playsinline=1',url:url.href};
}
function frame(source,label){
 const info=parse(source);if(!info)return null;
 const el=document.createElement('iframe');
 el.src=info.embed;
 el.title=label||'Video de promoción GRAFIPLOT';
 el.loading='lazy';el.referrerPolicy='strict-origin-when-cross-origin';
 el.allow='accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
 el.allowFullscreen=true;el.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');
 return el;
}
window.GrafiplotAdVideo={parse,frame};
})();