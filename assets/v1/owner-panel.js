(()=>{
  function initializeOwnerPanel(){
    const root=document.getElementById('grafiplot-preview');
    const panel=document.getElementById('gp-site-settings');
    const form=document.getElementById('gp-settings-editor');
    if(!root||!panel||!form||panel.dataset.workspaceReady)return;
    panel.dataset.workspaceReady='true';

    const make=(tag,className,text)=>{
      const node=document.createElement(tag);
      if(className)node.className=className;
      if(text)node.textContent=text;
      return node;
    };
    const heading=panel.querySelector('.gp-section-head');
    heading.querySelector('h2').textContent='Tu negocio, en tus manos';
    heading.querySelector('.gp-eyebrow').textContent='Panel del dueño';
    heading.querySelector('.gp-subtitle').textContent='Elige una sección, realiza los cambios y guarda.';
    const accountLine=make('p','owner-account-line','Cuenta del propietario');
    heading.querySelector('div').append(accountLine);

    const workspace=make('div','owner-workspace');
    const navigation=make('nav','owner-sidebar');
    navigation.setAttribute('aria-label','Secciones del panel del dueño');
    const main=make('div','owner-main');
    workspace.append(navigation,main);
    heading.after(workspace);
    main.append(form);
    const categories=[
      ['overview','Resumen','Accesos rápidos para administrar tu página.'],
      ['images','Marca e imágenes','Logo, colores, galería y fotos de la página.'],
      ['services','Portada y servicios','Nombres, descripciones y fotos de tus servicios.'],
      ['products','Productos','Corrige los nombres, descripciones e imágenes del catálogo.'],
      ['rates','Tarifas del cotizador','Precios por formato, caras y acabados.'],
      ['content','Textos y respuestas','Mensajes de la web, preguntas frecuentes y Grafibot.'],
      ['campaigns','Promociones','Activa ofertas o sorteos desde aquí.'],
      ['customers','Clientes y pedidos','Consulta los datos de tus clientes y su historial.'],
      ['library','Biblioteca','Añade los enlaces y organiza tus libros.'],
      ['contact','Contacto y enlaces','Ubicación, correo y enlaces de pedido.'],
      ['access','Mi acceso','Estado de tu cuenta y opciones de seguridad.']
    ];
    const configurationKeys=new Set(['images','services','products','rates','content','library','contact']);
    const panes=new Map();
    const buttons=new Map();
    let selected='overview';
    let dirty=false;
    const dirtyState=make('span','owner-save-state','Todo listo para editar');
    dirtyState.setAttribute('role','status');
    for(const [key,label,description] of categories){
      const button=make('button','owner-nav-item',label);
      button.type='button';button.dataset.ownerTarget=key;
      button.setAttribute('aria-controls','owner-pane-'+key);
      button.setAttribute('aria-pressed',String(key===selected));
      button.onclick=()=>show(key);
      navigation.append(button);buttons.set(key,button);
      const section=make('section','owner-pane');
      section.id='owner-pane-'+key;section.dataset.ownerPane=key;
      section.setAttribute('aria-label',label);section.hidden=key!==selected;
      section.append(make('h3','owner-pane-title',label),make('p','owner-pane-description',description));
      (configurationKeys.has(key)?form:main).append(section);
      panes.set(key,section);
    }
    const originalActions=form.querySelector('.gp-campaign-admin-actions');
    const feedback=document.getElementById('gp-settings-feedback');
    const savebar=make('div','owner-savebar');
    savebar.append(dirtyState,originalActions,feedback);
    form.append(savebar);
    const cloud=document.getElementById('gp-cloud-panel');
    main.prepend(cloud);
    const overview=panes.get('overview');
    overview.append(make('p','owner-welcome','¿Qué quieres actualizar hoy?'));
    const cards=make('div','owner-shortcuts');
    const shortcuts=[
      ['services','Actualizar un servicio','Edita el nombre, la descripción y sus fotos.'],
      ['products','Cambiar un producto','Corrige el catálogo y sus imágenes.'],
      ['campaigns','Publicar una promoción','Define la oferta y activa el anuncio.'],
      ['customers','Consultar pedidos','Busca un cliente y revisa sus compras.'],
      ['rates','Ajustar mis precios','Actualiza las tarifas del cotizador.'],
      ['images','Renovar las imágenes','Cambia el logo, los colores y la galería.']
    ];
    for(const [key,label,description] of shortcuts){
      const button=make('button','owner-shortcut');button.type='button';
      button.append(make('strong','',label),make('span','',description));
      button.onclick=()=>show(key);cards.append(button);
    }
    overview.append(cards);
    const preview=make('button','owner-preview-link','Ver la página');
    preview.type='button';preview.onclick=()=>root.querySelector('#gp-home').scrollIntoView({behavior:'smooth'});
    overview.append(preview);
    const deliveryLink=panel.querySelector('a[href="./delivery-admin.html"]');
    if(deliveryLink)panes.get('customers').append(deliveryLink.closest('p'));
    const access=panes.get('access');
    const session=make('p','owner-session-summary','Ingresa con la cuenta verificada del propietario.');
    const authResult=make('p','owner-auth-result');authResult.setAttribute('role','status');
    const verify=make('button','gp-button secondary','Comprobar mi sesión');
    verify.type='button';verify.onclick=()=>{
      verify.disabled=true;authResult.textContent='Comprobando la cuenta…';
      window.dispatchEvent(new window.Event('gp-owner-revalidate'));
    };
    const reset=make('button','gp-button secondary','Cambiar mi contraseña por correo');
    reset.type='button';reset.onclick=()=>{
      const email=document.getElementById('gp-settings-owner-email');
      if(!email.value){authResult.textContent='Vuelve a ingresar para confirmar el correo del propietario.';return;}
      document.getElementById('gp-settings-reset').click();
    };
    access.append(session,make('p','owner-pane-description','El enlace de contraseña llegará al correo de tu cuenta.'),verify,reset,authResult);

    const productFilter=make('input','owner-product-filter');
    productFilter.type='search';productFilter.placeholder='Buscar un producto para editar';
    productFilter.setAttribute('aria-label','Buscar un producto para editar');
    panes.get('products').append(productFilter);
    function filterProducts(){
      const query=productFilter.value.trim().toLocaleLowerCase('es');
      panes.get('products').querySelectorAll('.owner-product-card').forEach(card=>{
        const name=card.querySelector('[data-copy-field="name"]')?.value||card.textContent;
        card.hidden=!name.toLocaleLowerCase('es').includes(query);
      });
    }
    productFilter.oninput=filterProducts;
    function groupProducts(editor){
      if(!editor)return;
      const labels=Array.from(editor.children).filter(node=>node.tagName==='LABEL'&&node.querySelector('[data-product-copy]'));
      if(!labels.length)return;
      const groups=new Map();
      for(const label of labels){
        const input=label.querySelector('[data-product-copy]');
        const id=input.dataset.productCopy;
        if(!groups.has(id)){
          const card=make('article','owner-product-card');
          const title=make('h4','');
          card.append(title);editor.append(card);groups.set(id,card);
        }
        const card=groups.get(id);card.append(label);
        if(input.dataset.copyField==='name')card.querySelector('h4').textContent=input.value;
      }
      filterProducts();
    }
    function move(node,key){
      const target=panes.get(key);
      if(node&&node.parentElement!==target)target.append(node);
    }
    function moveField(id,key){move(document.getElementById(id)?.closest('label'),key)}
    function moveDetails(id,key){move(document.getElementById(id)?.closest('details'),key)}
    function reconcile(){
      move(document.getElementById('gp-library-settings'),'library');
      moveField('gp-settings-brand','images');
      moveField('gp-settings-logo','images');
      moveField('gp-settings-route-bg','images');
      moveDetails('gp-gallery-editor','images');
      move(document.getElementById('gp-page-images'),'images');
      moveDetails('gp-service-images-editor','services');
      move(document.getElementById('gp-product-editor'),'products');
      groupProducts(document.getElementById('gp-product-editor'));
      moveDetails('gp-rates-editor','rates');
      move(document.getElementById('gp-quote-services-editor'),'rates');
      moveDetails('gp-faq-editor','content');
      move(document.getElementById('gp-text-settings'),'content');
      moveDetails('gp-ai-enabled','content');
      for(const id of ['gp-settings-map','gp-settings-phone','gp-settings-email','gp-settings-sublimacion','gp-settings-textil'])moveField(id,'contact');
      move(document.getElementById('gp-campaign-admin'),'campaigns');
      move(panel.querySelector('.gp-store-admin'),'customers');
      const services=document.getElementById('gp-service-images-editor')?.closest('details');
      const title=services?.querySelector('summary');
      if(title&&title.textContent!=='Portada y servicios')title.textContent='Portada y servicios';
      const help=services?.querySelector('p');
      const message='Edita cada servicio y sube sus fotos desde tu PC o celular. Después pulsa Guardar cambios.';
      if(help&&help.textContent!==message)help.textContent=message;
    }
    reconcile();
    function show(key){
      selected=key;
      panes.forEach((pane,name)=>pane.hidden=name!==key);
      buttons.forEach((button,name)=>button.setAttribute('aria-pressed',String(name===key)));
      form.hidden=!configurationKeys.has(key);
      if(key==='campaigns'&&root.dataset.ownerAccess==='verified')document.getElementById('gp-campaign-admin').hidden=false;
      if(key==='products')filterProducts();
    }
    show(selected);
    window.addEventListener('gp-open-rates',()=>{if(root.dataset.ownerAccess!=='verified')return;panel.hidden=false;show('rates');panel.scrollIntoView({behavior:'smooth'});});
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'))reconcile();
    });
    observer.observe(panel,{subtree:true,childList:true});
    let validationPane=null;
    panel.addEventListener('invalid',event=>{
      const pane=event.target.closest('[data-owner-pane]');
      if(!pane)return;
      if(validationPane){event.stopPropagation();return;}
      validationPane=pane;
      show(pane.dataset.ownerPane);
      queueMicrotask(()=>validationPane=null);
    },true);
    function markDirty(){
      dirty=true;dirtyState.textContent='Tienes cambios sin guardar';savebar.dataset.state='dirty';
    }
    form.addEventListener('input',event=>{
      if(event.target===productFilter)return;
      markDirty();
      const card=event.target.closest('.owner-product-card');
      if(card&&event.target.dataset.copyField==='name')card.querySelector('h4').textContent=event.target.value;
    });
    form.addEventListener('change',event=>{if(event.target!==productFilter)markDirty()});
    form.addEventListener('click',event=>{
      if(event.target.closest('#gp-service-images-editor button,#gp-gallery-add,#gp-faq-add,#gp-gallery-editor button,#gp-faq-editor button'))markDirty();
    });
    document.getElementById('gp-settings-campaign').addEventListener('click',()=>show('campaigns'));
    document.getElementById('gp-campaign-close').addEventListener('click',()=>show('overview'));
    window.addEventListener('gp-owner-save',event=>{
      if(event.detail==='saved'){dirty=false;dirtyState.textContent='Cambios guardados';savebar.dataset.state='saved'}
      if(event.detail==='saving'){dirtyState.textContent='Guardando cambios…';savebar.dataset.state='saving'}
      if(event.detail==='error'){dirtyState.textContent='Revisa el aviso de guardado';savebar.dataset.state='error'}
    });
    window.addEventListener('gp-owner-session',event=>{
      const user=event.detail;verify.disabled=false;
      accountLine.textContent=user?.email||'Cuenta del propietario';
      session.textContent=user?'Cuenta verificada · '+(user.email||'Propietario'):'Ingresa con la cuenta verificada del propietario.';
      if(user)document.getElementById('gp-settings-owner-email').value=user.email||'';
      if(!user){passwordReset();dirty=false;dirtyState.textContent='Todo listo para editar';authResult.textContent='';show('overview')}
    });
    window.addEventListener('gp-owner-auth-feedback',event=>{verify.disabled=false;authResult.textContent=event.detail});
    window.addEventListener('beforeunload',event=>{
      if(dirty&&!panel.hidden){event.preventDefault();event.returnValue=''}
    });

    function passwordReset(){
      const input=document.getElementById('gp-settings-owner-password');
      input.value='';input.type='password';
      const control=document.querySelector('.owner-password-toggle');
      if(control){control.textContent='Mostrar contraseña';control.setAttribute('aria-pressed','false')}
    }
    const password=document.getElementById('gp-settings-owner-password');
    const toggle=make('button','owner-password-toggle','Mostrar contraseña');
    toggle.type='button';toggle.setAttribute('aria-pressed','false');
    toggle.onclick=()=>{
      const visible=password.type==='password';password.type=visible?'text':'password';
      toggle.textContent=visible?'Ocultar contraseña':'Mostrar contraseña';toggle.setAttribute('aria-pressed',String(visible));
    };
    password.parentElement.append(toggle);
    document.getElementById('gp-settings-cancel').addEventListener('click',()=>{
      password.value='';password.type='password';toggle.textContent='Mostrar contraseña';toggle.setAttribute('aria-pressed','false');
    });
    document.getElementById('gp-settings-retry')?.addEventListener('click',()=>window.location.reload());
    window.dispatchEvent(new window.Event('gp-owner-panel-ready'));
  }
  if(document.readyState==='complete')initializeOwnerPanel();
  else document.addEventListener('DOMContentLoaded',initializeOwnerPanel,{once:true});
})();
