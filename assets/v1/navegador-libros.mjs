
import {USER_FIREBASE_CONFIG} from "./config.js";
import {parseBooks} from "./library.mjs";
const $=id=>document.getElementById(id);
const state={mode:"library",books:[],found:[],selected:new Map(),openResults:[],photos:[],searchTimer:0};
const status=(s)=>{$("status").textContent=s};
const norm=(s)=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
const clean=(s)=>String(s||"").replace(/[<>]/g,"").trim();
const txt=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=String(value||"");if(cls)n.className=cls;return n};
const setCount=(n)=>{$("resultsCount").textContent=n+" resultado"+(n===1?"":"s")};
function showPreview(item){
 const area=$("previewBody");area.replaceChildren();$("previewInfo").textContent=item.author||item.license||item.detail||"";
 if(item.kind==="book"&&item.preview){const frame=document.createElement("iframe");frame.referrerPolicy="no-referrer";frame.title="Vista previa: "+item.title;frame.src=item.preview;area.append(frame);}
 else if(item.cover){const img=document.createElement("img");img.alt=item.title;img.src=item.cover;area.append(img);}
 else area.append(txt("span",item.title));
}
function createCard(item){
 const card=txt("article","","item"),cover=txt("div","","cover");
 if(item.cover){const img=document.createElement("img");img.src=item.cover;img.alt="Imagen de "+item.title;img.loading="lazy";img.referrerPolicy="no-referrer";img.onerror=()=>{img.remove();cover.append(txt("span",item.kind==="book"?"📚":"🖼️"))};cover.append(img)}
 else cover.append(txt("span",item.kind==="book"?"📚":"🖼️"));
 const detail=txt("div","","details");
 detail.append(txt("strong",item.title),txt("small",item.sourceLabel||item.license||""));if(item.author||item.license)detail.append(txt("small",item.author||item.license));
 const actions=txt("div","","actions");
 const view=txt("button","👁 Ver");view.type="button";view.onclick=()=>showPreview(item);actions.append(view);
 if(item.href){const a=txt("a",item.kind==="book"?"Abrir libro ↗":"Original ↗");a.href=item.href;a.target="_blank";a.rel="noopener noreferrer";actions.append(a)}
 if(item.kind==="image"){
   const btn=txt("button",state.selected.has(item.id)?"✓ Seleccionada":"✓ Seleccionar","add");
   btn.type="button";btn.onclick=()=>{if(state.selected.has(item.id))state.selected.delete(item.id);else state.selected.set(item.id,item);paintSelection();btn.textContent=state.selected.has(item.id)?"✓ Seleccionada":"✓ Seleccionar";btn.setAttribute("aria-pressed",String(state.selected.has(item.id)))};
   actions.append(btn);
 }
 detail.append(actions);card.append(cover,detail);return card;
}
function render(items){state.found=items;const area=$("results");area.replaceChildren();setCount(items.length);if(!items.length){area.append(txt("p","No hay resultados. Prueba con otros términos.","hint"));return}for(const item of items)area.append(createCard(item))}
function paintSelection(){
 const list=$("selectedList");list.replaceChildren();$("selectedCount").textContent=state.selected.size;
 for(const item of state.selected.values()){
   const row=txt("div","","selectedItem");
   row.append(txt("span",item.title));
   const remove=txt("button","✕");remove.type="button";remove.setAttribute("aria-label","Quitar "+item.title);
   remove.onclick=()=>{state.selected.delete(item.id);paintSelection();render(state.found)};row.append(remove);list.append(row);
 }
 if(!state.selected.size)list.append(txt("p","Las imágenes que selecciones aparecerán aquí.","hint"));
 $("whatsappOrder").disabled=!state.selected.size;
}
function refreshCategories(){
 const sel=$("category");sel.replaceChildren();
 for(const category of ["Todos",...new Set(state.books.map(x=>x.category||"Otros"))]){
  const o=document.createElement("option");o.textContent=category;o.value=category;sel.append(o);
 }
}
function localBookResults(){
 const q=norm($("searchInput").value);const cat=$("category").value;
 const found=state.books.filter(b=>(cat==="Todos"||b.category===cat)&&norm([b.title,b.author,b.category].join(" ")).includes(q));
 return found.map(b=>({...b,sourceLabel:"📚 Mi biblioteca GRAFIPLOT"}));
}
function currentLibrary(){
 const found=localBookResults();render(found);
 status("Biblioteca GRAFIPLOT: "+found.length+" libro(s) configurados. Para combinar con Internet, escribe una búsqueda.");
}
async function connectLibrary(){
 try{
  const [{initializeApp,getApps,getApp},{getFirestore,doc,onSnapshot}]=await Promise.all([
   import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"),
   import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js")
  ]);
  const app=getApps().find(a=>a.name==="[DEFAULT]")||initializeApp(USER_FIREBASE_CONFIG);
  const db=getFirestore(app);
  onSnapshot(doc(db,"artifacts","grafiplot-tienda-v4","public","data","settings","config"),snapshot=>{
    const data=snapshot.data()||{};
    try{state.books=parseBooks(data.libraryLinks||"").map(b=>({...b,kind:"book",cover:b.cover||"",href:b.url,preview:b.preview,id:"book:"+b.id}));refreshCategories();if(state.mode==="library"){if($("searchInput").value.trim())searchNow();else currentLibrary();}}
    catch(err){state.books=[];if(state.mode==="library"){if($("searchInput").value.trim())searchNow();else render([])}status("Hay enlaces no válidos en la biblioteca: "+err.message)}
  },error=>{status("No se pudo consultar la biblioteca configurada en Firebase ("+(error.code||"error")+"). Comprueba los permisos públicos de lectura.")});
 }catch(error){status("No se pudo conectar la biblioteca: "+(error.message||"error de red"))}
}
async function searchOpenLibrary(query){
 if(!query)return [];
 const url="https://openlibrary.org/search.json?q="+encodeURIComponent(query)+"&limit=30&fields=key,title,author_name,cover_i,first_publish_year";
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 try{
 const response=await fetch(url,{headers:{Accept:"application/json"},signal:controller.signal});
 if(!response.ok)throw Error("Open Library no respondió ("+response.status+").");
 const data=await response.json();
 return (data.docs||[]).filter(x=>typeof x.key==="string"&&x.key.startsWith("/works/")).map(b=>({
 kind:"book",id:b.key,title:b.title||"Libro",
 author:(b.author_name||[]).slice(0,2).join(", ")+(b.first_publish_year?" · "+b.first_publish_year:""),
 cover:b.cover_i?"https://covers.openlibrary.org/b/id/"+b.cover_i+"-M.jpg":"",
 href:"https://openlibrary.org"+b.key,detail:"Ficha bibliográfica: no todos los libros tienen lectura gratuita.",sourceLabel:"🌐 Internet · Open Library"
 }));
 }finally{clearTimeout(timer)}
}
async function searchCommons(query){
 if(!query){render([]);status("Escribe qué imagen buscas, por ejemplo: flores, paisajes o sistema solar.");return}
 status("Buscando imágenes en Wikimedia Commons…");
 const params=new URLSearchParams({action:"query",format:"json",origin:"*",generator:"search",gsrsearch:"filetype:bitmap "+query,gsrnamespace:"6",gsrlimit:"36",prop:"imageinfo",iiprop:"url|size|mime|extmetadata",iiurlwidth:"380"});
 const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString());
 if(!response.ok)throw Error("Wikimedia Commons no respondió ("+response.status+").");
 const data=await response.json();
 const photos=Object.values(data.query?.pages||{}).map(p=>{
  const meta=p.imageinfo?.[0]||{};
  const mime=meta.mime||"";
  const image=meta.url||"";
  if(!/^image\/(jpeg|png|webp|gif)$/i.test(mime)||!image.startsWith("https://"))return null;
  const license=String(meta.extmetadata?.LicenseShortName?.value||"Consultar licencia en Commons").replace(/<[^>]+>/g,"");
  return {kind:"image",id:"commons:"+p.pageid,title:clean(p.title?.replace(/^File:/,"")||"Imagen"),license,width:meta.width,height:meta.height,cover:meta.thumburl||image,href:"https://commons.wikimedia.org/wiki/"+encodeURIComponent(p.title.replace(/ /g,"_")),original:image,mime};
 }).filter(Boolean);
 state.photos=photos;render(photos);status(photos.length+" imágenes encontradas en Wikimedia Commons. Selecciona las que necesitas. Revisa sus licencias.");
}
function switchMode(mode){
 if(!["library","images"].includes(mode))return;
 state.mode=mode;
 ++searchSerial;
 document.querySelectorAll("[data-kind]").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.kind===mode)));
 $("searchInput").placeholder=mode==="library"?"Buscar libros en mi biblioteca y en Internet…":"Buscar imágenes de Internet (Wikimedia Commons)…";
 $("category").parentElement.hidden=mode!=="library";
 $("resultsTitle").textContent=mode==="library"?"Libros: mi biblioteca primero, luego Internet":"Imágenes de Internet";
 $("searchInput").value="";
 if(mode==="library")currentLibrary();
 else{render([]);status("Escribe una búsqueda para ver imágenes en Internet.")}
}
let searchSerial=0;
async function searchNow(){
 const token=++searchSerial,q=$("searchInput").value.trim();
 if(state.mode==="images"){
  try{await searchCommons(q)}catch(e){if(token===searchSerial){render([]);status("No se pudo buscar imágenes: "+(e.message||"revisa conexión"))}}
  return;
 }
 const local=localBookResults();
 if(!q){if(token===searchSerial)currentLibrary();return}
 render(local);
 status("Buscando en Internet… Tus "+local.length+" resultado(s) de la biblioteca aparecen primero.");
 try{
  const online=await searchOpenLibrary(q);
  if(token!==searchSerial||state.mode!=="library")return;
  const localTitles=new Set(local.map(b=>norm(b.title)));
  const uniques=online.filter(b=>!localTitles.has(norm(b.title)));
  render([...local,...uniques]);
  status(local.length+" de tu biblioteca primero y "+uniques.length+" de Internet (Open Library). La disponibilidad de lectura depende de cada libro.");
 }catch(error){
  if(token!==searchSerial||state.mode!=="library")return;
  render(local);
  status("Mostrando "+local.length+" libro(s) de tu biblioteca. La consulta a Internet falló: "+(error.message||"conexión no disponible"));
 }
}
function zipName(item,i){const title=item.title.replace(/[\\/:*?"<>|]/g,"_").slice(0,100),ext={"image/jpeg":".jpg","image/png":".png","image/gif":".gif","image/webp":".webp"}[item.mime]||".jpg";return String(i+1).padStart(2,"0")+"-"+title+(title.toLowerCase().endsWith(ext)?"":ext)}
let zipPromise=null;function zipLib(){
 if(zipPromise)return zipPromise;
 zipPromise=new Promise((resolve,reject)=>{
  if(window.JSZip)return resolve(window.JSZip);
  const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
  s.onload=()=>window.JSZip?resolve(window.JSZip):reject(Error("No se pudo cargar JSZip"));s.onerror=()=>reject(Error("No se pudo cargar la biblioteca ZIP."));document.head.append(s);
 });return zipPromise;
}
let cachedZip=null,cachedKey="";
async function makeZip(){
 const items=[...state.selected.values()];
 if(!items.length)throw Error("Selecciona al menos una imagen.");
 const key=items.map(x=>x.id).join("|");
 if(cachedZip&&key===cachedKey)return cachedZip;
 const JSZip=await zipLib(),zip=new JSZip(),failed=[];
 for(const [i,item] of items.entries()){
  status("Preparando imagen original "+(i+1)+" de "+items.length+": "+item.title);
  try{
   let blob;
   if(item.source)blob=item.source;
   else{
    const response=await fetch(item.original,{mode:"cors",credentials:"omit",redirect:"follow"});
    if(!response.ok)throw Error("HTTP "+response.status);
    blob=await response.blob();
    if(!blob.type.startsWith("image/"))throw Error("La fuente no devolvió una imagen");
   }
   if(blob.size>45*1024*1024)throw Error("Imagen superior a 45 MB");
   zip.file(zipName(item,i),blob,{binary:true});
  }catch(error){failed.push(item.title+" — "+(error.message||"descarga bloqueada"))}
 }
 if(Object.keys(zip.files).length===0)throw Error("No se pudo descargar ninguna imagen original. Algunas fuentes bloquean la descarga desde otras webs.");
 if(failed.length)zip.file("IMAGENES_NO_INCLUIDAS.txt","No se pudieron incluir estas imágenes originales:\\n"+failed.join("\\n")+"\\nPrueba abriendo el enlace original.");
 const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:3}});
 cachedZip={blob,failed,included:items.length-failed.length};cachedKey=key;
 status("ZIP listo: "+cachedZip.included+" imagen(es) originales incluidas."+(failed.length?" "+failed.length+" omitida(s); revisa el TXT dentro del ZIP.":""));
 return cachedZip;
}
function whatsappMessage(){
 const items=[...state.selected.values()];
 const list=items.map((x,i)=>(i+1)+". "+x.title+"\n"+(x.href||x.original||"")).join("\n\n");
 return "Hola GRAFIPLOT, tengo "+items.length+" imágenes seleccionadas para imprimir.\n"+list+"\nCompartiré el ZIP con las imágenes originales mediante WhatsApp cuando mi dispositivo lo permita.";
}
async function shareViaWhatsApp(){
 const button=$("whatsappOrder");
 button.disabled=true;
 try{
  if(!navigator.share||!navigator.canShare){
   status("Este navegador no permite compartir ZIP directamente. No se descargó nada. Abre desde Chrome en Android y usa «Enviar ZIP por WhatsApp».");return;
  }
  const {blob,included,failed}=await makeZip();
  if(failed.length){status("No se pueden incluir "+failed.length+" imágenes de la fuente. No se enviará un archivo incompleto; consulta los enlaces originales.");return}
  const file=new File([blob],"GRAFIPLOT-imagenes-originales.zip",{type:"application/zip"});
  if(!navigator.canShare({files:[file]})){
   status("Este dispositivo no permite compartir archivos ZIP directamente. No se descargó nada. Abre desde Chrome en Android o usa los enlaces originales.");return;
  }
  await navigator.share({files:[file],title:"Imágenes para GRAFIPLOT",text:"Imágenes originales para impresión en GRAFIPLOT"});
  status("Se abrió el menú para compartir "+included+" imágenes en ZIP. Selecciona WhatsApp, busca el contacto de GRAFIPLOT (916 133 647) y confirma el envío.");
 }catch(error){
  if(error.name!=="AbortError")status("No fue posible compartir el ZIP: "+(error.message||"revisa tu conexión o permisos de la fuente"));
 }finally{button.disabled=!state.selected.size}
}
$("searchForm").onsubmit=e=>{e.preventDefault();searchNow()};
$("searchInput").oninput=()=>{if(state.mode==="library"){clearTimeout(state.searchTimer);state.searchTimer=setTimeout(searchNow,420)}};
$("category").onchange=()=>{if(state.mode==="library")searchNow()};
document.querySelectorAll("[data-kind]").forEach(t=>t.onclick=()=>switchMode(t.dataset.kind));
$("whatsappOrder").onclick=shareViaWhatsApp;
$("clearSelection").onclick=()=>{state.selected.clear();cachedZip=null;cachedKey="";paintSelection();render(state.found)};
const nativeSet=state.selected.set.bind(state.selected),nativeDelete=state.selected.delete.bind(state.selected);
state.selected.set=(...args)=>{cachedZip=null;cachedKey="";return nativeSet(...args)};
state.selected.delete=(...args)=>{cachedZip=null;cachedKey="";return nativeDelete(...args)};
paintSelection();connectLibrary();
