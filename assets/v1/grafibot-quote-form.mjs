
import {PREVIEW_FORMATS} from './cotizador.js?v=wholesale1';
const FORMATS=PREVIEW_FORMATS;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
function select(options,value){const n=el('select');for(const [id,label] of options){const o=el('option','',label);o.value=id;n.append(o)}if(options.some(([id])=>id===value))n.value=value;return n}
function field(label,input){const n=el('label','gb-qf-field');n.append(el('span','',label),input);return n}
const integer=(min,max,value)=>{const n=el('input');n.type='number';n.min=String(min);n.max=String(max);n.step='1';n.required=true;n.inputMode='numeric';if(Number.isSafeInteger(value)&&value>=min&&value<=max)n.value=String(value);return n};
const check=(label,value)=>{const n=el('input');n.type='checkbox';n.checked=value===true;const wrap=el('label','gb-qf-check');wrap.append(n,document.createTextNode(label));return [n,wrap]};
export function quoteForm(parent,initial,context,onSubmit){
 const q=initial||{},services=(context.quoteServices||[]).filter(s=>s&&Array.isArray(s.formats)&&s.formats.length);
 const form=el('form','gb-quote-form');form.setAttribute('aria-label','Cotizador dentro del chat');
 form.append(el('h4','gb-qf-title','▤ Cotizador de GRAFIPLOT'));
 const grid=el('div','gb-qf-grid');form.append(grid);
 const options=[['print','Impresiones / Copias'],['plans','Impresión de planos'],['book','Folleto / Cuadernillo A5'],['multi','2 páginas por cara'],...services.map(s=>['custom:'+s.id,s.name])];
 const initialType=q.serviceId?'custom:'+q.serviceId:q.service==='escaneo'?'custom:'+((services.find(s=>/escan/i.test(s.name))||{}).id||''):q.format==='Folleto'?'book':q.format?.startsWith('2xCara')?'multi':q.service==='planos'||q.format?.startsWith('Plano_')?'plans':'print';
 const type=select(options,initialType),size=select([]),sides=select([['','Seleccionar'],['1','Una cara'],['2','Ambas caras']],q.sides?String(q.sides):q.format?.endsWith('_2c')?'2':q.format?.endsWith('_1c')?'1':'');
 const color=select([['','Seleccionar'],['bn','Blanco y negro'],['color','A color']],q.color);
 const unit=select([['paginas','Páginas del archivo'],['hojas','Hojas físicas']],q.unit||'paginas');
 const qty=integer(1,100000,q.quantity),copies=integer(1,1000,q.copies||1);
 const [binding,bindingLabel]=check('Con anillado',q.binding),[design,designLabel]=check('Diseño gráfico',q.design),[urgent,urgentLabel]=check('Urgente',q.urgent);
 const extra=select([['none','Sin acabado adicional'],['laminate','Plastificado / laminado'],['binding','Empastado'],['cut','Corte / guillotina']],q.extra||'none');
 const sizeField=field('Formato',size),sidesField=field('Caras',sides),colorField=field('Impresión',color),unitField=field('Cantidad expresada en',unit),qtyField=field('Cantidad',qty),copiesField=field('Juegos / ejemplares',copies),extraField=field('Acabado adicional',extra);
 grid.append(field('Tipo de servicio',type),sizeField,colorField,sidesField,unitField,qtyField,copiesField,extraField);
 const checks=el('div','gb-qf-checks');checks.append(bindingLabel,designLabel,urgentLabel);form.append(checks);
 const note=el('p','gb-qf-note','Los precios por mayor o menor se aplican automáticamente según los rangos de la página.');
 const submit=el('button','gb-qf-submit','Calcular cotización');submit.type='submit';
 const status=el('p','gb-qf-status','');status.setAttribute('role','status');form.append(note,submit,status);
 function refresh(first=false){
  const kind=type.value,service=services.find(s=>'custom:'+s.id===kind),previous=size.value;
  const opts=service?service.formats.map(f=>[f.id,f.label]):kind==='plans'?FORMATS.filter(f=>f.id.startsWith('Plano_')).map(f=>[f.id.slice(6),f.label]):kind==='book'?[['A5','A5 (A4 doblado)']]:kind==='multi'?[['A4','A4']]:FORMATS.filter(f=>/^A[1-7]_1c$/.test(f.id)).map(f=>[f.id.slice(0,2),f.id.slice(0,2)]);
  size.replaceChildren(...opts.map(([id,label])=>{const o=el('option','',label);o.value=id;return o}));
  const suggested=first?(service?q.serviceFormat:q.size||q.format?.match(/(?:Plano_)?(A[0-7])/)?.[1]||'A4'):previous;
  if(opts.some(([id])=>id===suggested))size.value=suggested;else if(opts.some(([id])=>id==='A4'))size.value='A4';
  sidesField.hidden=!!service||kind==='plans'||kind==='book';
  colorField.hidden=unitField.hidden=copiesField.hidden=extraField.hidden=checks.hidden=!!service;
  qty.max=service?'1000000':'100000';qtyField.firstElementChild.textContent=service?'Cantidad ('+service.unit+')':'Cantidad';
  sides.required=!sidesField.hidden;color.required=!colorField.hidden;copies.required=!copiesField.hidden;
  note.textContent=kind==='book'?'Folleto A5: cuatro páginas del archivo por hoja A4 doblada. Los rangos se calculan por hojas físicas.':kind==='plans'?'Planos: una cara por hoja. Se aplica el rango de precios configurado.':'Los precios se calculan con las tarifas y rangos vigentes de GRAFIPLOT.';
 }
 type.addEventListener('change',()=>refresh());refresh(true);
 form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.checkValidity()){form.reportValidity();return}
  const service=services.find(s=>'custom:'+s.id===type.value),quantity=Number(qty.value);
  let input,label;
  if(service){input={serviceId:service.id,serviceFormat:size.value,quantity};label=service.name+' · '+(service.formats.find(f=>f.id===size.value)?.label||'')+' · '+quantity+' '+service.unit;}
  else {
   const kind=type.value,format=kind==='book'?'Folleto':kind==='plans'?'Plano_'+size.value:kind==='multi'?'2xCara_'+sides.value+'c':size.value+'_'+sides.value+'c';
   if(!FORMATS.some(f=>f.id===format)){status.textContent='Selecciona un formato disponible y las caras.';return}
   input={service:kind==='plans'?'planos':'impresion',format,color:color.value,quantity,unit:unit.value,copies:Number(copies.value),binding:binding.checked,extra:extra.value,design:design.checked,urgent:urgent.checked};
   label=FORMATS.find(f=>f.id===format).label+' · '+(input.color==='bn'?'Blanco y negro':'Color')+' · '+quantity+' '+(input.unit==='paginas'?'páginas':'hojas físicas')+' · '+input.copies+' juego(s)'+(input.binding?' · Con anillado':'');
  }
  status.textContent='';if(onSubmit(input,label)===false)status.textContent='Espera a que termine la respuesta anterior.';
 });
 parent.append(form);return form;
}
