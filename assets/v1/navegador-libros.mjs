
import {USER_FIREBASE_CONFIG} from "./config.js";
import {parseBooks} from "./library.mjs";
const $=id=>document.getElementById(id);
const state={mode:"library",books:[],found:[],selected:new Map(),openResults:[],photos:[],files:[],searchTimer:0};
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
 detail.append(txt("strong",item.title),txt("small",item.author||item.license||item.detail||""));
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
 for(const id of ["downloadZip","shareZip","whatsappOrder"])$(id).disabled=!state.selected.size;
}
function refreshCategories(){
 const sel=$("category");sel.replaceChildren();
 for(const category of ["Todos",...new Set(state.books.map(x=>x.category||"Otros"))]){
  const o=document.createElement("option");o.textContent=category;o.value=category;sel.append(o);
 }
}
function currentLibrary(){
 const q=norm($("searchInput").value);const cat=$("category").value;
 const found=state.books.filter(b=>(cat==="Todos"||b.category===cat)&&norm([b.title,b.author,b.category].join(" ")).includes(q));
 render(found);status("Biblioteca GRAFIPLOT: "+found.length+" libro(s) disponibles de los enlaces configurados por el administrador.");
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
    try{state.books=parseBooks(data.libraryLinks||"").map(b=>({...b,kind:"book",cover:b.cover||"",href:b.url,preview:b.preview,id:"book:"+b.id}));refreshCategories();if(state.mode==="library")currentLibrary();}
    catch(err){state.books=[];if(state.mode==="library")render([]);status("Hay enlaces no válidos en la biblioteca: "+err.message)}
  },error=>{status("No se pudo consultar la biblioteca configurada en Firebase ("+(error.code||"error")+"). Comprueba los permisos públicos de lectura.")});
 }catch(error){status("No se pudo conectar la biblioteca: "+(error.message||"error de red"))}
}
async function searchOpenLibrary(query){
 if(!query){render([]);status("Escribe un título, autor o tema para buscar libros de Internet.");return}
 status("Buscando libros en Open Library…");
 const url="https://openlibrary.org/search.json?q="+encodeURIComponent(query)+"&limit=30&fields=key,title,author_name,cover_i,first_publish_year";
 const response=await fetch(url,{headers:{Accept:"application/json"}});
 if(!response.ok)throw Error("Open Library no respondió ("+response.status+").");
 const data=await response.json();
 const books=(data.docs||[]).filter(x=>typeof x.key==="string"&&x.key.startsWith("/works/")).map(b=>({
 kind:"book",id:b.key,title:b.title||"Libro",author:(b.author_name||[]).slice(0,2).join(", ")+(b.first_publish_year?" · "+b.first_publish_year:""),cover:b.cover_i?"https://covers.openlibrary.org/b/id/"+b.cover_i+"-M.jpg":"",href:"https://openlibrary.org"+b.key,detail:"Ficha bibliográfica en Open Library; la disponibilidad del texto depende de sus derechos."
 }));
 render(books);status("Resultados públicos de Open Library. No todos los libros incluyen lectura gratuita o PDF completo.");
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
function localImages(){
 const images=state.files.map((file,i)=>({kind:"image",id:"local:"+i+":"+file.name,title:file.name,cover:URL.createObjectURL(file),original:null,source:file,license:"Archivo seleccionado de tu equipo",mime:file.type}));
 render(images);status(images.length+" imágenes locales disponibles. Se guardarán sin cambiar sus bytes.");
}
function switchMode(mode){
 if(state.mode==="local"&&mode!=="local")for(const item of state.found)if(item.id?.startsWith("local:")&&item.cover?.startsWith("blob:"))URL.revokeObjectURL(item.cover);
 state.mode=mode;
 document.querySelectorAll("[data-kind]").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.kind===mode)));
 $("searchInput").placeholder={library:"Buscar en mi biblioteca por título, autor o categoría…",internet:"Buscar libros en Internet (Open Library)…",images:"Buscar imágenes originales de Internet (Wikimedia Commons)…",local:"Selecciona imágenes de tu equipo…"}[mode];
 $("category").parentElement.hidden=mode!=="library";$("uploadRow").hidden=mode!=="local";
 $("resultsTitle").textContent={library:"Mi biblioteca GRAFIPLOT",internet:"Libros de Internet",images:"Imágenes de Internet",local:"Mis imágenes locales"}[mode];
 $("searchInput").value="";
 if(mode==="library")currentLibrary();
 else if(mode==="local")localImages();
 else{render([]);status("Escribe una búsqueda para ver resultados.")}
}
let searchSerial=0;
async function searchNow(){
 const token=++searchSerial,q=$("searchInput").value.trim();
 try{
  if(state.mode==="library")currentLibrary();
  if(state.mode==="internet")await searchOpenLibrary(q);
  if(state.mode==="images")await searchCommons(q);
  if(state.mode==="local")localImages();
 }catch(e){if(token===searchSerial){render([]);status("No se pudo buscar en Internet: "+(e.message||"revisa conexión"))}}
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
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function whatsappMessage(){
 const names=[...state.selected.values()].map(x=>"• "+x.title).join("\\n");
 return "Hola GRAFIPLOT, quiero consultar impresión de estas imágenes:\\n"+names+"\\nTengo las imágenes originales en un ZIP para adjuntar.";
}
async function handleZip(share=false){
 try{
  $("downloadZip").disabled=$("shareZip").disabled=true;
  const {blob}=await makeZip(),file=new File([blob],"GRAFIPLOT-imagenes-originales.zip",{type:"application/zip"});
  if(share&&navigator.canShare?.({files:[file]})&&navigator.share){
   await navigator.share({files:[file],title:"Imágenes para GRAFIPLOT",text:"Imágenes originales seleccionadas"});
   status("Archivo ZIP enviado al panel de compartir. Selecciona WhatsApp si está disponible.");
  }else{
   download(blob,file.name);
   status("ZIP descargado. Abre WhatsApp y adjunta «"+file.name+"» como documento (📎). La página web no puede adjuntarlo automáticamente en WhatsApp.");
  }
 }catch(error){if(error.name!=="AbortError")status("No se pudo preparar ZIP: "+(error.message||"Error inesperado"))}
 finally{paintSelection()}
}
$("searchForm").onsubmit=e=>{e.preventDefault();searchNow()};
$("searchInput").oninput=()=>{if(state.mode==="library")currentLibrary()};
$("category").onchange=currentLibrary;
document.querySelectorAll("[data-kind]").forEach(t=>t.onclick=()=>switchMode(t.dataset.kind));
$("localFiles").onchange=e=>{
 state.files=[...e.target.files].filter(f=>f.type.startsWith("image/"));
 switchMode("local");
};
$("downloadZip").onclick=()=>handleZip(false);
$("shareZip").onclick=()=>handleZip(true);
$("whatsappOrder").onclick=()=>window.open("https://wa.me/51916133647?text="+encodeURIComponent(whatsappMessage()),"_blank","noopener,noreferrer");
$("clearSelection").onclick=()=>{state.selected.clear();cachedZip=null;cachedKey="";paintSelection();render(state.found)};
const nativeSet=state.selected.set.bind(state.selected),nativeDelete=state.selected.delete.bind(state.selected);
state.selected.set=(...args)=>{cachedZip=null;cachedKey="";return nativeSet(...args)};
state.selected.delete=(...args)=>{cachedZip=null;cachedKey="";return nativeDelete(...args)};
paintSelection();connectLibrary();
