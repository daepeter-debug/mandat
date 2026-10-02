// Tvary slov zo slovenského slovníka sk-spell (Hunspell .aff/.dic) pre Koalíciu slov.
// Rozbalí koncovky (SFX), predponu ne- (PFX N) a 3. stupeň naj-/najne- (PFX F, cirkumfix s). Vynechá
// vlastné mená (veľké písmeno), skratky, citoslovcia, slová s cudzími znakmi a vulgarizmy (zoznamy nižšie)
// a tvary, ktoré pravidlá slovníka tvoria chybne (pozri imperativeOk a adverbOk).
// Použitie: import { readForms } from "./word-forms.mjs"; const { forms, stats } = readForms("<priečinok so sk_SK.aff a sk_SK.dic>").
import fs from "node:fs";
import path from "node:path";

const LETTERS = "aáäbcčdďeéfghiíjklĺľmnňoóôpqrŕsštťuúvwxyýzž";
const allowed = new Set(LETTERS);
// Vulgarizmy a nadávky: celé heslá (lemy) aj korene, ktoré sa v nevinných slovách nevyskytujú.
// Korene sú zúžené tak, aby nezachytili bežné slová (duchovný, chovný, špička, čapička, negramotný).
const BLOCK_ROOTS = /kurv|kurev|(?<![aáäeéiíoóôuúyýš])pič|jeb|chuj|kokot|^hovn|sračk|sra[ťnč]|zasra|posra|vysra|nasra|obsra|čurák|buzerant|negr(?!am)|cigán|kretén|zmrd|šuk|mrdať|mrdn|židák/;
// Heslá, ktoré do hry nepatria, hoci v slovníku sú: choroba ako skratka, vulgárne slovesá, náboženská menšina
// (v politickej hre nechceme, aby sa také slovo objavilo v ukázanej najlepšej koalícii).
const BLOCK_LEMMAS = /^(?:aids|aidsový|aidsy|žid|židia|prd|prdel)$|^(?:vy|na|po|za|o|pre|roz|ob|od|do|pri|u)?(?:šťať|drístať|prdnúť|prdieť)$/;
// Holé heslá, ktoré sú useknuté časti slov, skratky bez bodky alebo citoslovcia bez označenia.
const BAD_BARE = new Set("ahá jáj uhú fiu ajaj ejha spôs neskl potrm rehabilita týžd vozvysok grmanu anatomicko importno duí arí prí telzon nedostato hahoj hotent príd daždi tromp press".split(" "));
// Holé heslá (bez koncoviek aj bez druhu slova) sú zväčša platné tvary, ale medzi krátkymi sú aj skratky bez bodky
// (adj, okt, tzn), citoslovcia (aha, fuj) a anglické slová (and, the). Krátke holé heslo prejde iba s dlhou samohláskou
// alebo dvojhláskou (rúk, žien, nôh, kôr) alebo zo zoznamu bežných krátkych slov; holé heslo bez samohlásky nikdy.
const VOWEL = /[aáäeéiíoóôuúyý]/, LONG = /[áéíóôúýĺŕ]|i[aeu]/;
const SHORT_OK = new Set("až dva dve tri iba kde kto kam nie pre sem tam ten tom tou zoo len nik von dnu doma dnia nech ozaj seba sama samo samu toto tuto vzad vtom znov iste zasa skrz nuž naň doň zaň tvoj svoj jeho ešte teda tiež však emu boa bob iglu tofu omen lira".split(" "));
const bareOk = word => VOWEL.test(word) && ([...word].length >= 5 || LONG.test(word) || SHORT_OK.has(word));
// Slabika: samohláska alebo slabikotvorné r, l, ŕ, ĺ za spoluhláskou (vlk, krk, smrť, mlč). Slovo bez slabiky (sps, stm) neplatí.
const syllabic = w => VOWEL.test(w) || /[^aáäeéiíoóôuúyý][rlŕĺ]/.test(w);
// Rozkazovací spôsob: pravidlá slovníka ho tvoria aj tam, kde nesedí. Pri slovesách s koreňom bez samohlásky
// (biť, šiť, viť, ctiť, mstiť, spať, stlať a ich odvodeniny za|biť, u|šiť, po|mstiť) musí rozkaz bez predpony
// mať slabiku: zab, uš, pomsť, spme, nastľ neplatia (správne zabi, uši, pomsti, spime, nastel). Predpona sa
// odtrhne len vtedy, keď zvyšok je samostatné heslo, takže suš, snaž, ozdob, unav, trp, drž zostávajú. Okrem toho
// odmietneme koncovú skupinu spoluhlások, ktorú rozkaz nemá (kotv, šepc, tresc, kokc, striebr, kreslme).
const PREFIXES = ["predo", "pred", "podo", "pod", "nado", "nad", "rozo", "roz", "odo", "obo", "pre", "pri", "vy", "za", "na", "po", "do", "od", "ob", "zo", "so", "vo", "u", "o", "z", "s", "v"];
const INFINITIVE = /(?:ovať|núť|nuť|ieť|iať|iť|ať|äť|uť|úť|yť|ýť|íť|ásť|esť|sť|cť|ť)$/;
const BAD_CODA = /(?:tv|ps|pc|sc|kc|Xc|nc|nť|nJ|rJ|[^aáäeéiíoóôuúyý][rlŕĺ])$/;
function imperativeOk(form, plural, lemma, lemmas) {
  const base = plural && /(me|te)$/.test(form) ? form.slice(0, -2) : form;
  if (VOWEL.test(base.slice(-1))) return true;
  for (const p of ["", ...PREFIXES]) {
    if (!lemma.startsWith(p) || !base.startsWith(p)) continue;
    const rest = lemma.slice(p.length);
    if (p && !lemmas.has(rest)) continue;
    if (!VOWEL.test(rest.replace(INFINITIVE, "")) && !syllabic(base.slice(p.length))) return false;
  }
  const coda = base.replace(/ch/g, "X").replace(/dž/g, "J").replace(/dz/g, "D").match(/[^aáäeéiíoóôuúyý]*$/)[0];
  return coda.length < 2 || !BAD_CODA.test(coda);
}
// Príslovky: „í → o“ tvorí z mäkkých prídavných mien nezmysly (psí → pso, mazací → mazaco) a „y → o“ pri -ský/-cký
// zložené tvary (sovietsky → sovietsko), ktoré samostatne nestoja. Skutočné príslovky (rýdzo, rýchlo) zostávajú.
const adverbOk = (r, lemma) => !(r.adv && ((r.strip === "í" && r.add === "o") || (r.strip === "y" && r.add === "o" && /[sc]ky$/.test(lemma))));
function parseAff(text) {
  const affixes = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const p = raw.replace(/#.*$/, "").trim().split(/\s+/);   // hlavičky blokov majú za sebou komentár
    if ((p[0] !== "SFX" && p[0] !== "PFX") || p.length < 4) continue;
    if (/^[YN]$/.test(p[2]) && /^\d+$/.test(p[3]) && p.length <= 5) { affixes.set(p[0] + p[1], { kind: p[0], flag: p[1], cross: p[2] === "Y", rules: [] }); continue; }
    const block = affixes.get(p[0] + p[1]); if (!block) continue;
    const [rawAdd, cont = ""] = p[3].split("/"), strip = p[2] === "0" ? "" : p[2], cond = p[4] && p[4] !== "." ? p[4] : "";
    const imp = p.includes("is:imperative"), adv = p.includes("po:adverb");
    let add = rawAdd === "0" ? "" : rawAdd;
    // Chyba slovníka: rozkaz od klásť/pásť stratí samohlásku (klď, ps); správne je klaď, pas.
    if (imp && strip.endsWith("ásť") && add.length === 1) add = "a" + add;
    const re = cond ? new RegExp(block.kind === "SFX" ? `${cond}$` : `^${cond}`) : null;
    block.rules.push({ strip, add, cont, re, imp, plural: p.includes("is:plural"), adv });
  }
  return affixes;
}
const applies = (r, word, kind) => (!r.re || r.re.test(word)) && (kind === "SFX" ? word.endsWith(r.strip) : word.startsWith(r.strip));
const sfx = (r, word) => word.slice(0, word.length - r.strip.length) + r.add;
const pfx = (r, word) => r.add + word.slice(r.strip.length);

export function readForms(dir) {
  const affixes = parseAff(fs.readFileSync(path.join(dir, "sk_SK.aff"), "utf8"));
  const lines = fs.readFileSync(path.join(dir, "sk_SK.dic"), "utf8").split(/\r?\n/).slice(1);
  const lemmas = new Set(lines.map(l => l.split(/[\s/]/)[0]));
  // Prídavné mená od miestnych a vlastných mien (maltský, azorský, vaduzský) dostávajú v slovníku aj zápor
  // (nemaltský, neazorský), ktorý v reči nežije. Zápor vynecháme, keď je kmeň (aspoň 4 písmená) začiatkom vlastného
  // mena, ktoré je dlhšie najviac o 4 písmená (Malta, Azory, Vaduz); ľudský, ženský či bratský (Bratislava) zápor majú.
  const proper = [...new Set([...lemmas].filter(w => w && w[0] !== w[0].toLocaleLowerCase("sk")).map(w => w.toLocaleLowerCase("sk")))].sort();
  const fromProper = adjective => {
    const stem = adjective.replace(/[sc]k[ýy]$/, "");
    if (stem === adjective || [...stem].length < 4) return false;
    let lo = 0, hi = proper.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (proper[mid] < stem) lo = mid + 1; else hi = mid; }
    for (let i = lo; i < proper.length && proper[i].startsWith(stem); i++) if (proper[i].length <= stem.length + 4) return true;
    return false;
  };
  const N = affixes.get("PFXN"), F = affixes.get("PFXF");
  const forms = new Set(), stats = { lemmas: 0, skipped: { proper: 0, letters: 0, pos: 0, blocked: 0, abbreviation: 0, bare: 0 }, dropped: { imperative: 0, adverb: 0, syllable: 0 }, blockedSample: [], droppedSample: [] };
  for (const line of lines) {
    if (!line.trim()) continue;
    const [entry, ...morph] = line.split(/\s+/), [word, flags = ""] = entry.split("/");
    if (!word) continue;
    if (word[0] !== word[0].toLocaleLowerCase("sk")) { stats.skipped.proper++; continue; }
    if (![...word].every(c => allowed.has(c))) { stats.skipped.letters++; continue; }
    if (morph.some(m => m === "po:acronym" || m === "po:interjection")) { stats.skipped.pos++; continue; }
    if (BLOCK_ROOTS.test(word) || BLOCK_LEMMAS.test(word)) { stats.skipped.blocked++; if (stats.blockedSample.length < 40) stats.blockedSample.push(word); continue; }
    // Skratka zapísaná ako tvar plného slova (odd → oddelenie).
    const stem = morph.find(m => m.startsWith("st:"))?.slice(3);
    if (stem && stem.length > word.length + 2 && stem.startsWith(word)) { stats.skipped.abbreviation++; continue; }
    if (!flags && !morph.some(Boolean) && (!bareOk(word) || BAD_BARE.has(word))) { stats.skipped.bare++; continue; }
    stats.lemmas++;
    const own = [word], negate = flags.includes("N") && !fromProper(word);
    if (flags.includes("N") && !negate) stats.dropped.properNegation = (stats.dropped.properNegation ?? 0) + 1;
    for (const f of flags) {
      const block = affixes.get("SFX" + f); if (!block) continue;
      for (const r of block.rules) {
        if (!applies(r, word, "SFX")) continue;
        const form = sfx(r, word);
        if (r.imp && !imperativeOk(form, r.plural, word, lemmas)) { stats.dropped.imperative++; stats.droppedSample.push(form); continue; }
        if (!adverbOk(r, word)) { stats.dropped.adverb++; continue; }
        if (r.cont.includes("s")) { if (F) for (const p of F.rules) own.push(pfx(p, form)); }   // 3. stupeň: naj-/najne- + koncovka
        else { own.push(form); if (negate && block.cross && N?.cross) for (const p of N.rules) own.push(pfx(p, form)); }
      }
    }
    if (negate && N) for (const p of N.rules) own.push(pfx(p, word));
    for (const f of own) {
      if (BLOCK_ROOTS.test(f) || ![...f].every(c => allowed.has(c))) continue;
      if (!syllabic(f)) { stats.dropped.syllable++; continue; }
      forms.add(f);
    }
  }
  return { forms, stats };
}
