
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const text=(s,n=500)=>String(s||'').trim().slice(0,n);
const safeImage=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:''}catch{return ''}};
const action=(label,href)=>({label,href});
const quote=action('Abrir cotizador','./index.html#gp-quote'),services=action('Ver servicios','./index.html#gp-services'),tools=action('Ver herramientas PDF','./pdf.html');
export function publicKnowledge(page={}){
 return {serviceDetails:(Array.isArray(page.serviceDetails)?page.serviceDetails:[]).filter(s=>s?.name).slice(0,100).map(s=>({name:text(s.name,180),description:text(s.description,1500),image:safeImage(s.image)})),
 videos:(Array.isArray(page.videos)?page.videos:[]).filter(s=>s?.title).slice(0,100).map(v=>({title:text(v.title,120),description:text(v.description,500),category:text(v.category,80)}))};
}
const apps=[
 [/\bfut\b|formulario/, 'Completar FUT: abre el formulario de la UNHEVAL y completa los campos antes de guardar o imprimir.','Completar FUT','https://vasquezpalparoy-star.github.io/grafiplot-herramientas/fut.html'],
 [/poster|afiche/, 'Crear póster: divide una imagen en hojas A4 para imprimirla en varias partes y unirlas en un formato grande.','Crear póster','https://vasquezpalparoy-star.github.io/grafiplot-herramientas/poster.html'],
 [/ordenar|reordenar|numerar|enumerar/, 'Ordenar PDF: abre el documento, organiza sus páginas y configura la numeración.','Ordenar PDF','https://vasquezpalparoy-star.github.io/grafiplot-herramientas/order.html'],
 [/pintar|colorear/, 'Imagen para pintar: convierte una imagen en un dibujo para colorear.','Imagen para pintar','https://vasquezpalparoy-star.github.io/grafiplot-herramientas/coloring.html'],
 [/caratula/, 'Crear carátula: diseña una portada escolar personalizada.','Crear carátula','https://vasquezpalparoy-star.github.io/grafiplot-herramientas/caratulas/web/'],
 [/comprim|compresor|reducir.*pdf/, 'Compresor PDF: abre la aplicación externa para reducir el peso del PDF. Revisa su privacidad antes de subir documentos sensibles.','Compresor PDF','https://pdf-compressor.org/'],
 [/editar.*pdf|editor.*pdf/, 'Editor de PDF: abre la aplicación externa para editar tu archivo. Revisa su privacidad antes de subir documentos sensibles.','Editor PDF','https://pdf-editor.apps.vensas.de/'],
 [/\bocr\b|reconocer texto/, 'PDF y OCR: Paperless PDF es una aplicación externa para trabajar con documentos y reconocimiento de texto.','PDF y OCR','https://iacbi.github.io/paperless-pdf/']
];
export function knowledgeReply(message,context){
 const n=normalize(message);const reply=(answer,actions=[],image)=>({answer,actions,...(image?{image}:{} )});
 const isQuote=/\b(cotiz|cotis|precio|presio|cuanto|costo|cuesta|valor|tarifa)\w*\b|\d+\s*(paginas?|hojas?|planos?|juegos?)/.test(n);
 const info=/^(que es|que son|como es|como son|como se hace|como hacen|como funciona|para que sirve|explica|explicame|muestra|foto|imagen|diferencia)/.test(n);
 if(/estado.*(?:pedido|delivery)|seguimiento|donde esta mi (?:pedido|delivery)|consultar.*(?:pedido|delivery)|^delivery$/.test(n))return {answer:'Escribe directamente tu número de celular registrado o pega tu enlace privado de seguimiento. También puedes usar el formulario aquí mismo.',trackingForm:true};
 if(/biblioteca|navegador de libros|buscar (?:un )?libro/.test(n))return reply('En Mi navegador de libros puedes buscar títulos o autores y consultar las opciones disponibles. Abre la biblioteca para realizar la búsqueda.',[action('Abrir biblioteca','./navegador-libros.html')]);
 if(/\bvideos?\b|tutorial/.test(n)){const words=n.split(' ').filter(w=>w.length>3&&!['video','videos','tutorial','instructivos','mostrar','quiero','como'].includes(w));const all=context.videos||[],found=words.length?all.filter(v=>words.some(w=>normalize(v.title+' '+v.description+' '+v.category).includes(w))):all;return reply(found.length?'Videos disponibles:\n'+found.slice(0,6).map(v=>v.title+(v.description?' — '+v.description:'')).join('\n'):'Consulta nuestro catálogo de videos instructivos. Si no encuentras el tema, pregunta al local.',[action('Abrir videos instructivos','./videos-instructivos.html')]);}
 if(!isQuote){const match=apps.find(a=>a[0].test(n));if(match&&(info||/pdf|fut|poster|caratula|colorear|pintar|ocr/.test(n)))return reply(match[1],[action(match[2],match[3]),tools]);}
 if(/^(herramientas|herramientas pdf|pdf|aplicaciones|que herramientas tienen)$/.test(n))return reply('En nuestra página encuentras ocho herramientas: Completar FUT, Crear póster, Ordenar PDF, Imagen para pintar, Crear carátula, Compresor PDF, Editor de PDF y PDF y OCR. Las tres últimas son externas. ¿Cuál deseas utilizar?',[tools]);
 if(isQuote)return null;
 if((info||/^(cuadernillo|folleto)$/.test(n))&&/cuadernillo|folleto/.test(n)){
  const service=(context.serviceDetails||[]).find(s=>/cuadernillo|folleto/.test(normalize(s.name)));
  return reply('En GRAFIPLOT el formato folleto/cuadernillo del cotizador utiliza hojas A4 dobladas, con cuatro páginas del documento por hoja física. Así se obtiene un pequeño cuaderno tipo A5, ideal para guías, manuales y material de estudio. Se ordenan las páginas para que, al doblar, queden en secuencia. Por ejemplo, 100 páginas requieren 25 hojas A4. El acabado y el precio dependen de la configuración del pedido.'+(service?.description?'\n'+service.description:''),[quote,services],service?.image?{url:service.image,alt:service.name}:undefined);
 }
 if(info&&/\b(a0|a1|a2|a3|a4|a5|a6|a7)\b/.test(n)&&! /plano|impresion|escan/.test(n)){const sizes={a0:'841 × 1189',a1:'594 × 841',a2:'420 × 594',a3:'297 × 420',a4:'210 × 297',a5:'148 × 210',a6:'105 × 148',a7:'74 × 105'};return reply(n.match(/\ba[0-7]\b/g).map(size=>size.toUpperCase()+': '+sizes[size]+' mm').join('\n')+'. Son tamaños estándar de papel.',[quote]);}
 if(info&&/anillad|espiral|doble ring|engrapad/.test(n)){
 const double=/doble ring/.test(n);return reply(double?'El doble ring utiliza un alambre de doble aro que permite pasar las hojas cómodamente.':'El anillado une hojas perforadas mediante una espiral o anillos; el engrapado las sujeta con grapas. Son acabados distintos. Confirma el tipo de encuadernado que necesitas.',[services,quote]);}
 if(info||n.split(' ').length<=3){
 const stop=new Set(['que','como','para','sirve','es','son','hace','hacen','funciona','los','las','del','una','un','el','la','explica','explicame','muestra','imagen','foto','de']);
 const w=n.split(' ').filter(x=>x.length>2&&!stop.has(x)).map(x=>x.replace(/s$/,''));
 const ranked=(context.serviceDetails||[]).map(s=>({s,hits:w.filter(t=>normalize(s.name).split(' ').some(x=>x.replace(/s$/,'')===t)).length})).filter(x=>w.length&&x.hits/w.length>=.65).sort((a,b)=>b.hits-a.hits);
 if(ranked.length&&(!ranked[1]||ranked[0].hits>ranked[1].hits)){const s=ranked[0].s;return reply(s.name+': '+(s.description||'Consulta los detalles de este servicio en la página.'),[services,quote],s.image?{url:s.image,alt:s.name}:undefined);}
 }
 return null;
}
