// Tmavý režim: z existujúcich štýlov vygeneruje app/theme-dark.css (všetko pod html[data-theme="dark"]).
// Spúšťa sa po každej zmene CSS: node scripts/build-dark.mjs (kontrola: node scripts/build-dark.mjs --check).
//
// Ako to funguje: každé pravidlo, ktoré nastavuje farbu, pozadie, rámik, obrys alebo tieň, sa skopíruje
// s predponou html[data-theme="dark"] (vyššia špecificita) — aj keď sa jeho farba nemení. Vďaka tomu v tmavom
// režime vyhráva vždy to isté pravidlo ako vo svetlom, len s prepočítanou farbou. Svetlé plochy stmavne
// (biela karta = o stupeň svetlejšia než stránka), tmavý text zosvetlí, rámiky stlmí. Sýte akcenty
// (limetková, farby strán z inline štýlov) a už tmavé plochy ostávajú. Hry majú vlastný svet a neprevádzajú sa.
import postcss from 'postcss';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'app/theme-dark.css';
const OUT_COLORS = 'lib/theme-colors.ts';
const SKIP_FILES = new Set(['theme-dark.css', 'daily-game.css', 'december-game.css', 'december-town-art.css', 'republic-game.css']);
// Poradie ako v aplikácii: layout (globals → magazine → news), potom komponenty.
const FIRST = ['globals.css', 'magazine.css', 'news.css'];
// Podklady pod logami, portrétmi a mapkou ostávajú presne ako vo svetlom režime (logá strán sú kreslené na svetlú):
// triedy končiace na -logo (.party-card-logo, .party-rail-logo …), značky vlád, monogramy, obrázky log v zdrojoch.
const KEEP_SELECTOR = /-logo(?![\w-])|resp-mark|person-portrait|monogram|party-logo-sources a (img|svg)|section-art img|slovakia-mark|theme-switch|\.story\b|\.story-|games-republic-art|games-town|games-parliament/;
// SVG grafy s farbami v atribútoch (Recharts, časová os vlád): prefarbia sa cez selektory na atribút.
const SVG_SOURCES = ['components/finance-chart.tsx', 'components/trend-chart.tsx', 'components/living-chart.tsx', 'components/archive-chart.tsx', 'components/responsibility-page.tsx'];
const SVG_SCOPE = ':is([data-slot="chart"],.resp-timeline,.resp-timeline-names)';
const PREFIX = 'html[data-theme="dark"]';
const INK_HUE = 152;                                   // odtieň tmavozelenej --mag-ink; neutrálne plochy ho jemne preberú

// ---------- farby (HSL + chróma, aby takmer biele farby nezískali falošnú sýtosť) ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function parseColor(s) {
  s = s.trim().toLowerCase();
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(v => v.endsWith('%') ? Number(v.slice(0, -1)) / 100 : Number(v));
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  return null;
}
function analyze({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min, l = (max + min) / 2;
  let h = 0;
  if (c) h = 60 * (max === r ? ((g - b) / c + (g < b ? 6 : 0)) : max === g ? (b - r) / c + 2 : (r - g) / c + 4);
  return { h, c, l, s: c ? c / (1 - Math.abs(2 * l - 1)) : 0 };
}
function build(h, chroma, l, a = 1) {
  l = clamp(l);
  const room = 1 - Math.abs(2 * l - 1);
  const s = room ? clamp(chroma / room) : 0;
  const k = n => (n + h / 30) % 12, f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const hex = v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}${a < 1 ? hex(a) : ''}`;
}
const isAccent = x => x.s >= 0.45 && x.c >= 0.18 && x.l >= 0.45 && x.l <= 0.9;
// Plocha: svetlé → tmavé; biela (karty) je o stupeň svetlejšia než podklad stránky.
function surface(x, a) {
  const l = x.l >= 0.985 ? 0.16 : clamp(0.1 + (0.985 - x.l) * 0.55, 0.085, 0.32);
  const neutral = x.c < 0.03;
  return build(neutral ? INK_HUE : x.h, neutral ? 0.022 : Math.min(0.09, x.c * 0.75), l, a);
}
const lightText = (x, a) => build(x.h, Math.min(0.5, x.c * 0.85), clamp(0.95 - x.l * 0.5, 0.66, 0.93), a);
function mapColor(c, role) {
  const x = analyze(c);
  switch (role) {
    case 'bg': return x.l < 0.5 || isAccent(x) ? null : surface(x, c.a);
    case 'text': return x.l >= 0.55 ? null : lightText(x, c.a);
    case 'border':
      if (x.l >= 0.6) return build(x.c < 0.03 ? INK_HUE : x.h, Math.min(0.05, x.c * 0.6 + 0.01), clamp(0.19 + (1 - x.l) * 0.45, 0.19, 0.38), c.a);
      if (x.l < 0.32) return build(x.h, Math.min(0.3, x.c * 0.8), clamp(0.72 - x.l * 0.5, 0.55, 0.75), c.a);
      return null;
    case 'fill':                                        // SVG tvary: svetlé plochy stmavnú, tmavé čiary a body zosvetlia
      if (x.l >= 0.9 && !isAccent(x)) return surface(x, c.a);
      return x.l < 0.45 ? lightText(x, c.a) : null;
    case 'stroke':
      if (x.l >= 0.8 && !isAccent(x)) return build(x.c < 0.03 ? INK_HUE : x.h, Math.min(0.05, x.c * 0.6 + 0.01), clamp(0.2 + (1 - x.l) * 0.5, 0.2, 0.36), c.a);
      return x.l < 0.45 ? lightText(x, c.a) : null;
    case 'shadow': return x.l >= 0.8 ? surface(x, c.a) : null;   // svetlé „prstence“ okolo prvkov; tmavé tiene ostávajú
    default: return null;
  }
}
// Rodiny vlastností. „keep“ = kopíruje sa bez zmeny (kvôli poradiu v kaskáde, napr. border-width po border).
function roleOf(prop) {
  if (/^(color|caret-color|accent-color|-webkit-text-fill-color|text-decoration(-color)?|stop-color|flood-color)$/.test(prop)) return 'text';
  if (prop === 'fill') return 'fill';
  if (prop === 'stroke') return 'stroke';
  if (/^background(-color|-image)?$/.test(prop)) return 'bg';
  if (/^(background-|mask)/.test(prop)) return 'keep';
  if (/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?-(radius|collapse|spacing)$/.test(prop)) return null;
  if (/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?$/.test(prop) || /^(outline(-color)?|column-rule(-color)?)$/.test(prop)) return 'border';
  if (/^(border|outline|column-rule)/.test(prop)) return 'keep';
  if (prop === 'box-shadow' || prop === 'text-shadow') return 'shadow';
  return null;
}

// ---------- súbory a premenné z :root ----------
const all = readdirSync('app').filter(f => f.endsWith('.css') && !SKIP_FILES.has(f));
const files = [...FIRST.filter(f => all.includes(f)), ...all.filter(f => !FIRST.includes(f)).sort()];
const parsed = files.map(f => [f, postcss.parse(readFileSync(`app/${f}`, 'utf8'), { from: `app/${f}` })]);
const tokens = {};                                      // neskoršia definícia vyhráva (magazine.css prepisuje globals.css)
for (const [, root] of parsed) root.each(node => {
  if (node.type === 'rule' && /^(:root|html)$/.test(node.selector.trim())) node.walkDecls(d => { if (d.prop.startsWith('--')) tokens[d.prop] = d.value.trim(); });
});
const resolve = (name, depth = 0) => {
  const v = tokens[name];
  if (!v || depth > 6) return null;
  const m = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  return m ? resolve(m[1], depth + 1) : v;
};
// Premenné, ktoré tmavý režim prepisuje na úrovni stránky (triedy Tailwindu v dialógoch a paneloch ich čítajú).
const TOKEN_ROLES = {
  '--background': 'bg', '--card': 'bg', '--popover': 'bg', '--secondary': 'bg', '--muted': 'bg', '--accent': 'bg',
  '--tint': 'bg', '--tint-2': 'bg', '--tint-3': 'bg', '--mag-paper': 'bg', '--mag-green': 'bg',
  '--foreground': 'text', '--card-foreground': 'text', '--popover-foreground': 'text', '--secondary-foreground': 'text',
  '--muted-foreground': 'text', '--accent-foreground': 'text', '--text-2': 'text', '--text-3': 'text', '--link': 'text', '--link-strong': 'text',
  '--primary': 'text',
  '--border': 'border', '--input': 'border', '--line-soft': 'border',
};
const tokenDark = {};
for (const [prop, role] of Object.entries(TOKEN_ROLES)) {
  const c = resolve(prop) && parseColor(resolve(prop));
  const mapped = c && mapColor(c, role);
  if (mapped) tokenDark[prop] = mapped;
}
// Tlačidlá bg-primary sú v tmavom režime svetlé, text na nich tmavý.
tokenDark['--primary-foreground'] = build(INK_HUE, 0.1, 0.1);

// Farba v hodnote: literál alebo var(--x) z :root. Premenné, ktoré sa v tmavom režime menia, sa pri „ponechaní“
// nahradia pôvodnou hodnotou — inak by napr. biely text var(--card) na tmavom tlačidle stmavol s kartou.
const COLOR_TOKEN = /var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)|#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b/g;
function convertValue(value, role, keepRule) {
  return value.replace(COLOR_TOKEN, (token, varName, fallback) => {
    // Premenná komponentu (farba strany a pod.): mení sa len prípadná záložná hodnota.
    if (varName && !(varName in tokens)) return fallback ? `var(${varName}, ${convertValue(fallback, role, keepRule)})` : token;
    const literal = varName ? resolve(varName) : token;
    const c = literal && parseColor(literal);
    if (!c) return token;
    const mapped = keepRule || role === 'keep' ? null : mapColor(c, role);
    if (mapped) return mapped;
    return varName && varName in tokenDark ? literal : token;
  });
}
// Text vo farbe strany (color: var(--a)) je na tmavom podklade zosvetlený, aby bol čitateľný.
const componentVar = value => { const m = value.match(/^var\(\s*(--[\w-]+)/); return m && !(m[1] in tokens) && /^var\((?:[^()]|\([^()]*\))*\)$/.test(value); };

// ---------- výstup ----------
const prefixSelector = sel => {
  sel = sel.trim();
  if (sel === ':root' || sel === 'html') return PREFIX;
  if (sel.startsWith(':root')) return PREFIX + sel.slice(5);
  if (/^html[\s.[:>~+]/.test(sel)) return PREFIX + sel.slice(4);
  if (/^::?(selection|backdrop|view-transition)/.test(sel)) return `${PREFIX} ${sel}, ${PREFIX}${sel}`;
  return `${PREFIX} ${sel}`;
};
const outRoot = postcss.root();
const wrappers = new Map();                             // rovnaký @media obal sa zlučuje, poradie ostáva
let lastKey = null, rules = 0, changed = 0;
function place(rule, chain) {
  const key = chain.map(p => `@${p.name} ${p.params}`).join(' / ');
  if (!chain.length) { outRoot.append(rule); lastKey = null; return; }
  let host = key === lastKey ? wrappers.get(key) : null;
  if (!host) {
    let outer = null, inner = null;
    for (const p of [...chain].reverse()) {
      const at = postcss.atRule({ name: p.name, params: p.params });
      if (inner) inner.append(at); else outer = at;
      inner = at;
    }
    outRoot.append(outer);
    host = inner;
    wrappers.set(key, host);
  }
  host.append(rule);
  lastKey = key;
}
for (const [, root] of parsed) {
  root.walkRules(rule => {
    const chain = [];
    for (let p = rule.parent; p && p.type === 'atrule'; p = p.parent) chain.unshift(p);
    if (chain.some(p => /keyframes$/i.test(p.name))) return;
    if (/^(:root|html)$/.test(rule.selector.trim())) return;           // premenné rieši blok nižšie
    const keepRule = KEEP_SELECTOR.test(rule.selector);
    const decls = rule.nodes.filter(n => n.type === 'decl' && !n.prop.startsWith('--') && roleOf(n.prop));
    if (!decls.length) return;
    // Sýty akcent v pozadí (limetková plocha) si necháva aj svoj text.
    const accentBg = decls.some(d => roleOf(d.prop) === 'bg' && [...d.value.matchAll(COLOR_TOKEN)].some(m => {
      const c = parseColor(m[1] ? resolve(m[1]) ?? '' : m[0]);
      return c && isAccent(analyze(c));
    }));
    const clone = postcss.rule({ selector: rule.selectors.map(prefixSelector).join(',') });
    let any = false;
    for (const d of decls) {
      const role = roleOf(d.prop);
      let value = convertValue(d.value, role, keepRule || (accentBg && role === 'text'));
      if (d.prop === 'color' && !keepRule && !accentBg && componentVar(d.value)) value = `color-mix(in oklab, ${value} 68%, #fff)`;
      if (value !== d.value) any = true;
      clone.append(postcss.decl({ prop: d.prop, value, important: d.important }));
    }
    place(clone, chain);
    rules++; if (any) changed++;
  });
}

// SVG atribúty v grafoch (fill="#…", stroke="#…" aj v objektoch { fill: "#…" }).
const svgColors = new Map();
for (const f of SVG_SOURCES) {
  if (!existsSync(f)) continue;
  for (const m of readFileSync(f, 'utf8').matchAll(/\b(fill|stroke)(?:=\{?|:\s*)"(#[0-9a-fA-F]{3,8})"/g)) svgColors.set(`${m[1]}|${m[2].toLowerCase()}`, [m[1], m[2]]);
}
for (const [attr, hex] of svgColors.values()) {
  const mapped = mapColor(parseColor(hex), attr);
  if (!mapped) continue;
  const variants = [...new Set([hex, hex.toLowerCase(), hex.toUpperCase().replace('#', '#')])];
  outRoot.append(postcss.rule({ selector: variants.map(v => `${PREFIX} ${SVG_SCOPE} [${attr}="${v}"]`).join(',') }).append(postcss.decl({ prop: attr, value: mapped })));
  rules++; changed++;
}

const base = postcss.rule({ selector: PREFIX });
base.append(postcss.decl({ prop: 'color-scheme', value: 'dark' }));
for (const [prop, value] of Object.entries(tokenDark)) base.append(postcss.decl({ prop, value }));
outRoot.prepend(base);
const css = outRoot.toString() + '\n';
const hash = createHash('sha1').update(css).digest('hex').slice(0, 10);
const text = `/* Generované scripts/build-dark.mjs z ${files.length} súborov (${hash}) — needitovať ručne. Pravidiel: ${rules}, prefarbených: ${changed}. */\n` + css;

const colors = `// Generované scripts/build-dark.mjs — needitovať ručne.
// Farba podkladu tmavého režimu (meta theme-color, skript proti bliknutiu v app/layout.tsx).
export const darkThemeColor = "${tokenDark['--background']}";
`;
if (process.argv.includes('--check')) {
  const stale = [[OUT, text], [OUT_COLORS, colors]].filter(([f, want]) => (existsSync(f) ? readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '') !== want).map(([f]) => f);
  if (stale.length) { console.error(`${stale.join(', ')} je zastaraný — spusti: node scripts/build-dark.mjs`); process.exit(1); }
  console.log(`${OUT} je aktuálny (${hash})`);
} else {
  writeFileSync(OUT, text);
  writeFileSync(OUT_COLORS, colors);
  console.log(`${OUT}: ${rules} pravidiel (${changed} prefarbených), ${Math.round(text.length / 1024)} kB, podklad ${tokenDark['--background']}, karta ${tokenDark['--card']}, text ${tokenDark['--foreground']}`);
}
