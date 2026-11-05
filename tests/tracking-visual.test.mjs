import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const source=await readFile(new URL('../assets/v1/tracking-visual.js',import.meta.url),'utf8');
function fixture(){const {document,window}=parseHTML('<body></body>');vm.runInContext(source,vm.createContext({document,window,setTimeout:fn=>fn()}));return {document,api:window.GrafiplotTracking}}
test('each real state selects exactly one illustrated stage and completes only previous stages',()=>{
 for(const [i,status] of ['recibido','en_proceso','listo','en_camino','entregado'].entries()){
  const {api}=fixture(),card=api.create(status);
  assert.equal(card.querySelectorAll('img').length,5);
  assert.equal(card.querySelectorAll('[aria-current=step]').length,1);
  assert.equal(card.querySelector('[aria-current=step]').dataset.stage,status);
  assert.equal(card.querySelectorAll('.is-done').length,i);
  assert.equal(card.querySelectorAll('.gv-current-badge').length,1);
  assert.match(card.querySelector('.gv-contact').href,/51916133647/);
 }
});
test('unqueried, unconfirmed and canceled orders never imply a false current stage',()=>{
 for(const status of [null,'solicitado','confirmado','cancelado','unknown']){
  const {api}=fixture(),card=api.create(status);assert.equal(card.querySelectorAll('[aria-current=step]').length,0);assert.equal(card.querySelectorAll('.is-done').length,0);
 }
});
test('owner image links apply to existing and future trackers, rejecting executable URLs',()=>{
 const {api,document}=fixture();document.body.append(api.create('en_proceso'));
 api.setImages({trackingEnProceso:'https://example.com/printer.png',trackingRecibido:'javascript:alert(1)'});
 assert.equal(document.querySelector('[data-tracking-image=trackingEnProceso]').src,'https://example.com/printer.png');
 assert.equal(api.create('listo').querySelector('[data-tracking-image=trackingEnProceso]').src,'https://example.com/printer.png');
 assert.match(document.querySelector('[data-tracking-image=trackingRecibido]').src,/tracking-recibido.png$/);
 api.setImages({});assert.match(document.querySelector('[data-tracking-image=trackingEnProceso]').src,/tracking-en-proceso.png$/);
});
