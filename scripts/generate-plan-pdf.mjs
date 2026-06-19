#!/usr/bin/env node
/**
 * Génère docs/SeNote-plan-tablette-complet.pdf
 * Usage: npx -y puppeteer node scripts/generate-plan-pdf.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docs = join(root, 'docs');

function read(path) {
  return readFileSync(join(docs, path), 'utf8');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inCode = false;
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listType = 'ul';

  const flushTable = () => {
    if (!tableRows.length) return;
    const [head, ...body] = tableRows;
    const headers = head.split('|').slice(1, -1).map((c) => c.trim());
    out.push('<div class="table-wrap"><table>');
    out.push(`<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`);
    for (const row of body) {
      if (/^[\s|:-]+$/.test(row)) continue;
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      out.push(`<tr>${cells.map((c) => `<td>${inlineMd(c)}</td>`).join('')}</tr>`);
    }
    out.push('</table></div>');
    tableRows = [];
    inTable = false;
  };

  const closeList = () => {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith('```')) {
      closeList();
      flushTable();
      if (!inCode) {
        inCode = true;
        out.push('<pre><code>');
      } else {
        inCode = false;
        out.push('</code></pre>');
      }
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(line) + '\n');
      continue;
    }

    if (line.startsWith('|')) {
      closeList();
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.match(/^#{1,6} /)) {
      closeList();
      const level = line.match(/^(#+)/)[1].length;
      const text = line.replace(/^#+\s*/, '');
      out.push(`<h${level}>${inlineMd(text)}</h${level}>`);
      continue;
    }

    if (line.match(/^[-*] /)) {
      if (!inList || listType !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      out.push(`<li>${inlineMd(line.slice(2))}</li>`);
      continue;
    }

    if (line.match(/^\d+\. /)) {
      if (!inList || listType !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${inlineMd(line.replace(/^\d+\.\s*/, ''))}</li>`);
      continue;
    }

    if (line.trim() === '---') {
      closeList();
      out.push('<hr>');
      continue;
    }

    if (line.trim() === '') {
      closeList();
      continue;
    }

    closeList();
    out.push(`<p>${inlineMd(line)}</p>`);
  }

  closeList();
  flushTable();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return s;
}

function csvToTable(csv, title) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(';');
  const rows = lines.slice(1).map((line) => line.split(';'));

  const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h.replace(/_/g, ' '))}</th>`).join('')}</tr>`;
  const tbody = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `
    <section class="csv-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="table-wrap">
        <table class="data">${thead}${tbody}</table>
      </div>
    </section>`;
}

const businessPlan = read('tablette-business-plan.md')
  .replace(/## 7\. Fichiers CSV[\s\S]*$/m, '');

const checklist = read('fournisseur-checklist.md');

const csvSections = [
  ['feuille-de-route-kpi.csv', 'Annexe A — Feuille de route KPI (mois par mois)'],
  ['tablette-couts.csv', 'Annexe B — Coûts par scénario de commande'],
  ['tablette-marges.csv', 'Annexe C — Marges stock 30 / 100 / 200 kits'],
  ['tablette-marche-an1.csv', 'Annexe D — Marché année 1 (prudent / médian / optimiste)'],
  ['tablette-marche-an3.csv', 'Annexe E — Marché cumulé 3 ans'],
].map(([file, title]) => csvToTable(read(file), title)).join('\n');

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>SeNote — Plan tablette + stylet</title>
  <style>
    @page { margin: 18mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .cover {
      page-break-after: always;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2rem 0;
    }
    .cover h1 { font-size: 28pt; margin: 0 0 0.5rem; color: #c45c00; }
    .cover .subtitle { font-size: 14pt; color: #444; margin-bottom: 2rem; }
    .cover .meta { font-size: 11pt; color: #666; line-height: 1.8; }
    .cover .highlight {
      margin-top: 2rem;
      padding: 1rem 1.25rem;
      background: #fff8f0;
      border-left: 4px solid #c45c00;
      font-size: 11pt;
    }
    h1 { font-size: 20pt; color: #c45c00; margin-top: 1.5rem; page-break-after: avoid; }
    h2 { font-size: 14pt; color: #333; margin-top: 1.25rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.25rem; page-break-after: avoid; }
    h3 { font-size: 12pt; margin-top: 1rem; page-break-after: avoid; }
    p, li { orphans: 3; widows: 3; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 0.75rem 0 1rem;
    }
    th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    .table-wrap { page-break-inside: avoid; }
    pre, code { font-family: Menlo, Consolas, monospace; font-size: 8pt; background: #f4f4f4; }
    pre { padding: 0.75rem; border-radius: 4px; white-space: pre-wrap; word-break: break-word; }
    code { padding: 1px 4px; border-radius: 3px; }
    ul, ol { padding-left: 1.25rem; }
    hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
    .toc { page-break-after: always; }
    .toc h2 { border: none; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { padding: 0.35rem 0; border-bottom: 1px dotted #ddd; }
    .section-break { page-break-before: always; }
    .csv-section h2 { color: #c45c00; font-size: 12pt; }
    .footer-note { margin-top: 2rem; font-size: 9pt; color: #888; text-align: center; }
  </style>
</head>
<body>

<div class="cover">
  <h1>SeNote</h1>
  <p class="subtitle">Plan chiffré — Kit tablette + stylet</p>
  <p class="meta">
    Marché : Sénégal · Élèves &amp; étudiants<br>
    Feuille de route + tableaux financiers + checklist fournisseur<br>
    Juin 2026
  </p>
  <div class="highlight">
    <strong>Scénario médian cible (an 1)</strong><br>
    Prix 70 000 XOF · 1 650 kits · CA 115 M XOF · Bénéfice net ~65 M XOF
  </div>
</div>

<nav class="toc">
  <h2>Sommaire</h2>
  <ul>
    <li>1. Feuille de route détaillée</li>
    <li>2. Tableaux financiers (coûts, marges, marché an 1 &amp; 3 ans)</li>
    <li>3. Checklist fournisseur Alibaba</li>
    <li>4. Annexes CSV (KPI mensuels, coûts, marges, marché)</li>
  </ul>
</nav>

<main>
  ${mdToHtml(businessPlan)}

  <div class="section-break"></div>
  <h1>Checklist fournisseur</h1>
  ${mdToHtml(checklist)}

  <div class="section-break"></div>
  <h1>Annexes — données tabulaires</h1>
  <p>Tableaux exportés depuis les fichiers CSV du dossier docs/.</p>
  ${csvSections}

  <p class="footer-note">
    SeNote · Formules : CA = Prix × Qté · Bénéfice net = (Prix − Coût) × Qté × 0,95
  </p>
</main>

</body>
</html>`;

const htmlPath = join(docs, 'SeNote-plan-tablette-complet.html');
const pdfPath = join(docs, 'SeNote-plan-tablette-complet.pdf');

writeFileSync(htmlPath, html, 'utf8');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate:
    '<div style="width:100%;font-size:8px;text-align:center;color:#999;padding:0 15mm;">SeNote — Plan tablette · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();

console.log(`PDF généré : ${pdfPath}`);
console.log(`HTML source : ${htmlPath}`);
