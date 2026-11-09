import {buildContext} from './grafibot-core.mjs?v=visual1';
let context=buildContext();
export const getBotContext=()=>context;
export function updateBotContext(data,page){context=buildContext(data,page);}
