import fs from 'fs';

const content = fs.readFileSync('docs/relatorio-final-apm-utp.html', 'utf8');
const pageMatches = content.split('<div class="page"');
console.log('Total page divs in HTML:', pageMatches.length - 1);

pageMatches.slice(1).forEach((p, idx) => {
  const pageNumMatch = p.match(/<div class="page-number">(\d+)<\/div>/);
  const num = pageNumMatch ? pageNumMatch[1] : (idx === 0 ? 'Capa' : (idx === 1 ? 'Folha de Rosto' : 'sem numero'));
  
  // Extract main headings
  const h1Match = p.match(/<h1[^>]*>(.*?)<\/h1>/);
  const h2Matches = [...p.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(m => m[1]);
  const figMatches = [...p.matchAll(/class="figure-caption-top">(.*?)<\/div>/g)].map(m => m[1]);
  const sourceMatches = [...p.matchAll(/class="figure-source-bottom">(.*?)<\/div>/g)].map(m => m[1]);
  const hasPre = p.includes('<pre');
  
  console.log(`\n--- PÁGINA ${idx + 1} (Exibido: ${num}) ---`);
  if (h1Match) console.log(`  H1: ${h1Match[1].replace(/<[^>]+>/g, '').trim()}`);
  if (h2Matches.length) console.log(`  H2: ${h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).join(' | ')}`);
  if (figMatches.length) console.log(`  FIG/QUADRO: ${figMatches.map(f => f.replace(/<[^>]+>/g, '').trim()).join(' | ')}`);
  if (sourceMatches.length) console.log(`  FONTES: ${sourceMatches.map(s => s.replace(/<[^>]+>/g, '').trim()).join(' | ')}`);
  if (hasPre) console.log(`  [TEM BLOCO DE CÓDIGO PRE]`);
});
