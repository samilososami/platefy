import type { RestaurantMenu } from './services/restaurant';

const data = document.querySelector('#restaurant-data');
if (data?.textContent) {
  const menu: RestaurantMenu = JSON.parse(data.textContent);
  const dialog = document.querySelector<HTMLDialogElement>('#dish-dialog')!;
  const content = document.querySelector<HTMLDivElement>('#dish-dialog-content')!;
  let opener: HTMLElement | null = null;
  const close = () => { dialog.close(); opener?.focus(); };
  document.querySelector('.dialog-close')?.addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  const paragraph = (text: string, className = '') => { const p = document.createElement('p'); p.textContent = text; p.className = className; return p; };
  document.querySelectorAll<HTMLButtonElement>('[data-dish]').forEach(button => button.addEventListener('click', () => {
    const dish = menu.platos.find(item => item.id === button.dataset.dish);
    if (!dish) return;
    opener = button; content.replaceChildren();
    if (dish.imagen) { const img = document.createElement('img'); img.src = dish.imagen; img.alt = dish.imagen_alt || dish.nombre; img.width = 900; img.height = 600; content.append(img); }
    const body = document.createElement('div'); body.className = 'dish-dialog-body';
    const h2 = document.createElement('h2'); h2.id = 'dish-dialog-title'; h2.textContent = dish.nombre;
    body.append(h2, paragraph(new Intl.NumberFormat('es', {style:'currency',currency:'EUR'}).format(dish.precio), 'dialog-price'), paragraph(dish.descripcion));
    for (const [title, text] of [['Ingredientes',dish.ingredientes.join(', ')], ['Alérgenos declarados',dish.alergenos.length ? dish.alergenos.map(a => a.replace(/_/g,' ')).join(', ') : 'No indicados en esta receta de muestra. Confirma siempre con el restaurante.']]) {
      const h3 = document.createElement('h3'); h3.textContent = title; body.append(h3, paragraph(text));
    }
    body.append(paragraph(menu.restaurante.aviso_alergenos, 'dialog-note'));
    if (dish.imagen) body.append(paragraph('Imagen ilustrativa generada.', 'dialog-note'));
    const link = document.createElement('a'); link.className = 'menu-button'; link.href = `/restaurantes/${menu.restaurante.slug}/platefy/?dish=${encodeURIComponent(dish.id)}`; link.textContent = 'Preguntar a platefy por este plato'; body.append(link);
    content.append(body); dialog.showModal();
  }));
  document.querySelectorAll<HTMLElement>('.dish').forEach(dish => dish.addEventListener('click', event => { if (!(event.target as Element).closest('button')) dish.querySelector<HTMLButtonElement>('button')?.click(); }));
  const normal = (text:string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelector<HTMLInputElement>('#dish-search')?.addEventListener('input', event => {
    const query = normal((event.target as HTMLInputElement).value.trim()); let visible = 0;
    document.querySelectorAll<HTMLElement>('.dish').forEach(dish => { dish.hidden = !normal(dish.dataset.search || '').includes(query); if (!dish.hidden) visible++; });
    document.querySelectorAll<HTMLElement>('.menu-section').forEach(section => section.hidden = !section.querySelector('.dish:not([hidden])'));
    document.querySelector<HTMLElement>('#menu-empty')!.hidden = visible > 0;
  });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll<HTMLAnchorElement>('.category-nav a').forEach(link => link.classList.toggle('is-active',link.hash === `#${entry.target.id}`));
  },{rootMargin:'-15% 0px -70% 0px'});
  document.querySelectorAll('.menu-section').forEach(section=>observer.observe(section));
}
