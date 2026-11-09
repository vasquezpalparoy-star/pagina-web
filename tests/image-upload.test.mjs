import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {initImageUploads,prepareImage} from '../assets/v1/image-upload.mjs';
import {imageExtension,MAX_BYTES} from '../supabase/functions/grafiplot-images/images.mjs';
test('server rejects disguised images, SVG and oversized files',()=>{
 assert.equal(imageExtension('image/png',new Uint8Array([137,80,78,71,13,10,26,10])),'png');
 assert.equal(imageExtension('image/jpeg',new Uint8Array([255,216,255])),'jpg');
 assert.throws(()=>imageExtension('image/svg+xml',new TextEncoder().encode('<svg/>')));
 assert.throws(()=>imageExtension('image/png',new TextEncoder().encode('<script/>')));
 assert.throws(()=>imageExtension('image/png',new Uint8Array(MAX_BYTES+1)));
});
test('client rejects unsupported files before decoding',async()=>{
 await assert.rejects(prepareImage({type:'image/svg+xml',size:500}));
 await assert.rejects(prepareImage({type:'image/png',size:21*1024*1024}));
});
function fixture(send){
 const {document,window}=parseHTML('<div id="grafiplot-preview"><form id="gp-settings-editor"><label>Logo (enlace de imagen)<input id="gp-settings-logo" type="url" value="https://example.com/old.png"></label><label>Mapa<input id="gp-settings-map" type="url"></label><label>Fotos adicionales<textarea data-upload-photos></textarea></label></form><p id="gp-settings-feedback"></p></div>');
 initImageUploads(document.querySelector('#grafiplot-preview'),send);
 const login=user=>window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:user}));
 const pick=async files=>{const picker=document.querySelector('input[type=file]');Object.defineProperty(picker,'files',{value:files,configurable:true});await picker.onchange()};
 return {document,window,login,pick};
}
test('image upload preserves links, updates the draft and preview, excludes map, and supports dynamic fields',async()=>{
 const f=fixture(async()=> 'https://example.com/new.webp');
 assert.equal(f.document.querySelector('#gp-settings-logo').value,'https://example.com/old.png');
 assert.equal(f.document.querySelector('#gp-settings-map').type,'url');
 assert.equal(f.document.querySelector('.gp-image-uploader button').disabled,true);
 f.login({uid:'owner'});let changed=0;f.document.querySelector('#gp-settings-logo').addEventListener('input',()=>changed++);
 await f.pick([{type:'image/png'}]);
 assert.equal(f.document.querySelector('#gp-settings-logo').value,'https://example.com/new.webp');assert.equal(changed,1);
 assert.equal(f.document.querySelector('.gp-upload-preview img').src,'https://example.com/new.webp');
 const label=f.document.createElement('label');label.innerHTML='Imagen<input type="url">';f.document.querySelector('form').append(label);await new Promise(r=>setImmediate(r));
 assert.ok(label.querySelector('input[type=file]'));
});
test('failed uploads retain current image and logout discards in-flight results',async()=>{
 const f=fixture(async()=>{throw Error('Sin conexión')});f.login({});await f.pick([{}]);
 assert.equal(f.document.querySelector('#gp-settings-logo').value,'https://example.com/old.png');
 assert.match(f.document.querySelector('[role=status]').textContent,/Sin conexión/);
 let finish;const g=fixture(()=>new Promise(r=>finish=r));g.login({});const pending=g.pick([{}]);g.login(null);finish('https://example.com/private.webp');await pending;
 assert.equal(g.document.querySelector('#gp-settings-logo').value,'https://example.com/old.png');
});
