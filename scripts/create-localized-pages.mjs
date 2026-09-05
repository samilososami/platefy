import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, process.env.APPDEPLOY_VITE_OUT_DIR || 'dist');
const source = await readFile(path.join(projectRoot, 'src/landing-static.ts'), 'utf8');
const literal = source.match(/const copy: Record<Locale, PageCopy> = (\{[\s\S]*?\n\});\n\nconst languageSelect/)?.[1];

if (!literal) throw new Error('Could not read localized landing copy');

const pages = Function(`"use strict"; return (${literal});`)();
const rootHtml = await readFile(path.join(distRoot, 'index.html'), 'utf8');
const locales = {
  en: { directory: 'en', url: 'https://platefy.samilososami.com/en/', ogLocale: 'en_US' },
  ca: { directory: 'ca', url: 'https://platefy.samilososami.com/ca/', ogLocale: 'ca_ES' },
};

function setMeta(document, selector, value) {
  document.querySelector(selector)?.setAttribute('content', value);
}

for (const [locale, route] of Object.entries(locales)) {
  const page = pages[locale];
  const dom = new JSDOM(rootHtml);
  const { document } = dom.window;

  document.documentElement.lang = locale;
  document.title = page.title;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', route.url);
  setMeta(document, 'meta[name="description"]', page.description);
  setMeta(document, 'meta[property="og:locale"]', route.ogLocale);
  setMeta(document, 'meta[property="og:title"]', page.title);
  setMeta(document, 'meta[property="og:description"]', page.description);
  setMeta(document, 'meta[property="og:url"]', route.url);
  setMeta(document, 'meta[property="og:image:alt"]', page.imageAlt);
  setMeta(document, 'meta[name="twitter:title"]', page.title);
  setMeta(document, 'meta[name="twitter:description"]', page.description);
  setMeta(document, 'meta[name="twitter:image:alt"]', page.imageAlt);

  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (key && page.text[key]) node.textContent = page.text[key];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => {
    const key = node.getAttribute('data-i18n-aria');
    if (key && page.text[key]) node.setAttribute('aria-label', page.text[key]);
  });
  document.querySelectorAll('a.brand').forEach(node => node.setAttribute('href', `/${locale}/`));
  document.querySelectorAll('#language-select option').forEach(option => {
    if (option.getAttribute('value') === locale) option.setAttribute('selected', '');
    else option.removeAttribute('selected');
  });

  const schemaNode = document.querySelector('script[type="application/ld+json"]');
  if (schemaNode?.textContent) {
    const schema = JSON.parse(schemaNode.textContent);
    const organization = schema['@graph'].find(item => item['@type'] === 'Organization');
    const software = schema['@graph'].find(item => item['@type'] === 'SoftwareApplication');
    const faq = schema['@graph'].find(item => item['@type'] === 'FAQPage');
    organization.description = page.description;
    software.description = page.description;
    faq.mainEntity = [1, 2, 3].map(index => ({
      '@type': 'Question',
      name: page.text[`faq.${index}.q`],
      acceptedAnswer: { '@type': 'Answer', text: page.text[`faq.${index}.a`] },
    }));
    schemaNode.textContent = JSON.stringify(schema);
  }

  const outputDirectory = path.join(distRoot, route.directory);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'index.html'), dom.serialize());
}

console.log('Created localized landing pages: /en/ and /ca/');
