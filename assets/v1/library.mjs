// Only embeddable Google Drive file links are accepted; folder links are not books.
export function driveFile(value){
 let url;try{url=new URL(value)}catch{return null}
 if(url.protocol!=='https:'||url.hostname!=='drive.google.com')return null;
 const id=url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||((url.pathname==='/open'||url.pathname==='/uc')?url.searchParams.get('id'):null);
 if(!id||!/^[-\w]{10,200}$/.test(id))return null;
 const resource=url.searchParams.get('resourcekey');const suffix=resource?'?resourcekey='+encodeURIComponent(resource):'';
 return {id,url:'https://drive.google.com/file/d/'+id+'/view'+suffix,preview:'https://drive.google.com/file/d/'+id+'/preview'+suffix};
}
export function parseBooks(text){
 const books=[],seen=new Set();
 for(const [i,line] of String(text||'').split(/\r?\n/).entries()){
  if(!line.trim())continue;
  const parts=line.split('|').map(v=>v.trim()),link=parts.find(v=>v.startsWith('https://')),file=driveFile(link);
  if(!file)throw Error('Biblioteca: revisa la línea '+(i+1)+'. Usa el enlace de un archivo de Google Drive, no una carpeta.');
  if(seen.has(file.id))continue;seen.add(file.id);
  const meta=parts.filter(v=>v!==link);let cover='';if(meta[3]){try{const u=new URL(meta[3]);if(u.protocol!=='https:')throw Error();cover=u.href}catch{throw Error('Biblioteca: la portada de la línea '+(i+1)+' necesita un enlace HTTPS.')}}
  books.push({...file,title:(meta[0]||'Libro '+(books.length+1)).slice(0,180),author:(meta[1]||'').slice(0,120),category:(meta[2]||'Otros').slice(0,70),cover});
  if(books.length>500)throw Error('Biblioteca: añade como máximo 500 libros.');
 }
 return books;
}
export function initLibrary(root){
 const document=root.ownerDocument;
 const section=root.querySelector('#gp-library'),input=root.querySelector('#gp-library-links'),grid=section.querySelector('.gp-book-grid'),filters=section.querySelector('.gp-book-filters'),query=section.querySelector('input[type="search"]'),dialog=root.querySelector('#gp-book-reader');let books=[],category='Todos',previousFocus;
 const normalize=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 function open(book,button){previousFocus=button;dialog.querySelector('h2').textContent=book.title;dialog.querySelector('iframe').src=book.preview;dialog.showModal();document.body.classList.add('gp-reading');}
 function render(){grid.replaceChildren();const found=books.filter(b=>(category==='Todos'||b.category===category)&&normalize(b.title+' '+b.author+' '+b.category).includes(normalize(query.value.trim())));section.querySelector('.gp-book-count').textContent=found.length+' '+(found.length===1?'libro':'libros');
 for(const book of found){const card=make('article',null,'gp-book-card'),cover=make('div',null,'gp-book-cover');if(book.cover){const img=make('img');img.src=book.cover;img.alt='Portada de '+book.title;img.loading='lazy';img.onerror=()=>{img.remove();cover.textContent=book.title};cover.append(img)}else{cover.append(make('span','GRAFIPLOT'),make('strong',book.title),make('small',book.author||'Biblioteca digital'))}const content=make('div',null,'gp-book-copy'),button=make('button','Leer ahora','gp-button');button.type='button';button.onclick=()=>open(book,button);content.append(make('small',book.category),make('h3',book.title),make('p',book.author),button);card.append(cover,content);grid.append(card)}
 if(!found.length)grid.append(make('p',books.length?'No encontramos libros con esa búsqueda. Prueba otro título o categoría.':'La biblioteca está preparando sus primeras lecturas. Pronto encontrarás libros aquí.','gp-library-empty'));
 }
 function pills(){filters.replaceChildren();for(const name of ['Todos',...new Set(books.map(b=>b.category))]){const b=make('button',name);b.type='button';b.setAttribute('aria-pressed',String(name===category));b.onclick=()=>{category=name;pills();render()};filters.append(b)}}
 section.querySelector('form').onsubmit=e=>{e.preventDefault();render()};query.oninput=render;
 dialog.querySelector('[data-reader-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.querySelector('iframe').src='about:blank';document.body.classList.remove('gp-reading');previousFocus?.focus()});
 dialog.querySelector('[data-reader-full]').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await dialog.requestFullscreen()}catch{dialog.querySelector('[role="status"]').textContent='El visor ya ocupa casi toda la pantalla.'}};
 if(globalThis.location?.hash==='#gp-library')setTimeout(()=>section.scrollIntoView(),0);
 return {load(text=''){input.value=text;try{books=parseBooks(text)}catch{books=[]}category='Todos';pills();render()},value(){const text=input.value.trim();parseBooks(text);return text}};
}
