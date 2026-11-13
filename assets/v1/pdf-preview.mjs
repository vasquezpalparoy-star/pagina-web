// GRAFIPLOT PDF - Vista previa local: PDF.js, sin servicios de pago.
const $ = id => document.getElementById(id);
const state = { items:[], index:0, doc:null, page:1, zoom:1, token:0, pdfjs:null, rendered:null, urls:[], outputs:[] };
const preview = $("gp-preview");
const libraryUrl = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
let pdfjsPromise;
function getPdfjs(){
  if (!pdfjsPromise) pdfjsPromise=import(libraryUrl).then(lib=>{
    lib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
    return lib;
  });
  return pdfjsPromise;
}
function updateMessage(message){ $("gp-preview-message").textContent=message; }
function cleanupItems(){
  state.token++;
  state.items.forEach(item=>{if(item.url)URL.revokeObjectURL(item.url)});
  state.items=[];
  state.doc=null;
  state.rendered?.cancel?.();
  state.rendered=null;
  $("gp-preview-canvas").hidden=true;
  $("gp-preview-image").hidden=true;
  $("gp-thumbstrip").replaceChildren();
  $("gp-preview-pages").textContent="0 / 0";
  $("gp-preview-files").replaceChildren();
}
function reset(){
  cleanupItems(); clearOutputs(); updateMessage("Selecciona archivos para verlos aquí.");
  $("gp-preview-name").textContent="Ningún documento seleccionado";
}
function clearOutputs(){
  state.outputs.forEach(out=>URL.revokeObjectURL(out.url));
  state.outputs=[];
  $("gp-output-list").replaceChildren();
  $("gp-output-box").hidden=true;
}
function addItem(file){const url=URL.createObjectURL(file);state.items.push({name:file.name,url,isImage:file.type.startsWith("image/")||/\.(png|jpe?g)$/i.test(file.name)})}
async function chooseItem(index){
  if(index<0||index>=state.items.length)return;
  const token=++state.token;
  state.rendered?.cancel?.();
  state.index=index;state.page=1;state.doc=null;
  const item=state.items[index];
  $("gp-preview-name").textContent=item.name;
  [...$("gp-preview-files").children].forEach((el,i)=>el.classList.toggle("active",i===index));
  $("gp-preview-canvas").hidden=true;$("gp-preview-image").hidden=true;
  $("gp-thumbstrip").replaceChildren();
  updateMessage("Cargando vista previa…");
  try{
    if(item.isImage){
      $("gp-preview-image").src=item.url;
      $("gp-preview-image").hidden=false;
      $("gp-preview-pages").textContent="1 / 1";
      updateMessage("Imagen cargada.");
      return;
    }
    const lib=await getPdfjs();
    const pdf=await lib.getDocument({url:item.url}).promise;
    if(token!==state.token){await pdf.destroy();return;}
    state.doc=pdf;
    updateMessage("PDF cargado. Puedes navegar y ampliar sus páginas.");
    await drawPage(token);
    await createThumbs(token);
  }catch(error){if(token===state.token)updateMessage("No se pudo abrir la vista previa: "+(error?.message||"archivo no compatible"))}
}
async function drawPage(token=state.token){
  const pdf=state.doc;
  if(!pdf)return;
  state.rendered?.cancel?.();
  const canvas=$("gp-preview-canvas");
  try{
    const p=await pdf.getPage(state.page);
    if(token!==state.token)return;
    const base=p.getViewport({scale:1});
    const available=Math.max(250,Math.min(820,$("gp-preview-stage").clientWidth-24));
    const scale=Math.min(2.5,(available/base.width)*state.zoom);
    const viewport=p.getViewport({scale});
    canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
    const task=p.render({canvasContext:canvas.getContext("2d"),viewport});
    state.rendered=task;
    await task.promise;
    if(token!==state.token)return;
    canvas.hidden=false;
    $("gp-preview-pages").textContent=state.page+" / "+pdf.numPages;
    [...$("gp-thumbstrip").children].forEach((el,i)=>el.classList.toggle("active",i===state.page-1));
  }catch(e){if(e?.name!=="RenderingCancelledException"&&token===state.token)updateMessage("No se pudo dibujar la página.")}
}
async function createThumbs(token){
  const pdf=state.doc;if(!pdf)return;
  const limit=Math.min(pdf.numPages,45);
  for(let i=1;i<=limit;i++){
    if(token!==state.token)return;
    const btn=document.createElement("button");btn.type="button";btn.className="gp-thumb";
    btn.title="Ver página "+i;btn.textContent="Página "+i;
    btn.onclick=()=>{state.page=i;drawPage()};
    $("gp-thumbstrip").append(btn);
  }
  if(pdf.numPages>limit){
    const info=document.createElement("span");info.className="gp-thumb-extra";info.textContent="+"+(pdf.numPages-limit)+" páginas (usa el navegador de páginas)";
    $("gp-thumbstrip").append(info);
  }
  [...$("gp-thumbstrip").children].forEach((el,i)=>el.classList.toggle("active",i===state.page-1));
}
async function onFiles(){
  clearOutputs();cleanupItems();
  const files=[...$("files").files];
  files.forEach(addItem);
  for(let i=0;i<state.items.length;i++){
    const btn=document.createElement("button");btn.type="button";btn.className="gp-file-tab";
    btn.textContent=(i+1)+". "+state.items[i].name;
    btn.title=state.items[i].name;
    btn.onclick=()=>chooseItem(i);
    $("gp-preview-files").append(btn);
  }
  if(files.length)await chooseItem(0);else updateMessage("Selecciona archivos para verlos aquí.");
}
$("files").addEventListener("change",onFiles);
$("gp-prev").onclick=()=>{if(state.doc&&state.page>1){state.page--;drawPage()}};
$("gp-next").onclick=()=>{if(state.doc&&state.page<state.doc.numPages){state.page++;drawPage()}};
$("gp-zoom-out").onclick=()=>{state.zoom=Math.max(.5,state.zoom-.25);$("gp-zoom-level").textContent=Math.round(state.zoom*100)+"%";drawPage()};
$("gp-zoom-in").onclick=()=>{state.zoom=Math.min(3,state.zoom+.25);$("gp-zoom-level").textContent=Math.round(state.zoom*100)+"%";drawPage()};
document.addEventListener("grafiplot:tool-change",reset);
document.addEventListener("grafiplot:output",e=>{
  const {bytes,name}=e.detail;
  const blob=new Blob([bytes],{type:"application/pdf"}),url=URL.createObjectURL(blob);
  state.outputs.push({url,name});
  $("gp-output-box").hidden=false;
  const row=document.createElement("div");row.className="gp-output-item";
  const label=document.createElement("span");label.textContent="✓ "+name;
  const view=document.createElement("button");view.type="button";view.textContent="Ver resultado";
  view.onclick=()=>{
    cleanupItems();state.items.push({name,url,isImage:false});
    const btn=document.createElement("button");btn.className="gp-file-tab active";btn.textContent=name;btn.onclick=()=>chooseItem(0);
    $("gp-preview-files").append(btn);chooseItem(0);
  };
  const download=document.createElement("a");download.href=url;download.download=name;download.textContent="Descargar PDF";
  row.append(label,view,download);$("gp-output-list").append(row);
  updateMessage("Resultado listo. Puedes visualizarlo antes de descargar.");
});
window.addEventListener("pagehide",()=>{cleanupItems();clearOutputs()});
