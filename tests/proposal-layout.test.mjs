import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {parseHTML} from 'linkedom';
test('proposal keeps quote inputs, groups advanced options and exposes shop navigation',async()=>{
const {window,document}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));
const context=vm.createContext({window,document,localStorage:{getItem(){return null}},MutationObserver:window.MutationObserver,Option:function(text,value){const o=document.createElement('option');o.textContent=text;o.value=value;return o;}});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.getAttribute('data-value')||''},set(v){this.setAttribute('data-value',v)},configurable:true});
Object.defineProperty(window.HTMLSelectElement.prototype,'options',{get(){return this.querySelectorAll('option')}});
window.HTMLSelectElement.prototype.add=function(o){this.append(o)};
for(const file of ['refresh.js','proposal.js'])vm.runInContext(await readFile(new URL('../assets/v1/'+file,import.meta.url),'utf8'),context);
assert.equal(document.querySelectorAll('#gp-quote .gp-form>.gp-fields>label').length,4);
assert.ok(document.querySelector('.gp-quote-advanced #gp-tariff'));
assert.ok(document.querySelector('.gp-quote-advanced #gp-binding'));
assert.ok(document.querySelector('.gp-quote-bottom #gp-send'));
assert.equal(document.querySelectorAll('.gp-quote-steps li').length,3);
assert.ok(document.querySelector('.gp-shop-nav #gp-cart-nav'));
assert.equal(document.querySelectorAll('#gp-pages').length,1);
assert.equal(document.querySelector('.gp-promo-toast').hidden,true);
});
