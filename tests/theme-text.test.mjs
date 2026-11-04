import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';

test('saved labels follow their identity, ignore legacy positions and leave theme controls intact',async()=>{
 const source=await readFile(new URL('../assets/v1/app.js',import.meta.url),'utf8');
 const fragment=source.slice(source.indexOf('const settingsTargets=[];'),source.indexOf('if(storedPreview&&'));
 const run=(html,config)=>{
  const {document}=parseHTML(`<main id="root">${html}<input id="gp-settings-theme"></main>`);
  const root=document.querySelector('#root');
  const ctx=vm.createContext({root,window:{gpTheme:'light'},URL});
  vm.runInContext(fragment,ctx);
  ctx.config=config;
  vm.runInContext('applyPreviewConfig(config)',ctx);
  return {root,ctx};
 };
 const first=run('<section id="hero"><h1>Mi título</h1><p>Descripción</p></section>',{texts:{0:'Etiqueta incorrecta'}});
 assert.equal(first.root.querySelector('h1').textContent,'Mi título');
 const key=vm.runInContext('settingsTargets[0].key',first.ctx);
 const second=run('<button id="gp-theme-toggle">Modo oscuro</button><p>Texto nuevo</p><section id="hero"><h1>Mi título</h1><p>Descripción</p></section>',{textsByKey:{[key]:'Título editado'}});
 assert.equal(second.root.querySelector('h1').textContent,'Título editado');
 assert.equal(second.root.querySelector('#gp-theme-toggle').textContent,'Modo oscuro');
 assert.equal(second.root.dataset.appearance,'light');
});
