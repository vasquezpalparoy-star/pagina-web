// Public catalog only. Prices and stock always come from the current page context.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/asul/g,'azul').replace(/embaleje/g,'embalaje').replace(/boligrafos?/g,'lapicero').replace(/[^a-z0-9 ]/g,' ').trim();
const stop=new Set('que cuanto cuesta cuestan precio precios presio presios cotizar cotizacion cotisar cotisacion consulta como es sirve funciona cual descripcion explicar explicame tienen tienes hay venden quiero necesito dame de del la el los las un una unos unas por mayor menor me para y en con vale valen unidades unidad productos producto util utiles insumo insumos'.split(' '));
const words=s=>norm(s).split(/\s+/).map(w=>w.length>4?w.replace(/s$/,''):w).filter(w=>w&&!stop.has(w)&&!/^\d+$/.test(w));
const safeImage=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:''}catch{return ''}};
// Generic color, quantity and sheet words are not product names.
const qualifiers=new Set('azul rojo negro blanca blanco negra verde amarillo amarilla colores color hoja pagina hojas paginas fisica fisicas cara caras a0 a1 a2 a3 a4 a5 a6 a7 grande pequeno pequena nuevo nueva unidad unidades'.split(' '));
const identity=s=>words(s).filter(w=>!qualifiers.has(w));
export function productNamed(message,product){const query=new Set(identity(message));return identity(product.name).some(w=>query.has(w))}
const money=n=>'S/ '+Number(n).toFixed(2);
export function publicProducts(items=[]){return items.filter(p=>p&&!p.isService&&p.isActive!==false&&p.name).map(p=>({id:String(p.id),name:String(p.name).slice(0,180),description:String(p.description||'').slice(0,500),category:String(p.category||''),image:safeImage(p.image),price:Number(p.price)>0?Number(p.price):null,bulkPrice:Number(p.bulkPrice)>0?Number(p.bulkPrice):null,stock:Number.isFinite(Number(p.stock))?Math.max(0,Math.floor(Number(p.stock))):null,unit:String(p.measureUnit||'unidades')}));}
export function productAnswer(products,quantity,confirmed=true){
 if(!products.length)return null;
 const lines=products.slice(0,6).map(p=>p.name+': '+(p.price?money(p.price)+' c/u':'precio por confirmar')+(p.bulkPrice&&p.bulkPrice!==p.price?' · Por mayor: '+money(p.bulkPrice)+' (mínimo a confirmar)':'')+' · '+(!confirmed?'disponibilidad por confirmar':p.stock===null?'stock por confirmar':p.stock>0?p.stock+' '+p.unit+' en stock':'sin stock'));
 const result={answer:lines.join('\n'),state:undefined};
 if(products.length>1){result.answer+='\n¿Cuál de estos productos necesitas?';return result;}
 const p=products[0];
 if(p.description)result.answer+='\n'+p.description;
 if(p.image)result.image={url:p.image,alt:p.name};
 result.actions=[{label:'Ver catálogo',href:'./index.html#gp-catalog'}];
 if(quantity!==undefined){if(!Number.isSafeInteger(quantity)||quantity<1||quantity>10000)return {...result,answer:result.answer+'\nIndica una cantidad entera entre 1 y 10000.'};
 if(confirmed&&p.stock!==null&&quantity>p.stock)return {...result,answer:result.answer+'\nLa cantidad solicitada supera el stock registrado. Consulta reposición por WhatsApp.',handoff:true};
 if(p.price)result.quote={total:Math.round(p.price*quantity*100)/100,items:[{name:p.name,qty:quantity,unit:p.unit,price:p.price}],notes:'Precio por menor del catálogo. El mínimo por mayor debe confirmarse. Disponibilidad y pedido sujetos a confirmación; no incluye delivery.'};}
 return result;
}
export function productReply(text,context){
 const n=norm(text),catalog=context.products||[];
 if(/^(catalogo|ver catalogo|utiles|utiles e insumos|productos|que productos tienen|que utiles tienen|insumos)$/.test(n))return productAnswer(catalog,undefined,context.catalogConfirmed)||{answer:'El catálogo todavía no está disponible. Consulta productos por WhatsApp.',handoff:true,state:undefined};
 const query=words(text);if(!query.length)return null;
 const ranked=catalog.map(p=>{const title=words(p.name),all=words(p.name+' '+p.description);const hits=query.filter(w=>all.includes(w));return {p,hits:hits.length,title:query.filter(w=>title.includes(w)).length,score:hits.length/query.length};}).filter(r=>r.title>0&&r.score>=0.6&&productNamed(text,r.p)).sort((a,b)=>b.score-a.score||b.title-a.title);
 if(!ranked.length)return null;
 const best=ranked.filter(r=>r.score===ranked[0].score&&r.title===ranked[0].title).map(r=>r.p);
 if(/-\s*\d|\d+[.,]\d+/.test(String(text)))return {answer:'Indica una cantidad entera positiva, sin decimales ni separadores de miles.',state:undefined};
 const qty=n.match(/(?:^|\s)(\d+)(?=\s|$)/);return productAnswer(best,qty?Number(qty[1]):undefined,context.catalogConfirmed);
}
