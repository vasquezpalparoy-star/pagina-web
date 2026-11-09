import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {validateVisualPage,initVisualEditor} from '../assets/v1/visual-editor.mjs';
test('custom sections reject executable links, unknown anchors and duplicate identities',()=>{
 const s={id:'test',type:'button',anchor:'gp-home',url:'javascript:alert(1)'};assert.throws(()=>validateVisualPage({sections:[s]}));
 assert.throws(()=>validateVisualPage({sections:[{...s,url:'https://example.com',anchor:'bad'}]}));
 assert.throws(()=>validateVisualPage({sections:[{...s,url:''},{...s,url:''}]}));
});
test('visual editing requires owner, persists text as data, previews cleanly and discards on logout',()=>{
 const {document,window}=parseHTML('<main id="grafiplot-preview"><div class="gp-header-actions"></div><section id="gp-home"><h1>Mi título</h1></section><section id="gp-services"></section><section id="gp-site-settings" hidden></section><form id="gp-settings-editor"></form><p id="gp-settings-feedback"></p></main>');
 window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLDialogElement=window.HTMLElement;window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','')};window.HTMLElement.prototype.close=function(){this.removeAttribute('open')};window.confirm=()=>true;
 let user=null,login=0,discarded=0;window.GrafiplotPage={get user(){return user},config:{},prepare(){},openLogin(){login++},discard(){discarded++}};
 const root=document.querySelector('main');const ui=initVisualEditor(root);document.querySelector('.ve-entry').click();assert.equal(login,1);assert.notEqual(root.dataset.visualEditing,'true');
 user={uid:'owner'};window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:user}));ui.start();assert.equal(root.dataset.visualEditing,'true');
 document.querySelector('h1').click();const dialog=document.querySelector('.ve-dialog');dialog.querySelector('textarea').value='Título guardable';dialog.querySelector('form').onsubmit({preventDefault(){}});
 assert.equal(document.querySelector('h1').textContent,'Título guardable');const data=window.GrafiplotAddons.visual.value();assert.equal(data.visualPage.texts['#gp-home > h1:nth-of-type(1)'],'Título guardable');
 document.querySelector('.ve-toolbar button').click();assert.equal(root.dataset.visualEditing,'false');assert.equal(document.querySelectorAll('[data-ve-tools]').length,0);
 user=null;window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:null}));assert.equal(discarded,1);assert.equal(document.querySelector('.ve-toolbar').hidden,true);assert.equal(document.querySelector('h1').textContent,'Mi título');
 ui.load(data);assert.equal(document.querySelector('h1').textContent,'Título guardable');
});
