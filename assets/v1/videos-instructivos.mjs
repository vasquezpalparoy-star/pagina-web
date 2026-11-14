import {USER_FIREBASE_CONFIG} from './config.js';
import {createSettingsAuth,settingsAuthError} from './settings-auth.mjs?v=owner-20261105';
const defaults=['Impresión y copias','Tipos de impresión','Encuadernado','Sublimación','Planos','Escaneos','Diseño y edición','Consejos y tutoriales'];
let categories=['Todos los videos',...defaults];
function updateCategories(value){
 const raw=Array.isArray(value)?value:defaults;
 const clean=[...new Set(raw.map(x=>String(x||'').trim().slice(0,55)).filter(Boolean))].slice(0,35);
 categories=['Todos los videos',...(clean.length?clean:defaults)];
 if(!categories.includes(category))category=categories[0];
 const dropdown=$('edit-category');
 if(dropdown){
  const previous=dropdown.value;
  dropdown.replaceChildren();
  categories.slice(1).forEach(c=>dropdown.append(new Option(c,c)));
  if(categories.includes(previous))dropdown.value=previous;
 }
 buildFilters();
}
const $=id=>document.getElementById(id);
const defaultList=[];
const safeImage=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
function videoInfo(value){
 let u;try{u=new URL(String(value||''))}catch{return null}
 if(u.protocol!=='https:')return null;
 const host=u.hostname.toLowerCase().replace(/^www\./,'');
 const p=u.pathname.split('/').filter(Boolean);let id='';
 if(host==='drive.google.com'){
  if(p[0]==='file'&&p[1]==='d')id=p[2]||'';
  else if(['open','uc'].includes(p[0]))id=u.searchParams.get('id')||'';
  if(!/^[a-zA-Z0-9_-]{10,200}$/.test(id))return null;
  return {source:'drive',embed:'https://drive.google.com/file/d/'+id+'/preview',original:u.href,thumbnail:''};
 }
 if(host==='youtube.com'||host==='m.youtube.com'||host==='youtube-nocookie.com'){
  if(p[0]==='watch')id=u.searchParams.get('v')||'';
  else if(['shorts','embed','live'].includes(p[0]))id=p[1]||'';
 }else if(host==='youtu.be')id=p[0]||'';
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
 return {source:'youtube',embed:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1&rel=0',original:u.href,thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'};
}
let records=defaultList,category=categories[0],query='',selected='',db=null,ref=null,authBridge=null,unlocked=false,cloudReady=false;
const status=(value)=>{$('video-status').textContent=value};
function normalized(item){
 if(!item||typeof item!=='object')return null;
 const title=String(item.title||'').trim().slice(0,100),url=String(item.url||'').trim();
 if(!title||!videoInfo(url))return null;
 return {id:String(item.id||'').slice(0,100)||String(Date.now()),title,url,category:String(item.category||categories[1]).slice(0,55),description:String(item.description||'').slice(0,500),thumbnail:safeImage(item.thumbnail||'')};
}
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e}
function buildFilters(){
 const root=$('categories');root.replaceChildren();
 for(const name of categories){
  const b=el('button','filter',name);b.type='button';b.setAttribute('aria-pressed',String(category===name));b.onclick=()=>{category=name;buildFilters();render()};root.append(b);
 }
}
function showVideo(item){
 selected=item.id;
 const info=videoInfo(item.url);if(!info)return;
 $('video-player').replaceChildren();
 const frame=document.createElement('iframe');frame.src=info.embed;frame.title='Video: '+item.title;
 frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');
 $('video-player').append(frame);
 if(info.source==='drive'){
  const fallback=el('a','', 'Abrir video en Drive ↗');
  fallback.href=info.original;fallback.target='_blank';fallback.rel='noopener noreferrer';
  Object.assign(fallback.style,{position:'absolute',bottom:'8px',right:'8px',zIndex:'2',color:'white',background:'#14213add',padding:'5px 8px',fontSize:'12px',borderRadius:'7px'});$('video-player').append(fallback);
 }
 $('video-title').textContent=item.title;$('video-desc').textContent=item.description||'Video instructivo de GRAFIPLOT.';
 $('video-cta').href='https://wa.me/51916133647?text='+encodeURIComponent('Hola GRAFIPLOT, quiero consultar el servicio: '+item.title);
 render();
}
function render(){
 const filtered=records.filter(x=>(category===categories[0]||x.category===category)&&[x.title,x.description,x.category].join(' ').toLowerCase().includes(query));
 const root=$('video-list');root.replaceChildren();
 if(!filtered.length){
  const p=el('div','empty',records.length?'No hay videos en esta categoría.':'Próximamente encontrarás aquí los videos instructivos de GRAFIPLOT.');
  root.append(p);
 }else for(const item of filtered){
  const b=el('button','item');b.type='button';b.setAttribute('aria-pressed',String(selected===item.id));
  const poster=el('div','poster');const info=videoInfo(item.url);
  const thumbnail=item.thumbnail||info?.thumbnail;
  if(thumbnail){const img=el('img');img.src=thumbnail;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';poster.append(img)}
  else poster.append(el('span','mark','🖨️'));
  poster.append(el('span','play','▶'));b.append(poster);
  const caption=el('div','info');caption.append(el('strong','',item.title),el('small','',item.category));b.append(caption);
  b.onclick=()=>showVideo(item);root.append(b);
 }
 status(records.length?records.length+' video(s) disponibles.':'Aún no hay videos publicados. El propietario puede agregarlos en «Administrar videos».');
 renderAdmin();
}
function renderAdmin(){
 if(!unlocked)return;
 const root=$('admin-items');root.replaceChildren();
 for(const item of records){
  const row=el('div','admin-row');row.append(el('span','',item.title));
  const btns=el('div');const edit=el('button','','Editar'),del=el('button','','Eliminar');edit.type=del.type='button';
  edit.onclick=()=>{$('video-id').value=item.id;$('edit-title').value=item.title;$('edit-category').value=item.category;$('edit-url').value=item.url;$('edit-description').value=item.description;$('edit-thumbnail').value=item.thumbnail;$('edit-title').focus()};
  del.onclick=async()=>{if(!confirm('¿Eliminar «'+item.title+'»?'))return;try{await persist(records.filter(x=>x.id!==item.id))}catch(e){$('admin-status').textContent=e.message}};
  btns.append(edit,del);row.append(btns);root.append(row);
 }
}
const resetForm=()=>{$('video-form').reset();$('video-id').value=''};
async function persist(next){
 if(!authBridge||!ref||!cloudReady)throw Error('Sin conexión confirmada con Firebase.');
 await authBridge.assertOwner();
 const {setDoc}=await import('./firebase.js');
 await setDoc(ref,{instructionalVideos:next},{merge:true});
 records=next;render();$('admin-status').textContent='Videos guardados en Firebase.';
}
$('search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render()});
$('admin-toggle').addEventListener('click',()=>{$('admin').hidden=!$('admin').hidden});
$('admin-clear').addEventListener('click',resetForm);
updateCategories(null);
$('video-form').addEventListener('submit',async e=>{
 e.preventDefault();const url=$('edit-url').value.trim();
 if(!videoInfo(url)){$('admin-status').textContent='Usa un enlace válido de YouTube o Google Drive.';return}
 const id=$('video-id').value||'video-'+Date.now();
 const item=normalized({id,title:$('edit-title').value,category:$('edit-category').value,url,description:$('edit-description').value,thumbnail:$('edit-thumbnail').value});
 if(!item)return;
 const next=[...records.filter(x=>x.id!==id),item];
 if(next.length>100){$('admin-status').textContent='Máximo 100 videos.';return}
 try{await persist(next);resetForm()}catch(err){$('admin-status').textContent=settingsAuthError(err)}
});
$('admin-login').addEventListener('submit',async e=>{
 e.preventDefault();$('admin-status').textContent='Verificando acceso…';
 try{await authBridge.login($('admin-email').value,$('admin-password').value);
  await authBridge.assertOwner();unlocked=true;$('admin-login').hidden=true;$('admin-editor').hidden=false;renderAdmin();$('admin-status').textContent='Propietario autorizado.';
 }catch(err){$('admin-status').textContent=settingsAuthError(err)}
});
$('admin-logout').addEventListener('click',async()=>{try{await authBridge.logout()}catch{}unlocked=false;$('admin-editor').hidden=true;$('admin-login').hidden=false;$('admin-status').textContent='Sesión cerrada.'});
buildFilters();render();
async function connect(){
 try{
  const sdk=await import('./firebase.js');
  const app=sdk.initializeApp(USER_FIREBASE_CONFIG,'grafiplot-video-page');
  const auth=sdk.getAuth(app);
  db=sdk.getFirestore(app);ref=sdk.doc(db,'artifacts','grafiplot-tienda-v4','public','data','settings','config');
  authBridge=createSettingsAuth(sdk,auth);
  await authBridge.watch(allowed=>{
   if(!allowed){unlocked=false;$('admin-editor').hidden=true;$('admin-login').hidden=false}
  });
  sdk.onSnapshot(ref,{includeMetadataChanges:true},snapshot=>{
   cloudReady=!snapshot.metadata.fromCache;
   if(snapshot.exists()){
    updateCategories(snapshot.data().instructionalVideoCategories);
    records=(Array.isArray(snapshot.data().instructionalVideos)?snapshot.data().instructionalVideos:[]).map(normalized).filter(Boolean).slice(0,100);
   }
   render();
  },err=>{status('No se pudieron consultar los videos publicados.');$('admin-status').textContent=String(err.code||'Error de lectura')});
 }catch(err){status('No se pudo conectar con Firebase.');$('admin-status').textContent=err.message}
}
connect();