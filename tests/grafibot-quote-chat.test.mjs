
import test from 'node:test';import assert from 'node:assert/strict';import {buildContext,createAssistant} from '../assets/v1/grafibot-core.mjs';
const catalog=[{id:'pen',name:'Lapicero azul negro',description:'Ideal para escribir en hojas de papel',price:1,stock:500},{id:'pad',name:'Cuaderno A4',description:'100 hojas',price:4,stock:50}];
const context=()=>buildContext({grafibotAI:{enabled:true,siteKey:'public-site-key-test-123456789'},autoPrices:{A4_1c_bn_menor:.1,A4_2c_bn_menor:.2,Folleto_bn_menor:.4,anillado_1:3}}, {products:catalog,catalogConfirmed:true});
const bot=(opts={})=>createAssistant({getContext:context,generate:()=>{throw Error('AI must not be called')},...opts});
test('100 hojas, hosaj, ojas and pages always open the form with quantity, not pens or notebooks',async()=>{
 for(const msg of ['100 hojas','100 hosaj','precio de 100 ojas','cotisar 100 hojas negro','100 páginas','100 hojas A4 negro']){const r=await bot().reply(msg);assert.equal(r.quoteForm,true,msg);assert.equal(r.state.quantity,100,msg);assert.equal(r.quote,undefined,msg);assert.doesNotMatch(r.answer,/lapicero|cuaderno a4/i,msg);}
});
test('explicit products still use stock and current catalog',async()=>{const r=await bot().reply('cotizar 10 lapiceros');assert.equal(r.quote.total,10);assert.match(r.quote.items[0].name,/lapicero/i);});
test('calculator submits through existing quote engine including physical sheets and booklet, no Gemini',()=>{
 const b=bot();const q={service:'impresion',format:'A4_2c',color:'bn',quantity:100,unit:'paginas',copies:1,binding:false,extra:'none'};
 assert.equal(b.submitQuote(q).quote.total,10);assert.equal(b.submitQuote({...q,unit:'hojas'}).quote.total,20);
 const book=b.submitQuote({...q,format:'Folleto',binding:true});assert.equal(book.quote.total,13);assert.match(book.quote.notes,/25 hojas físicas/);
 assert.equal(b.submitQuote({...q,format:'A3_1c'}).quote,undefined);
});
test('Gemini cannot select an unrelated product',async()=>{const b=bot({generate:async()=>({intent:'product',productId:'pen',quantity:100})});const r=await b.reply('necesito ayuda para un trabajo');assert.equal(r.quote,undefined);assert.doesNotMatch(r.answer,/lapicero/i);});
