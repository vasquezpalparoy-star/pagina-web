
        export const USER_FIREBASE_CONFIG = {
            apiKey: "AIzaSyClluUAu9eVV2cdh0GGA2-VdyHDaZilZHo",
            authDomain: "pagina-web-grafiplot-oficial.firebaseapp.com",
            databaseURL: "https://pagina-web-grafiplot-oficial-default-rtdb.firebaseio.com",
            projectId: "pagina-web-grafiplot-oficial",
            storageBucket: "pagina-web-grafiplot-oficial.firebasestorage.app",
            messagingSenderId: "116976625167",
            appId: "1:116976625167:web:27c27cc4abe77ccacfa57a",
            measurementId: "G-ESY8JXWSVG"
        };

        export const INVENTORY_FIREBASE_CONFIG = {
            apiKey: "AIzaSyBYrKgwH889S6A9Ahoc7E9ZAkpvavFkEsc",
            authDomain: "imventario-105b7.firebaseapp.com",
            projectId: "imventario-105b7",
            storageBucket: "imventario-105b7.firebasestorage.app",
            messagingSenderId: "25017694564",
            appId: "1:25017694564:web:45b14399aed811d9202271"
        };

        const inventoryText = value => typeof value === 'string' ? value : '';
        const inventoryNumber = value => Number.isFinite(Number(value)) ? Math.max(0,Number(value)) : 0;
        function inventoryImage(value) {
            try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
        }
        export function normalizeInventoryProduct(snapshot) {
            const data = snapshot.data();
            const images=(Array.isArray(data.images)?data.images:[]).map(img=>inventoryImage(typeof img==='string'?img:img?.url)).filter(Boolean);
            if(!images.length && data.imageUrl) { const image=inventoryImage(data.imageUrl); if(image) images.push(image); }
            const isService=data.category==='Servicio';
            // Only public catalog fields enter the website view model.
            return {id:snapshot.id,name:inventoryText(data.name)||'Producto sin nombre',description:inventoryText(data.description),category:inventoryText(data.category)||'Otros',
                price:inventoryNumber(data.price),bulkPrice:inventoryNumber(data.bulkPrice),stock:Math.floor(inventoryNumber(data.stock)),measureUnit:inventoryText(data.measureUnit)||'unidades',sku:inventoryText(data.barcode),
                image:images[0]||'',additionalImages:images.slice(1),isPriority:data.isPriority===true,isService,allowCart:!isService,isActive:true,isOffer:false,isNew:false,
                createdAt:Date.parse(data.updatedAt)||0};
        }

