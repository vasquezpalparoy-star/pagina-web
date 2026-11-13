/*
 * GRAFIPLOT PDF: traducción visible al español en copias aisladas.
 * No sustituye ni modifica la lógica de las aplicaciones originales.
 * Se inyecta en los HTML compilados, no en los archivos fuente del motor PDF.
 */
(() => {
  "use strict";
  document.documentElement.lang = "es";
  const entries = {
    "Select":"Seleccionar","Edit text":"Editar texto","Remove object":"Eliminar objeto",
    "Text":"Texto","Rich text":"Texto enriquecido","Draw":"Dibujar","Highlight":"Resaltar",
    "Rectangle":"Rectángulo","Ellipse":"Elipse","Line":"Línea","Arrow":"Flecha",
    "File":"Archivo","History":"Historial","Workspace":"Área de trabajo","Editor commands":"Comandos del editor",
    "Annotation tools":"Herramientas de anotación","Page operations":"Operaciones de páginas","Export":"Exportar",
    "Merge PDF":"Unir PDF","Merge PDFs":"Unir PDF","Merge PDF files":"Unir archivos PDF",
    "Split":"Dividir","Split PDF":"Dividir PDF","Split PDF files":"Dividir PDF",
    "Compress PDF":"Comprimir PDF","Compression":"Compresión","Compress":"Comprimir",
    "PDF Editor":"Editor de PDF","PDF Compressor Web":"Compresor PDF",
    "PDF to PNG":"PDF a PNG","PDF to Images":"PDF a imágenes","Images to PDF":"Imágenes a PDF",
    "OCR":"Reconocimiento de texto (OCR)","Rotate PDF":"Girar PDF",
    "Rotate":"Girar","Rotate left":"Girar a la izquierda","Rotate right":"Girar a la derecha",
    "Select PDF":"Seleccionar PDF","Choose file":"Elegir archivo",
    "Choose Files":"Elegir archivos","Choose files":"Elegir archivos",
    "Browse files":"Buscar archivos","Browse Files":"Buscar archivos",
    "Drag and drop":"Arrastra y suelta","Drop files here":"Suelta los archivos aquí",
    "Drop PDF here":"Suelta el PDF aquí",
    "Open":"Abrir","Open PDF":"Abrir PDF","Open file":"Abrir archivo","Open files":"Abrir archivos",
    "New":"Nuevo","New document":"Nuevo documento","Blank page":"Página en blanco",
    "Insert…":"Insertar…","Split…":"Dividir…","Insert":"Insertar",
    "Undo":"Deshacer","Redo":"Rehacer","Recent":"Recientes","Recent files":"Archivos recientes",
    "Export PDF":"Exportar PDF","Export selection":"Exportar selección",
    "Export selected pages":"Exportar páginas seleccionadas",
    "Download":"Descargar","Download PDF":"Descargar PDF","Save":"Guardar","Cancel":"Cancelar",
    "Close":"Cerrar","Close document":"Cerrar documento","Delete":"Eliminar",
    "Duplicate":"Duplicar","Duplicate pages":"Duplicar páginas",
    "Delete pages":"Eliminar páginas","Delete selected pages":"Eliminar páginas seleccionadas",
    "Add signature":"Agregar firma","Place image or stamp":"Colocar imagen o sello",
    "Print document":"Imprimir documento","Print":"Imprimir","Page":"Página","Pages":"Páginas",
    "Page range":"Rango de páginas","All pages":"Todas las páginas",
    "Selected pages":"Páginas seleccionadas","Selection":"Selección","Properties":"Propiedades",
    "Size":"Tamaño","Width":"Ancho","Height":"Alto","Color":"Color","Opacity":"Opacidad",
    "Position":"Posición","Font":"Fuente","Font size":"Tamaño de fuente","Rotation":"Rotación",
    "Zoom":"Zoom","Fit width":"Ajustar al ancho","Fit page":"Ajustar página",
    "Search":"Buscar","Search tools":"Buscar herramientas","Tools":"Herramientas",
    "Settings":"Configuración","Help":"Ayuda","About":"Acerca de",
    "Privacy":"Privacidad","Private":"Privado","Free":"Gratis",
    "Auto":"Automático","Light":"Claro","Dark":"Oscuro","System":"Sistema",
    "Theme":"Tema","Appearance":"Apariencia",
    "Loading":"Cargando","Loading…":"Cargando…","Loading tool…":"Cargando herramienta…",
    "Processing":"Procesando","Processing…":"Procesando…","Done":"Terminado",
    "Success":"Éxito","Error":"Error","Warning":"Advertencia",
    "File name":"Nombre de archivo","File size":"Tamaño del archivo",
    "Files":"Archivos","Documents":"Documentos","Document":"Documento",
    "Add files":"Agregar archivos","Add more files":"Agregar más archivos",
    "Try again":"Intentar de nuevo","Start over":"Empezar de nuevo",
    "Reset":"Restablecer","Clear":"Limpiar","Remove":"Quitar",
    "Apply":"Aplicar","Continue":"Continuar","Back":"Volver","Next":"Siguiente",
    "Previous":"Anterior","Step 1":"Paso 1","Step 2":"Paso 2","Step 3":"Paso 3",
    "Original size":"Tamaño original","Compressed size":"Tamaño comprimido",
    "Estimated size":"Tamaño estimado","Compression level":"Nivel de compresión",
    "Low":"Baja","Medium":"Media","High":"Alta","Quality":"Calidad",
    "Image quality":"Calidad de imagen","Lossless":"Sin pérdida",
    "Optimize":"Optimizar","Optimize PDF":"Optimizar PDF","Advanced":"Avanzado",
    "Advanced options":"Opciones avanzadas",
    "Fast":"Rápido","Balanced":"Equilibrado","Maximum":"Máximo",
    "Merge files":"Unir archivos","Combine PDFs":"Combinar PDF",
    "PDF files":"Archivos PDF","Select files":"Seleccionar archivos",
    "Upload":"Subir","Upload files":"Cargar archivos",
    "No files selected":"No hay archivos seleccionados",
    "No file selected":"Ningún archivo seleccionado",
    "Your files never leave your device. All processing happens in the browser.":"Tus archivos nunca salen de tu dispositivo. Todo se procesa en el navegador.",
    "All processing happens locally in your browser":"Todo el procesamiento ocurre localmente en tu navegador",
    "100% local":"100 % local",
    "Select a PDF to compress":"Selecciona un PDF para comprimir",
    "Merge, split, compress, convert, rotate, and OCR your PDFs without uploading anything.":"Une, divide, comprime, convierte, gira y reconoce texto de tus PDF sin subirlos.",
    "Private PDF tools that run entirely in your browser":"Herramientas PDF privadas que funcionan completamente en el navegador",
    "100% client-side · no uploads · no servers · no analytics.":"100 % en el navegador · sin subidas · sin servidores · sin analíticas.",
    "Open source (MIT)":"Código abierto (MIT)",
    "Source on GitHub":"Código fuente en GitHub","Open source":"Código abierto",
    "Imprint":"Aviso legal","by J.G.Moore":"por J.G.Moore",
    "Drop PDFs to open them — each file becomes its own tab":"Suelta los PDF para abrirlos: cada archivo tendrá su pestaña.",
    "Keyboard shortcuts":"Atajos de teclado",
    "Select PDF files to merge":"Seleccionar archivos PDF para unir",
    "Merge PDF files":"Unir archivos PDF",
    "Combine multiple PDFs into a single file. Drag to reorder before merging.":"Combina varios PDF en un único archivo. Arrastra para ordenarlos antes de unirlos.",
    "Cannot delete every page":"No puedes eliminar todas las páginas",
    "Blank page added.":"Página en blanco añadida.",
    "Something went wrong.":"Se produjo un error.",
    "ZIP download started.":"Descarga ZIP iniciada.",
    "PDF download started.":"Descarga del PDF iniciada.",
    "Image placed — drag it into position.":"Imagen colocada. Arrástrala hasta la posición deseada.",
    "Could not create a blank document.":"No se pudo crear un documento en blanco.",
    "Not found":"No encontrado","Coming soon":"Próximamente",
    "Switch between automatic, light, and dark theme":"Cambiar entre tema automático, claro y oscuro",
    "Select a PDF file":"Seleccionar un archivo PDF",
    "Please drop a PDF file.":"Suelta un archivo PDF.",
    "Failed to read file. Please try again.":"No se pudo leer el archivo. Inténtalo de nuevo.",
    "Select a PDF":"Seleccionar un PDF","Analyze PDF":"Analizar PDF",
    "Analyzing":"Analizando","Analyze":"Analizar","Preview":"Vista previa",
    "Download compressed PDF":"Descargar PDF comprimido","Download result":"Descargar resultado",
    "Selected":"Seleccionado","Original":"Original","Result":"Resultado",
    "Protected":"Protegido","Password":"Contraseña","Protect PDF":"Proteger PDF",
    "Unlock PDF":"Desbloquear PDF","Add password":"Agregar contraseña",
    "Confirm password":"Confirmar contraseña","Show password":"Mostrar contraseña",
    "Encrypt PDF":"Cifrar PDF","Decrypt PDF":"Descifrar PDF",
    "Split by page":"Dividir por página","Add pages":"Añadir páginas",
    "Create PDF":"Crear PDF","Extract pages":"Extraer páginas",
    "Rotate pages":"Girar páginas","Compress images":"Comprimir imágenes",
    "Drag to reorder":"Arrastra para reordenar","Move up":"Subir","Move down":"Bajar",
    "Remove file":"Eliminar archivo","Add PDF":"Añadir PDF",
    "How it works":"Cómo funciona","Frequently asked questions":"Preguntas frecuentes",
    "All tools":"Todas las herramientas","Home":"Inicio","Language":"Idioma"
  };
  const attrs=["placeholder","title","aria-label","alt"];
  const priority=Object.entries(entries).sort((a,b)=>b[0].length-a[0].length);
  const exact=new Map(priority);
  function translate(value){
    const v=String(value);
    if(exact.has(v))return exact.get(v);
    const trim=v.trim();
    if(exact.has(trim))return v.slice(0,v.indexOf(trim))+exact.get(trim)+v.slice(v.indexOf(trim)+trim.length);
    let result=v;
    const patterns=[
      [/^Opened (\d+) documents?\.$/,"Se abrieron $1 documentos."],
      [/^Merged (\d+) pages? from (\d+) files?\.$/,"Se unieron $1 páginas de $2 archivos."],
      [/^Export selection \((\d+)\)$/,"Exportar selección ($1)"],
      [/^Page (\d+) of (\d+)$/,"Página $1 de $2"],
      [/^(\d+) pages?$/,"$1 páginas"],
      [/^(\d+) files?$/,"$1 archivos"],
      [/^Close “(.+)”\? Unsaved edits are discarded; imported files stay available under “Recent”.$/,"¿Cerrar «$1»? Se perderán los cambios no guardados; los archivos importados seguirán en «Recientes»."]
    ];
    for(const [re,repl] of patterns)if(re.test(result))return result.replace(re,repl);
    return result;
  }
  function translateTree(root){
    if(!root||root.nodeType!==1)return;
    const scanElement=el=>{
      if(el.matches?.("script,style,textarea,code,pre,.textLayer,.text-layer,.pdf-text-layer,.pageText,.ProseMirror,[contenteditable='true']"))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    };
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(node){
      if(node.nodeType===1)return scanElement(node);
      return node.parentElement?.closest("script,style,textarea,code,pre,.textLayer,.text-layer,.pdf-text-layer,.pageText,.ProseMirror,[contenteditable='true']")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
    }});
    const elements=[],nodes=[];
    if(root.nodeType===1)elements.push(root);
    while(walker.nextNode()){
      if(walker.currentNode.nodeType===1)elements.push(walker.currentNode);
      else nodes.push(walker.currentNode);
    }
    for(const node of nodes){
      const t=translate(node.nodeValue);
      if(t!==node.nodeValue)node.nodeValue=t;
    }
    for(const el of elements){
      for(const attr of attrs){
        if(!el.hasAttribute(attr))continue;
        const original=el.getAttribute(attr);
        const translated=translate(original);
        if(original!==translated)el.setAttribute(attr,translated);
      }
      if(el instanceof HTMLInputElement&&["button","submit","reset"].includes(el.type)){
        const result=translate(el.value);if(result!==el.value)el.value=result;
      }
    }
  }
  let scheduled=false;
  function update(){
    scheduled=false;
    if(document.body)translateTree(document.body);
  }
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(update);
  });
  const init=()=>{
    update();
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrs});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
