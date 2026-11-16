export const whatsappNumber = '51952628844'; // Contacto usado por la página Grafiplot.
export const whatsappLink = (message) => whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : undefined;
const catalog = { A4: [.1, .12, .1, .1, .09, .1, .08, .09], TRIPTICO: [.1, .15, 0, .1, 0, .1, 0, .1], A3: [.5, .7, .5, .5, .4, .7, .3, .5], A2: [1.5, 0, 1.5, 0, 1.3, 0, 1.3, 0], A1: [2, 0, 2, 0, 1.8, 0, 1.8, 0], A0: [4, 0, 4, 0, 4, 0, 4, null], ANILLADO: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5] };
// PRESIO.xlsx, Hoja1, B3:I9. Orden: menor color 1/2 caras, negro 1/2; mayor mismo orden.
export const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const faqs = [
    { keys: ['papel bond opalina couche gramaje', 'diferencia de papel material'], answer: 'La diferencia de precio depende del material. Para una tarifa de opalina, couché o un gramaje especial, consulta por WhatsApp.', handoff: true },
    { keys: ['tesis empastado empastar'], answer: 'No realizamos impresión y encuadernación de tesis o empastados. Para otras opciones, consulta por WhatsApp.', handoff: true },
    { keys: ['descuento volumen mayorista por mayor'], answer: 'Sí hay descuentos por volumen. El mínimo mayorista no está indicado en la tarifa; debes confirmar el precio y las condiciones por WhatsApp.', handoff: true },
    { keys: ['tamano papel tamanos formatos a5'], answer: 'Manejamos tamaños de A5 a A0. Para cotizar solo puedo usar las combinaciones registradas en el catálogo; A5 no tiene tarifa cargada.' },
    { keys: ['gran formato gigantografias banners arquitectura'], answer: 'Sí realizamos impresiones en gran formato: planos, gigantografías y banners. Para un servicio sin tarifa registrada, consulta por WhatsApp.', handoff: true },
    { keys: ['tipos encuadernacion espiral doblering engrampado'], answer: 'Ofrecemos anillado, doble ring, encuadernados y engrampados. El catálogo incluye anillado; los demás acabados requieren consulta por WhatsApp.', handoff: true },
    { keys: ['plastificado laminado enmicado'], answer: 'Sí hacemos plastificado o enmicado. El documento no especifica tamaños ni precios; confírmalos por WhatsApp.', handoff: true },
    { keys: ['diseno grafico tarjetas flyers invitaciones'], answer: 'Sí realizamos diseño gráfico básico, como tarjetas, flyers e invitaciones. Para cotizar tu diseño, consulta por WhatsApp.', handoff: true },
    { keys: ['formato archivo pdf word imagenes', 'archivos no muevan cambien diseno'], answer: 'Recibimos archivos en todos los formatos; preferimos PDF para conservar el diseño.' },
    { keys: ['enviar documentos archivos whatsapp correo drive', 'como mando archivo'], answer: 'Puedes enviar tus documentos por WhatsApp o llevarlos por cualquier medio, como USB. Para enviarlos por WhatsApp, usa el contacto del negocio.', handoff: true },
    { keys: ['celular memoria usb imprimir directamente'], answer: 'Sí, imprimimos directamente desde tu celular o memoria USB en el local.' },
    { keys: ['dwg plotter planos formato'], answer: 'Sí recibimos planos en DWG o PDF para imprimir en plotter.' },
    { keys: ['tiempo demora tardan entrega minutos', 'cuanto tarda imprimir anillar'], answer: 'Las impresiones y anillados simples toman minutos. El delivery tarda entre 1 y 3 horas.' },
    { keys: ['anticipacion recoger fila recojo'], answer: 'Sí puedes enviar tus archivos con anticipación y pasar a recogerlos.' },
    { keys: ['domicilio delivery envio reparto', 'tiempo tarda demora delivery'], answer: 'Sí tenemos delivery. Para pedidos grandes es gratis; el documento no indica el mínimo, así que confirma las condiciones por WhatsApp. La entrega tarda entre 1 y 3 horas.', handoff: true },
    { keys: ['urgente urgentes ultima hora'], answer: 'Sí atendemos pedidos urgentes, según la disponibilidad del personal.' },
    { keys: ['horario horarios atencion abren cierran sabado domingo feriados'], answer: 'Atendemos de lunes a viernes de 6:30 a. m. a 9:30 p. m.; sábados de 9 a. m. a 8 p. m.; domingos de 9 a. m. a 9:30 p. m. El documento no indica horarios de feriados.' },
    { keys: ['ubicacion direccion donde estan local ubicados universidad unheval uanheval'], answer: 'Estamos frente a la puerta principal de la UNHEVAL.' },
    { keys: ['pago pagar metodos efectivo yape plin tarjeta transferencia'], answer: 'Aceptamos efectivo, Yape y transferencia bancaria. No hay confirmación en el documento sobre tarjetas o Plin.' },
    { keys: ['servicios ofrecen realizan trabajos universitarios copias impresiones stickers stiquers'], answer: 'Ofrecemos impresiones y copias, ploteo de planos, gigantografías, anillados y espiralados, tarjetas y stickers, diseño gráfico y trabajos universitarios. Puedo cotizar las opciones con tarifa registrada; los demás servicios se consultan por WhatsApp.', handoff: true },
];
const stop = new Set('que cuanto cuesta cual como el la los las un una de del a en por para puedo tienen hay es se me mi si y o al tu con hacer hacen imprimir impresion impresiones copias fotocopias'.split(' '));
function near(a, b) { if (a === b)
    return true; if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1)
    return false; let prev = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
        row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
} return prev[b.length] <= 1; }
function faq(text) { const words = normalize(text).split(' ').filter(w => !stop.has(w)); if (!words.length)
    return; const ranks = faqs.map(f => ({ f, score: Math.max(...f.keys.map(k => { const tokens = k.split(' '); const hits = words.filter(w => tokens.some(t => near(w, t))).length; return hits / words.length; })) })).sort((a, b) => b.score - a.score); if (ranks[0].score >= .5 && ranks[0].score > ranks[1].score)
    return ranks[0].f; }
const handoff = (answer, state = null) => ({ answer: answer + (whatsappNumber ? '\nPuedes continuar por WhatsApp.' : '\nEl enlace de WhatsApp está pendiente de que el negocio confirme su número.'), state, handoff: true });
export function businessReply(text, current = null) {
    const n = normalize(text), s = { ...current };
    if (n === 'cancelar')
        return { answer: 'Solicitud cancelada. Puedes hacer una pregunta o escribir «cotizar».', state: null };
    if (n === 'ayuda' || n === 'como funciona')
        return { answer: 'Pregunta por horarios, pagos, ubicación o servicios. Para cotizar escribe, por ejemplo: «20 hojas A4 a color a una cara». Uso las tarifas por menor del Excel, en soles. Los descuentos por mayor se confirman por WhatsApp. Escribe «cancelar» para empezar de nuevo.', state: current };
    if (/\b(mayor|mayorista|volumen|descuento)\b/.test(n))
        return handoff(faqs[2].answer, current);
    const f = faq(text);
    const pricing = /\b(cotiz\w*|cotis\w*|precio\w*|presio\w*|cuesta|costo)\b/.test(n) || /\ba[0-5]\b|triptic\w*|anillad\w*|anllado/.test(n) && !f;
    if (f && !pricing) {
        return f.handoff ? handoff(f.answer, current) : { answer: f.answer, state: current };
    }
    if (!current && !pricing) {
        if (/^(hola|buenos dias|buenas tardes|buenas noches|gracias)$/.test(n))
            return { answer: '¡Hola! Puedo responder tus preguntas del negocio y cotizar impresiones con las tarifas registradas. ¿Qué necesitas?', state: null };
        return handoff('No tengo una respuesta confirmada para esa consulta. Un asesor puede ayudarte por WhatsApp.');
    }
    const products = [...n.matchAll(/\ba[0-5]\b|triptic\w*|anillad\w*|anllado/g)].map(m => m[0].startsWith('a') && /^a\d$/.test(m[0]) ? m[0].toUpperCase() : m[0].startsWith('tri') ? 'TRIPTICO' : 'ANILLADO');
    if (new Set(products).size > 1)
        return { answer: 'Para evitar mezclar tarifas, cotizamos un servicio a la vez. ¿Con qué tamaño o servicio empezamos?', state: null };
    if (products.length)
        s.product = products[0];
    if (/\b(color|colores)\b/.test(n) && /\b(negro|blanco y negro|bn|b n)\b/.test(n))
        s.color = undefined;
    else if (/\b(color|colores)\b/.test(n))
        s.color = true;
    else if (/\b(negro|blanco y negro|bn|b n)\b/.test(n))
        s.color = false;
    if (/ambas caras|dos caras|2 caras|doble cara|doble faz/.test(n))
        s.double = true;
    else if (/una cara|1 cara|un lado|simple faz/.test(n))
        s.double = false;
    const stripped = n.replace(/\ba[0-5]\b/g, '').replace(/\b[12] caras\b/g, '');
    const q = stripped.match(/\b(\d+)\s*(?:hojas?|copias?|impresiones?|unidades?|anillados?|tripticos?)\b/) || stripped.match(/(?:cantidad|cotiza|cotizar|necesito|quiero)\s+(\d+)\b/) || n.match(/^(\d+)\s+(?:a[0-5]|triptic|anillad)/) || (/^\d+$/.test(n) ? [n, n] : null);
    if (q) {
        const quantity = Number(q[1]);
        if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000)
            return { answer: 'Escribe una cantidad entera entre 1 y 1 000 000.', state: current };
        s.qty = quantity;
    }
    if (s.product && !Object.hasOwn(catalog, s.product))
        return handoff(`No hay una tarifa registrada para ${s.product}. No puedo cotizarlo automáticamente.`);
    if (!s.product) {
        if (/banner|tesis|empastad|diseno|enmicad|laminad|plastificad|couche|opalina|bond|engrampad|ring/.test(n))
            return handoff('Ese servicio o material no tiene una tarifa confirmada en el Excel.');
        return { answer: '¿Qué servicio necesitas? Tengo tarifas para A4, A3, A2, A1, A0, tríptico y anillado. Los materiales o servicios especiales se consultan por WhatsApp.', state: s };
    }
    if (/couche|opalina|gramaje|fotografico|adhesivo|cartulina|metro|m2/.test(n))
        return handoff('El Excel no especifica una tarifa para ese material o medida. Confírmala por WhatsApp.');
    if (!s.qty)
        return { answer: '¿Cuántas hojas, trípticos o anillados necesitas?', state: s };
    if (s.product !== 'ANILLADO' && s.color === undefined)
        return { answer: '¿A color o en blanco y negro?', state: s };
    if (s.product !== 'ANILLADO' && s.double === undefined)
        return { answer: '¿A una cara o a ambas caras?', state: s };
    const index = s.product === 'ANILLADO' ? 0 : (s.color ? 0 : 2) + (s.double ? 1 : 0), price = catalog[s.product][index];
    if (price === 0)
        return handoff(`${s.product}, ${s.color ? 'color' : 'blanco y negro'}, ${s.double ? 'ambas caras' : 'una cara'}: esta combinación no está disponible (precio 0 en el catálogo).`);
    if (price === undefined || price === null)
        return handoff('Esta combinación no tiene tarifa registrada.');
    const description = s.product === 'ANILLADO' ? 'Anillado' : `${s.product} · ${s.color ? 'color' : 'blanco y negro'} · ${s.double ? 'ambas caras' : 'una cara'}`;
    const quote = { client: 'Consulta por chat', currency: 'PEN', items: [{ name: description, qty: s.qty, unit: s.product === 'ANILLADO' ? 'anillados' : 'hojas', price }], discount: 0, tax: 0, extra: 0, notes: 'Tarifa por menor de PRESIO.xlsx, en soles. Importe de este servicio únicamente. El archivo no especifica impuestos, materiales especiales ni cargos de envío; deben confirmarse. Descuentos por volumen: consulta por WhatsApp.' };
    return { answer: 'Cotización calculada con el precio por menor registrado. Puedes guardar el resultado en PDF. Para condiciones por mayor o adicionales, consulta con el negocio.', state: null, quote };
}
export function faqAnswer(index, state = null) { const f = faqs[index]; return f ? (f.handoff ? handoff(f.answer, state) : { answer: f.answer, state }) : null; }
