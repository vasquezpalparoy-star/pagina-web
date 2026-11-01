import test from 'node:test';
import assert from 'node:assert/strict';
import {aiConfig,buildContext,createAssistant,interpretAI,quoteReply,makePrompt} from '../assets/v1/grafibot-core.mjs';
import {responseSchema} from '../assets/v1/grafibot-ai.js';
const context=()=>buildContext({grafibotAI:{enabled:true,siteKey:'public-site-key-test-123456789'},autoPrices:{A4_1c_bn_menor:.1,A4_2c_bn_menor:.15,anillado_1:2},faqContent:[{question:'¿Aceptan Yape?',answer:'Sí, aceptamos Yape.'}]},{services:['Impresiones','Planos'],hours:'Lunes a sábado 9–19',location:'Frente a UNHEVAL'});
const params={service:'impresion',format:'A4_1c',color:'bn',quantity:20,unit:'paginas'};
test('AI requires explicit activation and a public App Check site key; model is pinned',()=>{
 assert.equal(aiConfig().enabled,false);assert.equal(aiConfig(null).enabled,false);assert.equal(aiConfig({enabled:true,siteKey:'AIza-not-a-public-recaptcha-site-key'}).enabled,false);assert.equal(aiConfig({enabled:true,siteKey:'invalid'}).enabled,false);
 assert.equal(aiConfig({enabled:true,siteKey:'public-site-key-test-123456789',model:'expensive'}).model,'gemini-2.5-flash-lite');
});
test('common factual queries and complete basic quotes make zero AI requests',async()=>{
 let calls=0;const bot=createAssistant({getContext:context,generate:()=>{calls++;throw Error();}});
 assert.equal((await bot.reply('horario')).answer,context().hours);
 assert.equal((await bot.reply('¿Aceptan Yape?')).answer,'Sí, aceptamos Yape.');
 const result=await bot.reply('20 ojas A4 sin color una cara');assert.equal(result.quote.items[0].price,.1);assert.equal(calls,0);
});
test('double-sided physical sheets differ from document pages',()=>{
 const pages=quoteReply({...params,format:'A4_2c',quantity:100},context());
 const sheets=quoteReply({...params,format:'A4_2c',quantity:100,unit:'hojas'},context());
 assert.equal(pages.quote.items[0].qty,50);assert.equal(sheets.quote.items[0].qty,100);
});
test('model cannot supply prices or unconfigured facts',()=>{
 const result=interpretAI({intent:'quote',...params,price:0,total:0},context(),null);
 assert.equal(result.quote.items[0].price,.1);
 assert.equal(interpretAI({intent:'faq',faqIndex:99,answer:'Invented'},context(),null).handoff,true);
});
test('missing rates hand off instead of falling back to old hardcoded prices',()=>{
 const c=context();c.prices={};const result=quoteReply(params,c);
 assert.equal(result.quote,undefined);assert.equal(result.handoff,true);
});
test('printing plus binding is one quote; missing urgent surcharge requires confirmation',()=>{
 const result=quoteReply({...params,binding:true},context());assert.equal(result.quote.items.length,2);
 const urgent=quoteReply({...params,urgent:true},context());assert.equal(urgent.quote,undefined);assert.equal(urgent.handoff,true);
});
test('invalid extracted quantities and formats require clarification',()=>{
 for(const quantity of [0,-1,Infinity,1.5,100001])assert.equal(quoteReply({...params,quantity},context()).quote,undefined);
 assert.equal(quoteReply({...params,format:'unknown'},context()).quote,undefined);
});
test('AI extraction maintains a quote across messages and cancel resets it',async()=>{
 let time=0;let calls=0;
 const bot=createAssistant({getContext:context,now:()=>time,generate:async()=>{calls++;return {intent:'quote',...params};}});
 assert.ok((await bot.reply('Necesito un trabajo sencillo para mi clase')).quote);
 assert.equal(calls,1);
 time+=7000;const cancelled=await bot.reply('cancelar');assert.equal(cancelled.state,null);
});
test('disabled AI, exhausted quota, malformed output and upstream failure do not break chat',async()=>{
 for(const generate of [async()=>{throw Error('429');},async()=>'{bad-json',async()=>null]) {
  const bot=createAssistant({getContext:context,generate});const result=await bot.reply('Quisiera ayuda para elegir un trabajo');
  assert.equal(result.mode,'unavailable');assert.equal(result.handoff,true);
  assert.equal((await bot.reply('horario')).answer,context().hours);
 }
 let calls=0;const c=context();c.ai.enabled=false;const bot=createAssistant({getContext:()=>c,generate:()=>calls++});
 assert.equal((await bot.reply('Ayúdame con mi trabajo')).mode,'basic');assert.equal(calls,0);
});
test('local cooldown reduces repeated AI calls and is not represented as a server quota',async()=>{
 let calls=0;let time=0;const bot=createAssistant({getContext:context,now:()=>time,generate:async()=>{calls++;return {intent:'handoff'};}});
 await bot.reply('Consulta personalizada');assert.equal((await bot.reply('Otra consulta personalizada')).mode,'limited');assert.equal(calls,1);
 time=6001;await bot.reply('Otra consulta personalizada');assert.equal(calls,2);
});
test('unknown scanning requests and multiple jobs are never silently priced as printing',async()=>{
 const c=context();c.ai.enabled=false;const bot=createAssistant({getContext:()=>c,generate:()=>{throw Error();}});
 for(const text of ['Escanear 20 hojas A0 blanco y negro una cara','20 hojas A4 negro una cara y 30 hojas A4 negro una cara'])assert.equal((await bot.reply(text)).quote,undefined);
});
test('only bounded public FAQ context and one message are passed to the model',()=>{
 const c=context();const prompt=JSON.parse(makePrompt('a'.repeat(3000),c,null));
 assert.equal(prompt.message.length,2000);assert.equal(prompt.prices,undefined);assert.equal(prompt.ai,undefined);
});
test('Firebase schema has only intent required and permits incremental extraction',()=>{
 const S={enumString:v=>v,integer:()=>({}),boolean:()=>({}),string:()=>({}),object:v=>v};
 const schema=responseSchema(S);assert.equal(schema.optionalProperties.includes('intent'),false);assert.ok(schema.optionalProperties.includes('quantity'));
});
