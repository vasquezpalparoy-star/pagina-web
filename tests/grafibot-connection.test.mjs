import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeminiClient} from '../assets/v1/grafibot-ai.js';
import {aiConfig} from '../assets/v1/grafibot-core.mjs';
function fixture(){
 const calls=[];
 const Schema={enumString:x=>x,integer:()=>({}),boolean:()=>({}),string:()=>({}),object:x=>x};
 const sdk={Schema,initializeApp:()=>({id:'isolated-ai'}),deleteApp:async()=>calls.push('delete'),ReCaptchaEnterpriseProvider:class{},initializeAppCheck:()=>({id:'check'}),getToken:async()=>{calls.push('token');return {token:'test-token-not-for-output'}},GoogleAIBackend:class{},getAI:()=>({}),getGenerativeModel:(_,params)=>{calls.push(params);return {generateContent:async()=>{calls.push('generate');return {response:{text:()=>'{"intent":"greeting"}'}}}}}};
 return {sdk,calls,config:{enabled:true,siteKey:'public-site-key-test-123456789'}};
}
test('App Check must validate before a Gemini request and defaults to the lightweight model',async()=>{const f=fixture(),phases=[];const send=createGeminiClient(async()=>f.sdk);const text=await send('hola',{...f.config,onStatus:s=>phases.push(s)});assert.equal(JSON.parse(text).intent,'greeting');assert.equal(f.calls[0],'token');assert.equal(f.calls[1].model,'gemini-3.5-flash-lite');assert.equal(f.calls[1].generationConfig.thinkingConfig.thinkingLevel,'MINIMAL');assert.equal(f.calls[2],'generate');assert.ok(phases.some(s=>s.includes('App Check verificado')));assert.ok(!phases.join().includes('test-token-not-for-output'))});
test('App Check rejection is identified and no model is called',async()=>{const f=fixture();f.sdk.getToken=async()=>{const e=Error('verificación rechazada');e.code='appCheck/recaptcha-error';throw e};await assert.rejects(createGeminiClient(async()=>f.sdk)('hola',f.config),e=>e.code==='appCheck/recaptcha-error'&&e.message.startsWith('App Check:'));assert.equal(f.calls.length,0)});
test('missing verification token cannot reach the AI endpoint',async()=>{const f=fixture();f.sdk.getToken=async()=>({});await assert.rejects(createGeminiClient(async()=>f.sdk)('hola',f.config),/App Check no confirmó/);assert.equal(f.calls.length,0)});
test('model changes rebuild the model and use a supported thinking level',async()=>{const f=fixture(),send=createGeminiClient(async()=>f.sdk);await send('hola',f.config);await send('hola',{...f.config,model:'gemini-3.8-flash'});const models=f.calls.filter(x=>typeof x==='object');assert.equal(models.length,2);assert.equal(models[1].model,'gemini-3.8-flash');assert.equal(models[1].generationConfig.thinkingConfig.thinkingLevel,'LOW');assert.equal(aiConfig({model:'unapproved'}).model,'gemini-3.5-flash-lite')});
test('upstream model errors are identified separately from App Check',async()=>{const f=fixture();f.sdk.getGenerativeModel=()=>({generateContent:async()=>{throw Error('404 modelo no disponible')}});await assert.rejects(createGeminiClient(async()=>f.sdk)('hola',f.config),/Respuesta de Gemini: 404/)});
