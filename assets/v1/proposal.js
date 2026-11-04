(()=>{
const root=document.getElementById('grafiplot-preview'),$=s=>root.querySelector(s);
const hero=$('#gp-home'),trust=$('.gp-trust'),campaign=$('#gp-campaign-banner'),services=$('#gp-services'),quote=$('#gp-quote'),catalog=$('#gp-catalog'),delivery=$('#gp-delivery-access'),gallery=$('#gp-gallery');
trust.after(campaign);campaign.after(services);services.after(quote);quote.after(catalog);catalog.after(delivery);delivery.after(gallery);
const title=hero.querySelector('h1');title.textContent='Tus ideas merecen una gran impresión.';
const tools=document.createElement('div');tools.className='gp-catalog-tools';const query=document.createElement('input');query.type='search';query.placeholder='Buscar útiles e insumos…';query.setAttribute('aria-label','Buscar en el catálogo');const category=document.createElement('select');category.setAttribute('aria-label','Categoría de producto');tools.append(query,category);catalog.querySelector('.gp-products').before(tools);
function filter(){const q=query.value.toLocaleLowerCase('es');catalog.querySelectorAll('.gp-product').forEach(card=>{card.hidden=!(card.textContent.toLocaleLowerCase('es').includes(q)&&(!category.value||card.dataset.category===category.value))})}
function categories(){const previous=category.value;category.replaceChildren(new Option('Todas las categorías',''));new Set([...catalog.querySelectorAll('.gp-product')].map(c=>c.dataset.category)).forEach(c=>category.add(new Option(c,c)));category.value=previous;filter()}
query.oninput=filter;category.onchange=filter;window.addEventListener('gp-catalog-rendered',categories);categories();
delivery.innerHTML='<h2>Consulta el estado de tu delivery</h2><p>Sigue el avance de tu pedido desde aquí.</p><div class="gp-delivery-grid"><form><label>Tu enlace privado o código de seguimiento<input name="tracking" required autocomplete="off" placeholder="Pega el enlace que te enviamos"></label><button class="gp-button" type="submit">Consultar pedido</button><p class="gp-track-error" role="status"></p><a href="./delivery.html">Ingresar con mi usuario y contraseña</a></form><div class="gp-delivery-info"><h3>Del local hasta tus manos</h3><ol class="gp-status-steps"><li>Recibido</li><li>En proceso</li><li>Listo</li><li>En camino</li><li>Entregado</li></ol><p>Abre tu seguimiento para ver el estado real, los detalles y la hora estimada de entrega.</p><a class="gp-button secondary" href="https://wa.me/51916133647" target="_blank" rel="noopener noreferrer">Consultar mi entrega · 916 133 647</a></div></div>';
delivery.querySelector('form').onsubmit=e=>{e.preventDefault();let token=e.target.elements.tracking.value.trim();try{if(token.includes('://'))token=new URL(token).hash.slice(1);if(!/^[a-f0-9]{64}$/.test(token))throw Error();location.assign('./delivery-track.html#'+token)}catch{delivery.querySelector('.gp-track-error').textContent='Pega el enlace completo recibido por WhatsApp o ingresa con tu usuario.'}};
const nav=$('.gp-nav');const promo=document.createElement('button');promo.textContent='Promociones';promo.onclick=()=>{if(campaign.hidden)window.open('https://wa.me/51952628844?text=Quiero%20consultar%20las%20promociones','_blank','noopener');else campaign.scrollIntoView({behavior:'smooth'})};nav.append(promo);
})();

(()=>{
const root=document.getElementById('grafiplot-preview'),$=s=>root.querySelector(s);
// Keep existing controls and IDs so quotation, owner editing and cart retain their behavior.
const nav=$('.gp-nav'),header=$('.gp-header'),actions=$('.gp-header-actions');
const subnav=document.createElement('nav');subnav.className='gp-shop-nav gp-wrap';subnav.setAttribute('aria-label','Compras y entregas');
const catalogButton=[...nav.querySelectorAll('button')].find(b=>b.textContent==='Útiles e insumos');
subnav.append(catalogButton,nav.querySelector('a[href="./delivery.html"]'),$('#gp-cart-nav'));header.after(subnav);
nav.querySelector('[data-go="gp-home"]').hidden=true;nav.querySelector('[data-go="gp-catalog"]').hidden=true;
nav.querySelector('[data-go="gp-gallery"]').textContent='Trabajos';
nav.querySelectorAll('[data-order-page]').forEach(b=>{b.classList.add('gp-order-shortcut');subnav.append(b)});
const quoteNav=document.createElement('button');quoteNav.dataset.go='gp-quote';quoteNav.textContent='Cotizar';nav.querySelector('[data-go="gp-location"]').before(quoteNav);
const promo=[...nav.querySelectorAll('button')].find(b=>b.textContent==='Promociones');promo.className='gp-promo-nav';actions.prepend(promo);
actions.querySelector('[data-go="gp-quote"]').hidden=true;actions.querySelector('.gp-header-whatsapp span').textContent='WhatsApp';
const hero=$('#gp-home');hero.querySelector('.gp-intro').textContent='Impresiones, planos y publicidad para estudiantes, profesionales y negocios.';
hero.querySelector('[data-go="gp-quote"]').textContent='Cotizar mi trabajo';const explore=hero.querySelector('[data-go="gp-services"]');explore.textContent='Ver nuestros trabajos';explore.dataset.go='gp-gallery';
$('.gp-trust').lastElementChild.hidden=true;
const quote=$('#gp-quote'),form=quote.querySelector('.gp-form'),fields=form.querySelector('.gp-fields');
quote.querySelector('h2').innerHTML='Cotiza fácil.<br><span>Decide mejor.</span>';
quote.querySelector('p').textContent='Cuéntanos las características de tu impresión y te orientamos de inmediato por WhatsApp, con la mejor opción para tu trabajo.';
const steps=document.createElement('ol');steps.className='gp-quote-steps';steps.setAttribute('aria-label','Pasos para cotizar');
['Páginas y juegos','Formato','Color y acabado'].forEach((label,i)=>{const li=document.createElement('li');li.innerHTML='<b>'+(i+1)+'</b>';li.append(document.createTextNode(label));steps.append(li)});form.prepend(steps);
$('#gp-pages').parentElement.firstChild.textContent='Páginas';$('#gp-copies').parentElement.firstChild.textContent='Juegos';$('#gp-color').parentElement.firstChild.textContent='Color';
const advanced=document.createElement('details');advanced.className='gp-quote-advanced';const summary=document.createElement('summary');summary.textContent='Acabados y opciones adicionales';advanced.append(summary);const extras=document.createElement('div');extras.className='gp-fields gp-extra-fields';advanced.append(extras);
[...fields.children].slice(4).forEach(label=>extras.append(label));fields.after(advanced);
const bottom=document.createElement('div');bottom.className='gp-quote-bottom';const price=form.querySelector('.gp-total-box');bottom.append(price,$('#gp-send'));form.append(bottom);const hint=document.createElement('span');hint.className='gp-price-label';hint.textContent='Precio según tus opciones';price.firstChild.replaceWith(hint);
fields.addEventListener('focusin',e=>{const n=e.target.id==='gp-format'?1:e.target.id==='gp-color'?2:0;[...steps.children].forEach((li,i)=>{li.classList.toggle('active',i===n);if(i===n)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')})});steps.firstChild.classList.add('active');
const catalog=$('#gp-catalog'),grid=catalog.querySelector('.gp-products'),query=catalog.querySelector('input[type=search]'),select=catalog.querySelector('.gp-catalog-tools select');
const pills=document.createElement('div');pills.className='gp-category-pills';pills.setAttribute('aria-label','Filtrar productos');select.after(pills);select.hidden=true;
let expanded=false;const more=$('#gp-more');more.textContent='Ver catálogo completo';
function filterProducts(){let count=0;const q=query.value.toLocaleLowerCase('es');grid.querySelectorAll('.gp-product').forEach(card=>{const match=card.textContent.toLocaleLowerCase('es').includes(q)&&(!select.value||card.dataset.category===select.value);card.hidden=!match||(!expanded&&!q&&!select.value&&count>=4);if(match)count++});more.textContent=expanded?'Ver menos productos':'Ver catálogo completo';}
function rebuildPills(){pills.replaceChildren();[...select.options].forEach(option=>{const b=document.createElement('button');b.type='button';b.textContent=option.value||'Todos';b.className='gp-category-pill';b.setAttribute('aria-pressed',String(select.value===option.value));b.onclick=()=>{select.value=option.value;rebuildPills();filterProducts()};pills.append(b)});filterProducts()}
query.addEventListener('input',filterProducts);more.addEventListener('click',()=>{expanded=!expanded;filterProducts()});window.addEventListener('gp-catalog-rendered',rebuildPills);rebuildPills();
const cartbar=document.createElement('div');cartbar.className='gp-catalog-cartbar';cartbar.innerHTML='<span>Revisa tus productos y confirma tu pedido por WhatsApp.</span><button class="gp-button gp-whatsapp" data-go="gp-cart">Ver mi carrito</button>';catalog.append(cartbar);
// The announcement mirrors only an enabled campaign with a configured destination.
const campaign=$('#gp-campaign-banner');const toast=document.createElement('aside');toast.className='gp-promo-toast';toast.hidden=true;toast.setAttribute('aria-label','Promoción activa');toast.innerHTML='<button type="button" class="gp-promo-close" aria-label="Cerrar promoción">×</button><span class="gp-promo-tag">PROMOCIÓN</span><h2></h2><p>Consulta los detalles y condiciones.</p><a class="gp-button" target="_blank" rel="noopener noreferrer">Ver oferta</a>';hero.append(toast);
let dismissed='';toast.querySelector('button').onclick=()=>{dismissed=$('#gp-campaign-title').textContent;toast.hidden=true};
function syncPromo(){const title=$('#gp-campaign-title').textContent;toast.hidden=campaign.hidden||title===dismissed;toast.querySelector('h2').textContent=title;toast.querySelector('a').href=$('#gp-campaign-link').href;toast.querySelector('.gp-promo-tag').textContent=$('#gp-campaign-tag').textContent;}
new MutationObserver(syncPromo).observe(campaign,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','href']});syncPromo();
})();
