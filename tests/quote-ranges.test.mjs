import test from 'node:test';import assert from 'node:assert/strict';
import {rangePrice,validateRanges,defaultQuoteServices,validateQuoteServices,calculateServiceQuote} from '../assets/v1/quote-ranges.mjs';
import {calculatePreviewQuote} from '../assets/v1/cotizador.js';
import {initQuoteEditor} from '../assets/v1/quote-editor.mjs';
import {parseHTML} from 'linkedom';import {readFile} from 'node:fs/promises';
test('quantity boundaries are inclusive, open upper bounds work and gaps remain unpriced',()=>{
 const rows=[{min:1,max:9,price:2},{min:10,max:29,price:1.8},{min:30,max:null,price:1.5}];
 assert.deepEqual([1,9,10,29,30,1000].map(n=>rangePrice(rows,n)),[2,2,1.8,1.8,1.5,1.5]);
 assert.equal(rangePrice([{min:10,max:20,price:0}],9),null);assert.equal(rangePrice([{min:10,max:20,price:0}],10),0);
 assert.throws(()=>validateRanges([{min:1,max:10,price:1},{min:10,max:20,price:1}]));
 assert.throws(()=>validateRanges([{min:1,max:null,price:1},{min:20,max:30,price:1}]));
 assert.throws(()=>validateRanges([{min:1,max:3,price:-1}]));
});
test('scanning has no invented prices, survives serialization and rejects fractional quantities',()=>{
 const services=validateQuoteServices(defaultQuoteServices());assert.equal(calculateServiceQuote(services[0],'a4',15).total,null);
 services[0].formats[0].ranges[1].price=0.3;const saved=validateQuoteServices(JSON.parse(JSON.stringify(services)));
 assert.equal(calculateServiceQuote(saved[0],'a4',15).total,4.5);
 assert.throws(()=>calculateServiceQuote(saved[0],'a4',1.5));assert.throws(()=>calculateServiceQuote(saved[0],'a4',0));
});
test('printing quantity tiers count physical sheets across complete copies',()=>{
 const result=calculatePreviewQuote({format:'A4_2c',pages:11,copies:2,color:'bn',tariff:'menor',extra:'none'}, {'A4_2c_bn_menor':1},{'A4_2c_bn_menor':[{min:1,max:9,price:1},{min:10,max:null,price:0.8}]});
 assert.equal(result.sheets,12);assert.equal(result.total,9.6);
 const gap=calculatePreviewQuote({format:'A4_1c',pages:5,copies:1,color:'bn',tariff:'menor',extra:'none'},{'A4_1c_bn_menor':1},{'A4_1c_bn_menor':[{min:10,max:null,price:0.5}]});assert.equal(gap.ready,false);
});
export function selects(window){Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.getAttribute('data-value')||this.querySelector('option')?.getAttribute('value')||''},set(v){this.setAttribute('data-value',v)},configurable:true})}
test('customer can select scan service and WhatsApp includes the configured range price',async()=>{
 const {document,window}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));selects(window);let url='';window.open=value=>url=value;
 const root=document.querySelector('#grafiplot-preview');const ui=initQuoteEditor(root);const services=defaultQuoteServices();services[0].formats[0].ranges[1].price=.3;ui.load({quoteServices:services});
 const select=document.querySelector('#gp-quote-service');select.value='scan-a4';select.onchange();const qty=document.querySelector('.gp-custom-quote input');qty.value='15';qty.oninput();
 assert.equal(document.querySelector('#gp-price').textContent,'S/ 4.50');document.querySelector('#gp-send').click();assert.match(decodeURIComponent(url),/Escaneo A4/);assert.match(decodeURIComponent(url),/4.50/);
 assert.ok(window.GrafiplotAddons.quotes.value().quoteServices.length===2);
});
