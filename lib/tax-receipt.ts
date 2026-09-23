import { cofogData } from "./cofog.data.ts";

/*
  „Kam idú tvoje dane“: čistá mzda, daň a odvody zamestnanca v roku 2026 a ich rozdelenie podľa toho, na čo
  verejná správa míňa (Eurostat COFOG, posledný rok s údajmi).

  Mzda (zamestnanec bez detí, bez iných úľav a bez zníženej sadzby zdravotného poistenia):
  - sociálne poistenie zamestnanca 9,4 % zo mzdy najviac do stropu 16 764 € mesačne
    (nemocenské 1,4 + starobné 4 + invalidné 3 + v nezamestnanosti 1); Sociálna poisťovňa;
  - zdravotné poistenie zamestnanca 5 % bez stropu; VšZP (zmena zo 4 % od 1. 1. 2026);
  - nezdaniteľná časť 497,23 € mesačne, ak čiastkový základ dane nepresiahne 1/12 z 26 083,13 €,
    inak 1/12 z (14 661,11 € − ročný základ / 3), najmenej 0; Finančná správa;
  - daň 19 % do 3 665,28 €, 25 % do 5 029,10 €, 30 % do 6 250,86 €, 35 % nad (mesačne; 1/12 ročných pásiem);
  - zamestnávateľ: sociálne 24,4 % do stropu + úrazové 0,8 % bez stropu, zdravotné 11 %.
  Preddavok aj odvody sa zaokrúhľujú na eurocenty; čistá mzda sa zhoduje s publikovanými príkladmi pre rok 2026
  (overuje scripts/verify-data.mjs).

  Rozdelenie: všetko, čo ty a zamestnávateľ odvediete, delíme v rovnakom pomere, v akom verejná správa
  (štát, obce, kraje, poisťovne) minula peniaze. Je to názorné priblíženie: odvody zo zákona smerujú najmä do
  Sociálnej poisťovne a zdravotných poisťovní a výdavky boli vyššie než príjmy (rozdiel si štát požičal).
*/
export const PAYROLL_YEAR = 2026;
export const payroll2026 = {
  subsistenceMinimum: 284.13,
  // sociálne poistenie po fondoch (%): nemocenské, starobné, invalidné, v nezamestnanosti (+ zamestnávateľ garančné, rezervný fond)
  socialEmployeeFunds: [1.4, 4, 3, 1],
  socialEmployerFunds: [1.4, 14, 3, 1, 0.25, 4.75],
  injuryEmployer: 0.8,
  socialCapMonthly: 16764,
  healthEmployee: 0.05,
  healthEmployer: 0.11,
  allowanceMonthly: 497.23,
  allowanceThresholdYear: 26083.13,
  allowanceBaseYear: 14661.11,
  bracketsMonthly: [[3665.28, 0.19], [5029.10, 0.25], [6250.86, 0.30], [Infinity, 0.35]] as [number, number][],
  minWage: 915,
  averageWage2024: 1524,
};

export const payrollSources = [
  { name: "Finančná správa SR · sadzby dane zo závislej činnosti 2026", url: "https://podpora.financnasprava.sk/939516-Sadzba-dane-pre-z%C3%A1visl%C3%BA-%C4%8Dinnos%C5%A5" },
  { name: "Finančná správa SR · nezdaniteľná časť základu dane na daňovníka 2026", url: "https://podpora.financnasprava.sk/260857-Nezdanite%C4%BEn%C3%A1-%C4%8Das%C5%A5-z%C3%A1kladu-dane-na-da%C5%88ovn%C3%ADka-za-rok-2026" },
  { name: "Sociálna poisťovňa · tabuľky platenia poistného od 1. 1. 2026", url: "https://www.socpoist.sk/socialne-poistenie/platenie-poistneho/tabulky-platenia-poistneho/tabulky-platenia-poistneho-od-1-6" },
  { name: "VšZP · zdravotné poistenie od 1. 1. 2026", url: "https://www.vszp.sk/platitelia/platenie-poistneho/oznamenia-zmeny/zmeny-od-01-01.2026/" },
  { name: "MPSVR SR · minimálna mzda 2026", url: "https://www.employment.gov.sk/sk/uvodna-stranka/informacie-media/aktuality/historicky-narast-minimalnej-mzdy-je-realitou-roku-2026-je-minimalna-mzda-vo-vyske-915-eur.html" },
  { name: "Eurostat · výdavky verejnej správy podľa funkcií (COFOG)", url: cofogData.url },
];

const cents = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
// Sociálna poisťovňa zaokrúhľuje poistné do každého fondu na eurocenty nadol (pri strope 16 764 € spolu 1 575,81 €).
const funds = (base: number, rates: number[]) => cents(rates.reduce((s, r) => s + Math.floor(base * r + 1e-7) / 100, 0));

export type Payroll = {
  gross: number; socialEmployee: number; healthEmployee: number; taxBase: number; allowance: number; tax: number; net: number;
  socialEmployer: number; healthEmployer: number; employeeTotal: number; employerTotal: number; toState: number; labourCost: number;
};

/** Mesačná výplata v roku 2026 z hrubej mesačnej mzdy (zamestnanec bez detí a iných úľav). */
export function payroll(grossMonthly: number): Payroll {
  const p = payroll2026;
  const gross = cents(Math.max(0, grossMonthly));
  const capped = Math.min(gross, p.socialCapMonthly);
  const socialEmployee = funds(capped, p.socialEmployeeFunds);
  const healthEmployee = cents(gross * p.healthEmployee);
  const taxBase = cents(gross - socialEmployee - healthEmployee);
  const allowanceFull = taxBase * 12 <= p.allowanceThresholdYear ? p.allowanceMonthly : Math.max(0, p.allowanceBaseYear / 12 - taxBase / 3);
  const allowance = cents(Math.min(taxBase, allowanceFull));
  const taxable = Math.max(0, taxBase - allowance);
  let tax = 0, lower = 0;
  for (const [upper, rate] of p.bracketsMonthly) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  tax = cents(tax);
  const socialEmployer = cents(funds(capped, p.socialEmployerFunds) + funds(gross, [p.injuryEmployer]));
  const healthEmployer = cents(gross * p.healthEmployer);
  const employeeTotal = cents(socialEmployee + healthEmployee + tax);
  const employerTotal = cents(socialEmployer + healthEmployer);
  return {
    gross, socialEmployee, healthEmployee, taxBase, allowance, tax, net: cents(gross - employeeTotal),
    socialEmployer, healthEmployer, employeeTotal, employerTotal, toState: cents(employeeTotal + employerTotal), labourCost: cents(gross + employerTotal),
  };
}

// ---------- rozdelenie podľa výdavkov verejnej správy ----------
const latest = cofogData.rows[cofogData.rows.length - 1];
export const spendingYear = latest.year;
export const spendingTotalMeur = latest.TOTAL;
type Code = Exclude<keyof typeof latest, "year" | "TOTAL">;
const areaDefs: { code: Code; label: string; hint: string; color: string; sub?: { code: Code; label: string } }[] = [
  { code: "GF10", label: "Sociálne zabezpečenie", hint: "dôchodky, nemocenské, rodinné a sociálne dávky", color: "#2f6b3f", sub: { code: "GF1002", label: "z toho staroba, najmä dôchodky" } },
  { code: "GF07", label: "Zdravotníctvo", hint: "nemocnice, lekári, lieky", color: "#c0563f" },
  { code: "GF01", label: "Chod štátu a úroky", hint: "úrady, zahraničie, voľby, úroky z dlhu", color: "#5b6b7a", sub: { code: "GF0107", label: "z toho úroky z dlhu" } },
  { code: "GF04", label: "Doprava a ekonomika", hint: "cesty, železnice, energie, podpora podnikov a poľnohospodárstva", color: "#9c7a2b" },
  { code: "GF09", label: "Vzdelávanie", hint: "škôlky, školy, univerzity", color: "#3f7fa6" },
  { code: "GF03", label: "Polícia, hasiči a súdy", hint: "verejný poriadok a bezpečnosť", color: "#7a5aa0" },
  { code: "GF02", label: "Obrana", hint: "armáda", color: "#6b705c" },
  { code: "GF08", label: "Kultúra a šport", hint: "rekreácia, kultúra, cirkvi", color: "#c28a2e" },
  { code: "GF05", label: "Životné prostredie", hint: "odpady, voda, ovzdušie", color: "#4c9a73" },
  { code: "GF06", label: "Bývanie a obce", hint: "bývanie, vodovody, verejné osvetlenie", color: "#b07a55" },
];
export const spendingAreas = areaDefs
  .map(a => ({ ...a, meur: latest[a.code], share: latest[a.code] / latest.TOTAL, subShare: a.sub ? latest[a.sub.code] / latest.TOTAL : undefined }))
  .sort((x, y) => y.share - x.share);

export type ReceiptRow = (typeof spendingAreas)[number] & { amount: number; subAmount?: number };
/** Rozdelí sumu (celé eurá) podľa podielov výdavkov; zaokrúhlenie najväčším zvyškom, aby riadky dali súčet. */
export function receiptRows(total: number): ReceiptRow[] {
  const whole = Math.round(total);
  const raw = spendingAreas.map(a => whole * a.share);
  const floors = raw.map(Math.floor);
  let left = whole - floors.reduce((s, v) => s + v, 0);
  const order = raw.map((v, i) => [v - floors[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; floors[i]++; left--; }
  return spendingAreas.map((a, i) => ({ ...a, amount: floors[i], subAmount: a.subShare !== undefined ? Math.round(whole * a.subShare) : undefined }));
}
