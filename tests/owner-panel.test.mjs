import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';

async function workspace(){
  const {window,document}=parseHTML(await readFile(new URL('../index.html',import.meta.url),'utf8'));
  window.HTMLElement.prototype.scrollIntoView=function(){};
  const root=document.getElementById('grafiplot-preview');
  const panel=document.getElementById('gp-site-settings');
  const editor=document.getElementById('gp-settings-editor');
  const products=document.createElement('details');products.id='gp-product-editor';
  const summary=document.createElement('summary');summary.textContent='Productos';products.append(summary);
  for(const [id,name] of [['a','Papel A4'],['b','Lapicero']]){
    for(const field of ['name','description','image']){
      const label=document.createElement('label'),input=document.createElement('input');
      input.dataset.productCopy=id;input.dataset.copyField=field;input.value=field==='name'?name:'';
      label.append(input);products.append(label);
    }
  }
  editor.append(products);
  const admin=document.createElement('section');admin.className='gp-store-admin';admin.hidden=true;panel.append(admin);
  const source=await readFile(new URL('../assets/v1/owner-panel.js',import.meta.url),'utf8');
  vm.runInNewContext(source,{document,window,MutationObserver:window.MutationObserver,queueMicrotask});
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return {window,document,root,panel,editor,admin};
}
test('owner workspace groups every control while preserving both form boundaries',async()=>{
  const {document,editor}=await workspace();
  for(const id of ['gp-settings-logo','gp-settings-map','gp-settings-phone','gp-gallery-editor','gp-service-images-editor','gp-rates-editor','gp-faq-editor']){
    assert.equal(document.getElementById(id).closest('form'),editor,id);
  }
  assert.equal(document.getElementById('gp-settings-logo').closest('[data-owner-pane]').dataset.ownerPane,'images');
  assert.equal(document.getElementById('gp-settings-map').closest('[data-owner-pane]').dataset.ownerPane,'contact');
  assert.equal(document.getElementById('gp-campaign-form').parentElement.closest('form'),null,'campaign form is never nested');
  assert.equal(document.querySelectorAll('.owner-nav-item').length,10);
  document.querySelector('[data-owner-target=services]').click();
  assert.equal(editor.hidden,false);
  assert.equal(document.getElementById('owner-pane-services').hidden,false);
  document.querySelector('[data-owner-target=customers]').click();
  assert.equal(editor.hidden,true);
  assert.equal(document.querySelectorAll('.owner-nav-item[aria-pressed=true]').length,1);
});
test('unsaved changes and owner session labels clear after signout',async()=>{
  const {document,window}=await workspace();
  const logo=document.getElementById('gp-settings-logo');
  logo.dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.match(document.querySelector('.owner-save-state').textContent,/sin guardar/);
  window.dispatchEvent(new window.CustomEvent('gp-owner-save',{detail:'saved'}));
  assert.equal(document.querySelector('.owner-save-state').textContent,'Cambios guardados');
  window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:{email:'owner@example.invalid'}}));
  assert.match(document.querySelector('.owner-account-line').textContent,/owner@example/);
  const password=document.getElementById('gp-settings-owner-password');password.value='temporary-test-value';
  window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:null}));
  assert.equal(password.value,'');assert.doesNotMatch(document.querySelector('.owner-session-summary').textContent,/owner@example/);
  assert.equal(document.getElementById('owner-pane-overview').hidden,false);
});
test('products can be found without removing editable inputs',async()=>{
  const {document}=await workspace();
  assert.equal(document.querySelectorAll('.owner-product-card').length,2);
  const filter=document.querySelector('.owner-product-filter');filter.value='lapicero';filter.dispatchEvent(new document.defaultView.Event('input',{bubbles:true}));
  const shown=[...document.querySelectorAll('.owner-product-card')].filter(card=>!card.hidden);
  assert.equal(shown.length,1);assert.equal(shown[0].querySelector('h4').textContent,'Lapicero');
  assert.equal(document.querySelectorAll('[data-product-copy]').length,6);
});
