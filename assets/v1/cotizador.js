export const PREVIEW_FORMATS = [
            ...['A1','A2','A3','A4','A5','A6','A7'].flatMap(size => [
                {id:size+'_1c', label:size+' · 1 cara', perSheet:1},
                {id:size+'_2c', label:size+' · 2 caras', perSheet:2}
            ]),
            {id:'Folleto',label:'Folleto / cuadernillo A4 doblado',perSheet:4},
            {id:'2xCara_1c',label:'A4 · 2 páginas por cara · 1 cara',perSheet:2},
            {id:'2xCara_2c',label:'A4 · 2 páginas por cara · 2 caras',perSheet:4},
            ...['A0','A1','A2','A3'].map(size => ({id:'Plano_'+size,label:'Plano '+size,perSheet:1}))
        ];
        const AUTO_EXTRAS = { laminate:'Plastificado / laminado', binding:'Empastado', cut:'Corte / guillotina', design:'Diseño gráfico', urgent:'Recargo urgente (%)' };
        export function calculatePreviewQuote(q,prices) {
            const format = PREVIEW_FORMATS.find(f=>f.id===q.format) || PREVIEW_FORMATS.find(f=>f.id==='A4_1c');
            const pages = Math.max(1,Math.trunc(Number(q.pages)||1));
            const copies = Math.max(1,Math.trunc(Number(q.copies)||1));
            const sheetsPerCopy = Math.ceil(pages/format.perSheet);
            const sheets = sheetsPerCopy*copies;
            const lines=[];
            const add = (key,label,quantity) => {
                const raw=prices[key];
                const price=raw === undefined || raw === null || raw === '' ? null : Number(raw);
                const amount=price !== null && Number.isFinite(price) && price>=0 ? price*quantity : null;
                lines.push({key,label,quantity,price,amount});
            };
            add(format.id+'_'+q.color+'_'+q.tariff, 'Impresión · '+sheets+' hojas', sheets);
            let volumes=0, sheetsPerVolume=0;
            if(q.binding) {
                const volumesPerCopy=Math.ceil(sheetsPerCopy/350);
                volumes=volumesPerCopy*copies;
                sheetsPerVolume=Math.ceil(sheetsPerCopy/volumesPerCopy);
                const tier=sheetsPerVolume<=100 ? 1 : sheetsPerVolume<=200 ? 2 : sheetsPerVolume<=300 ? 3 : 4;
                add('anillado_'+tier,'Anillado · '+volumes+' tomo(s) · '+q.spiral,volumes);
            }
            if(q.extra!=='none' && AUTO_EXTRAS[q.extra]) add(q.extra,AUTO_EXTRAS[q.extra]+' · por ejemplar',copies);
            if(q.design) add('design','Diseño · por pedido',1);
            if(q.urgent) {
                const subtotal=lines.every(l=>l.amount!==null)?lines.reduce((sum,l)=>sum+l.amount,0):null;
                add('urgent','Urgencia (%)',subtotal===null?0:subtotal/100);
                if(subtotal===null) lines[lines.length-1].amount=null;
            }
            const ready=lines.every(l=>l.amount!==null);
            return {format,pages,copies,sheets,sheetsPerCopy,volumes,sheetsPerVolume,lines,ready,total:ready?lines.reduce((sum,l)=>sum+l.amount,0):null};
        }

