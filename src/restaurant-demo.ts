import { demoCopy } from './demo-copy';
import type { Locale } from './content';
import './restaurant-demo.css';

const section = document.querySelector<HTMLElement>('.restaurant-demo');
const panel = document.querySelector<HTMLElement>('#demo-panel');
const slot = document.querySelector<HTMLElement>('#demo-chat-slot');
const chooser = document.querySelector<HTMLElement>('.demo-chooser');
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.demo-tab')];
const locale = (document.documentElement.lang === 'en' || document.documentElement.lang === 'ca' ? document.documentElement.lang : 'es') as Locale;
const c = demoCopy[locale];
const restaurants = [
  { slug: 'ko', name: 'Kō', art: '/restaurantes/ko/chat-assets/garden.webp' },
  { slug: 'vita', name: 'Vita', art: '/restaurantes/vita/chat-assets/garden.webp' },
  { slug: 'pica-pica', name: 'Pica Pica', art: '/demos/pica-pica/chat-assets/coast.webp' },
];
let active = 2;
let frame: HTMLIFrameElement | null = null;
let activated = false;
let timeout: number | undefined;
const status = slot?.querySelector<HTMLElement>('.demo-frame-status');
const statusText = status?.querySelector('p');
const retry = document.querySelector<HTMLButtonElement>('#demo-retry');

function mountChat() {
  if (!slot) return;
  const restaurant = restaurants[active];
  window.clearTimeout(timeout);
  frame?.contentWindow?.postMessage({ type: 'platefy:pause' }, location.origin);
  frame?.remove();
  if (status) status.hidden = false;
  if (statusText) statusText.textContent = c.loading;
  if (retry) retry.hidden = true;
  frame = document.createElement('iframe');
  frame.title = `platefy · ${restaurant.name}`;
  frame.className = 'demo-chat-frame';
  frame.allow = 'microphone';
  frame.inert = true;
  frame.src = `/demo/chat/?restaurant=${restaurant.slug}&lang=${locale}`;
  // One browsing context at a time: navigation destroys the previous tenant's memory and audio.
  slot.append(frame);
  timeout = window.setTimeout(() => {
    if (!status?.hidden) { if (statusText) statusText.textContent = c.error; if (retry) retry.hidden = false; }
  }, 20000);
}

function choose(index: number, focus = false) {
  const next = (index + restaurants.length) % restaurants.length;
  const changed = next !== active;
  active = next;
  const restaurant = restaurants[active];
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === active)); tab.tabIndex = i === active ? 0 : -1; });
  if (panel) { panel.dataset.theme = restaurant.slug; panel.setAttribute('aria-labelledby', `demo-tab-${restaurant.slug}`); }
  const name = document.querySelector('#demo-restaurant-name');
  const story = document.querySelector('#demo-restaurant-story');
  const art = document.querySelector<HTMLImageElement>('#demo-artwork');
  if (name) name.textContent = restaurant.name;
  if (story) story.textContent = c.stories[active];
  if (art) { art.src = restaurant.art; art.width = active === 2 ? 900 : 800; art.height = active === 2 ? 900 : 800; }
  if (focus) tabs[active]?.focus({ preventScroll: true });
  if (chooser && window.matchMedia('(max-width: 700px)').matches) {
    const tab = tabs[active];
    chooser.scrollTo({ left: tab.offsetLeft - chooser.offsetLeft - (chooser.clientWidth - tab.clientWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  if (changed && activated) mountChat();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => choose(index));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? active + 1 : event.key === 'ArrowLeft' ? active - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next !== null) { event.preventDefault(); choose(next, true); }
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-demo-step]').forEach(button => button.addEventListener('click', () => choose(active + Number(button.dataset.demoStep))));
let touchX = 0;
let touchY = 0;
chooser?.addEventListener('touchstart', event => { touchX = event.changedTouches[0].clientX; touchY = event.changedTouches[0].clientY; }, { passive: true });
chooser?.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - touchX;
  const dy = event.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) choose(active + (dx < 0 ? 1 : -1));
}, { passive: true });
retry?.addEventListener('click', mountChat);
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
  if (event.data?.type === 'platefy:error' && event.data.restaurant === restaurants[active].slug) {
    window.clearTimeout(timeout);
    if (status) status.hidden = false;
    if (statusText) statusText.textContent = c.error;
    if (retry) retry.hidden = false;
  }
  if (event.data?.type === 'platefy:ready' && event.data.restaurant === restaurants[active].slug) {
    window.clearTimeout(timeout);
    if (status) status.hidden = true;
    if (frame) frame.inert = false;
  }
});
window.addEventListener('pagehide', () => { window.clearTimeout(timeout); frame?.contentWindow?.postMessage({ type: 'platefy:pause' }, location.origin); });
if (section) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && !activated) { activated = true; mountChat(); observer.disconnect(); }
  }, { rootMargin: '250px' });
  observer.observe(section);
}
choose(active);
