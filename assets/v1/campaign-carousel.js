(()=>{'use strict';
const section=document.querySelector('#gp-campaign-banner');if(!section)return;
let timer=null,current=0,slides=[],visible=true;
const stage=document.createElement('div');stage.className='gp-ad-stage';
const navigation=document.createElement('div');navigation.className='gp-ad-controls';
const prev=document.createElement('button'),next=document.createElement('button');
prev.type=next.type='button';prev.className=next.className='gp-ad-arrow';
prev.setAttribute('aria-label','Promoción anterior');next.setAttribute('aria-label','Siguiente promoción');prev.textContent='‹';next.textContent='›';
navigation.append(prev,next);
const dots=document.createElement('div');dots.className='gp-ad-dots';
stage.append(navigation,dots);section.append(stage);section.classList.add('gp-ad-carousel-ready');
const cleanUrl=value=>{try{const u=new URL(value,location.href);return u.protocol==='https:'||u.protocol==='http:'&&u.hostname==='localhost'?u.href:''}catch{return ''}};
const safeSlides=config=>{
 if(config?.campaignEnabled!==true)return [];
 const primary={title:String(config.campaignTitle||'Promoción GRAFIPLOT').slice(0,100),description:String(config.campaignDescription||'').slice(0,200),button:String(config.campaignButton||'Ver promoción').slice(0,45),url:cleanUrl(config.campaignUrl),image:cleanUrl(config.pageImages?.campaign||''),type:config.campaignType};
 const additional=Array.isArray(config.campaignSlides)?config.campaignSlides.slice(0,9).map(s=>({title:String(s?.title||'').slice(0,100),description:String(s?.description||'').slice(0,200),button:'Ver promoción',url:cleanUrl(s?.url),image:cleanUrl(s?.image),type:'promo'})).filter(s=>s.title&&s.url):[];
 return [primary,...additional].filter(s=>s.title&&s.url);
};
function stop(){if(timer!==null)clearInterval(timer);timer=null}
function show(i){
 if(!slides.length)return;current=(i+slides.length)%slides.length;
 for(const [n,el] of [...stage.querySelectorAll('.gp-ad-slide')].entries()){el.setAttribute('aria-hidden',String(n!==current));el.querySelector('a').tabIndex=n===current?0:-1}
 for(const [n,b] of [...dots.children].entries())b.setAttribute('aria-current',String(n===current));
}
function start(){stop();if(slides.length>1&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(current+1),5500)}
function render(config){
 stop();slides=safeSlides(config);section.hidden=!slides.length;
 stage.querySelectorAll('.gp-ad-slide').forEach(el=>el.remove());dots.replaceChildren();
 if(!slides.length)return;
 stage.classList.toggle('gp-ad-single',slides.length===1);
 for(const [i,slide] of slides.entries()){
  const art=document.createElement('article');art.className='gp-ad-slide';art.setAttribute('aria-hidden','true');
  if(slide.image){const img=document.createElement('img');img.className='gp-ad-bg';img.src=slide.image;img.alt='';img.loading='lazy';art.append(img)}
  const copy=document.createElement('div');copy.className='gp-ad-copy';
  const label=document.createElement('span');label.className='gp-ad-label';label.textContent=slide.type==='sorteo'?'SORTEO ESPECIAL':'PROMOCIÓN';copy.append(label);
  const h=document.createElement('h2');h.textContent=slide.title;copy.append(h);
  if(slide.description){const p=document.createElement('p');p.textContent=slide.description;copy.append(p)}
  const cta=document.createElement('a');cta.className='gp-ad-cta';cta.href=slide.url;cta.target='_blank';cta.rel='noopener noreferrer';cta.textContent=slide.button+' ↗';copy.append(cta);art.append(copy);stage.insertBefore(art,navigation);
  if(slides.length>1){const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label','Ver promoción '+(i+1));dot.onclick=()=>{show(i);start()};dots.append(dot)}
 }
 show(0);start();
}
prev.onclick=()=>{show(current-1);start()};next.onclick=()=>{show(current+1);start()};
stage.addEventListener('mouseenter',stop);stage.addEventListener('mouseleave',start);
stage.addEventListener('focusin',stop);stage.addEventListener('focusout',e=>{if(!stage.contains(e.relatedTarget))start()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
window.addEventListener('gp-campaign-change',e=>render(e.detail||{}));
})();