import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContext,createAssistant,interpretAI} from '../assets/v1/grafibot-core.mjs';
const context=()=>buildContext({grafibotAI:{enabled:true,siteKey:'public-site-key-test-123456789'},autoPrices:{A4_2c_bn_menor:1,A4_2c_bn_mayor:.5,A3_1c_bn_menor:2,A4_1c_bn_menor:1,anillado_1:3},wholesaleThresholds:{A4_2c:100,A3_1c:20},quoteServices:[{id:'scan-a4',name:'Escaneo A4',unit:'hoja',formats:[{id:'a4',label:'A4',ranges:[{min:1,max:9,price:2},{min:10,max:null,price:1}]}]},{id:'scan-plans',name:'Escaneo de planos',unit:'plano',formats:[{id:'a1',label:'A1',ranges:[{min:1,max:null,price:5}]}]}]}, {services:['Impresiones','Escaneo'],hours:'Horario configurado',location:'Dirección configurada'});
const bot=(options={})=>createAssistant({getContext:context,generate:async()=>{throw Error('429')},...options});
test('physical sheets choose wholesale at the boundary and multiply copies',async()=>{
 const b=bot();let r=await b.reply('198 páginas A4 negro doble cara');assert.equal(r.quote.total,99);assert.match(r.quote.notes,/Precio por menor/);
 r=await b.reply('199 páginas');assert.equal(r.quote.total,50);assert.match(r.quote.notes,/100 hojas físicas.*Precio por mayor/);
 r=await b.reply('2 juegos');assert.equal(r.quote.total,100);assert.match(r.quote.notes,/200 hojas físicas/);
});
test('asking for wholesale never overrides the configured minimum',async()=>{const r=await bot().reply('10 páginas A4 negro doble cara por mayor');assert.equal(r.quote.total,5);assert.match(r.quote.notes,/Precio por menor/)});
test('format thresholds remain independent and unconfigured wholesale prices require confirmation',async()=>{const r=await bot().reply('20 páginas A3 negro una cara');assert.equal(r.quote,undefined);assert.equal(r.handoff,true)});
test('incremental local quote remembers sides before the size and distinguishes page count',async()=>{
 const b=bot();for(const text of ['cotizar','doble cara','A4','negro','100'])await b.reply(text);
 const r=await b.reply('páginas');assert.equal(r.quote.total,50);assert.match(r.quote.notes,/50 hojas físicas/);
});
test('local edits remove binding and undo urgent surcharges',async()=>{const b=bot();assert.equal((await b.reply('20 páginas A4 negro una cara con anillado')).quote.total,23);assert.equal((await b.reply('sin anillado')).quote.total,20);assert.equal((await b.reply('urgente')).quote,undefined);assert.equal((await b.reply('no es urgente')).quote.total,20)});
test('scanning uses configured service ranges, never the printing rate',async()=>{const r=await bot().reply('Escaneo A4 10 hojas');assert.equal(r.quote.total,10);assert.equal(r.quote.items[0].price,1);const p=await bot().reply('Escaneo de planos A1 2 planos');assert.equal(p.quote.total,10)});
test('scanning can be completed through several messages',async()=>{const b=bot();await b.reply('escaneo');await b.reply('A4');const r=await b.reply('5');assert.equal(r.quote.total,10)});
test('complete separate jobs sum without merging quantities and formats',async()=>{const r=await bot().reply('20 páginas A4 negro una cara; Escaneo A4 10 hojas');assert.equal(r.quote.total,30);assert.equal(r.quote.items.length,2)});
test('decimal and negative quantities are never silently parsed as integers',async()=>{for(const text of ['1.5 hojas A4 negro una cara','-2 hojas A4 negro una cara'])assert.equal((await bot().reply(text)).quote,undefined)});
test('local quotes and assistance remain available after AI fails and suppress repeated failures',async()=>{let calls=0;const b=bot({generate:async()=>{calls++;throw Error('429')}});const r=await b.reply('Una consulta comercial muy particular');assert.equal(r.mode,'unavailable');assert.equal((await b.reply('Otra consulta comercial')).mode,'basic');assert.equal(calls,1);assert.equal((await b.reply('20 páginas A4 negro una cara')).quote.total,20);assert.equal((await b.reply('ayuda')).handoff,undefined)});
test('when browser reports no connection, no AI request is attempted',async()=>{let calls=0;const b=bot({isOnline:()=>false,generate:()=>calls++});assert.equal((await b.reply('Necesito ayuda personal')).mode,'basic');assert.equal(calls,0);assert.equal((await b.reply('20 páginas A4 negro una cara')).quote.total,20)});
test('AI custom service identifiers are checked against configured formats',()=>{const r=interpretAI({intent:'quote',serviceId:'scan-a4',serviceFormat:'a4',quantity:10,price:0},context(),null);assert.equal(r.quote.total,10);assert.equal(interpretAI({intent:'quote',serviceId:'missing',quantity:2},context(),null).quote,undefined)});
