// Generuje scripts/fetch-public-finance.mjs — needitovať ručne; po obnove spustiť node scripts/verify-data.mjs.
import type { PublicFinanceData } from './public-finance.ts';

export const publicFinance: PublicFinanceData = {
 "fetched": "2026-09-18",
 "from": 1995,
 "datasets": {
  "deficitPct": {
   "dataset": "gov_10dd_edpt1",
   "label": "Saldo verejnej správy (B.9), % HDP",
   "updated": "2026-04-22",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "B9",
    "unit": "PC_GDP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en"
  },
  "deficitMeur": {
   "dataset": "gov_10dd_edpt1",
   "label": "Saldo verejnej správy (B.9), mil. €",
   "updated": "2026-04-22",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "B9",
    "unit": "MIO_EUR"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en"
  },
  "debtPct": {
   "dataset": "gov_10dd_edpt1",
   "label": "Hrubý dlh verejnej správy (maastrichtský), % HDP",
   "updated": "2026-04-22",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "GD",
    "unit": "PC_GDP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en"
  },
  "debtMeur": {
   "dataset": "gov_10dd_edpt1",
   "label": "Hrubý dlh verejnej správy (maastrichtský), mil. €",
   "updated": "2026-04-22",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "GD",
    "unit": "MIO_EUR"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en"
  },
  "expenditurePct": {
   "dataset": "gov_10a_main",
   "label": "Výdavky verejnej správy, % HDP",
   "updated": "2026-07-21",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "TE",
    "unit": "PC_GDP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table?lang=en"
  },
  "revenuePct": {
   "dataset": "gov_10a_main",
   "label": "Príjmy verejnej správy, % HDP",
   "updated": "2026-07-21",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "TR",
    "unit": "PC_GDP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table?lang=en"
  },
  "interestPct": {
   "dataset": "gov_10a_main",
   "label": "Úroky zaplatené z dlhu, % HDP",
   "updated": "2026-07-21",
   "filter": {
    "geo": "SK",
    "sector": "S13",
    "na_item": "D41PAY",
    "unit": "PC_GDP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main/default/table?lang=en"
  },
  "gdpGrowth": {
   "dataset": "nama_10_gdp",
   "label": "Reálny rast HDP, %",
   "updated": "2026-09-08",
   "filter": {
    "geo": "SK",
    "na_item": "B1GQ",
    "unit": "CLV_PCH_PRE"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en"
  },
  "gdpMeur": {
   "dataset": "nama_10_gdp",
   "label": "HDP v bežných cenách, mil. €",
   "updated": "2026-09-08",
   "filter": {
    "geo": "SK",
    "na_item": "B1GQ",
    "unit": "CP_MEUR"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en"
  },
  "unemployment": {
   "dataset": "une_rt_a",
   "label": "Miera nezamestnanosti 15–74 rokov, %",
   "updated": "2026-09-10",
   "filter": {
    "geo": "SK",
    "age": "Y15-74",
    "sex": "T",
    "unit": "PC_ACT"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/une_rt_a/default/table?lang=en"
  },
  "unemploymentHistoric": {
   "dataset": "une_rt_a_h",
   "label": "Miera nezamestnanosti 15–74 rokov, historický rad pred zmenou metodiky 2021, %",
   "updated": "2026-07-20",
   "filter": {
    "geo": "SK",
    "age": "Y15-74",
    "sex": "T",
    "unit": "PC_ACT"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/une_rt_a_h/default/table?lang=en"
  },
  "inflation": {
   "dataset": "prc_hicp_aind",
   "label": "Inflácia HICP, priemerná ročná miera, %",
   "updated": "2026-02-06",
   "filter": {
    "geo": "SK",
    "coicop": "CP00",
    "unit": "RCH_A_AVG"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_aind/default/table?lang=en"
  },
  "population": {
   "dataset": "demo_pjan",
   "label": "Obyvateľstvo k 1. januáru",
   "updated": "2026-08-14",
   "filter": {
    "geo": "SK",
    "age": "TOTAL",
    "sex": "T"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/demo_pjan/default/table?lang=en"
  },
  "gdpPcPps": {
   "dataset": "nama_10_pc",
   "label": "HDP na obyvateľa v parite kúpnej sily, EÚ27 = 100",
   "updated": "2026-09-08",
   "filter": {
    "geo": "SK",
    "na_item": "B1GQ",
    "unit": "PC_EU27_2020_HAB_MPPS_CP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/nama_10_pc/default/table?lang=en"
  },
  "minWage": {
   "dataset": "earn_mw_cur",
   "label": "Minimálna mesačná mzda, € (stav v januári)",
   "updated": "2026-07-31",
   "filter": {
    "geo": "SK",
    "currency": "EUR"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/earn_mw_cur/default/table?lang=en"
  },
  "medianIncome": {
   "dataset": "ilc_di03",
   "label": "Medián ekvivalizovaného disponibilného príjmu, € za rok",
   "updated": "2026-09-17",
   "filter": {
    "geo": "SK",
    "age": "TOTAL",
    "sex": "T",
    "statinfo": "MED_EI",
    "unit": "EUR"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en"
  },
  "povertyRate": {
   "dataset": "ilc_li02",
   "label": "Miera rizika chudoby (pod 60 % mediánu), %",
   "updated": "2026-09-17",
   "filter": {
    "geo": "SK",
    "age": "TOTAL",
    "sex": "T",
    "statinfo": "MED_EI",
    "unit": "PC",
    "rskpovth": "B_60"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/ilc_li02/default/table?lang=en"
  },
  "employment": {
   "dataset": "lfsi_emp_a",
   "label": "Miera zamestnanosti 20–64 rokov, %",
   "updated": "2026-09-10",
   "filter": {
    "geo": "SK",
    "age": "Y20-64",
    "sex": "T",
    "indic_em": "EMP_LFS",
    "unit": "PC_POP"
   },
   "url": "https://ec.europa.eu/eurostat/databrowser/view/lfsi_emp_a/default/table?lang=en"
  }
 },
 "years": [
  {
   "year": 1995,
   "deficitPct": -3.4,
   "deficitMeur": -532.2,
   "debtPct": 21.3,
   "debtMeur": 3309,
   "expenditurePct": 47.8,
   "revenuePct": 44.4,
   "interestPct": 2.3,
   "gdpMeur": 15524.4,
   "population": 5356207,
   "gdpPcPps": 49.5
  },
  {
   "year": 1996,
   "deficitPct": -9.7,
   "deficitMeur": -1673.9,
   "debtPct": 30.3,
   "debtMeur": 5089.8,
   "expenditurePct": 52.9,
   "revenuePct": 43.1,
   "interestPct": 2.5,
   "gdpGrowth": 6.1,
   "gdpMeur": 17219.8,
   "inflation": 5.8,
   "population": 5367790,
   "gdpPcPps": 51.6
  },
  {
   "year": 1997,
   "deficitPct": -6.2,
   "deficitMeur": -1211.3,
   "debtPct": 32.8,
   "debtMeur": 6323.8,
   "expenditurePct": 48.6,
   "revenuePct": 42.3,
   "interestPct": 2.4,
   "gdpGrowth": 5.5,
   "gdpMeur": 19427.8,
   "inflation": 6,
   "population": 5378932,
   "gdpPcPps": 53,
   "unemployment": 12.2,
   "unemploymentSource": "historic"
  },
  {
   "year": 1998,
   "deficitPct": -5.4,
   "deficitMeur": -1096,
   "debtPct": 33.9,
   "debtMeur": 6324.5,
   "expenditurePct": 46.2,
   "revenuePct": 40.8,
   "interestPct": 2.6,
   "gdpGrowth": 3.8,
   "gdpMeur": 20415.6,
   "inflation": 6.7,
   "population": 5387650,
   "gdpPcPps": 53.2,
   "unemployment": 12.6,
   "unemploymentSource": "historic"
  },
  {
   "year": 1999,
   "deficitPct": -7.3,
   "deficitMeur": -1416.8,
   "debtPct": 47.1,
   "debtMeur": 9580.6,
   "expenditurePct": 48.4,
   "revenuePct": 41.2,
   "interestPct": 3.4,
   "gdpGrowth": -0.5,
   "gdpMeur": 19537,
   "inflation": 10.4,
   "population": 5393382,
   "gdpPcPps": 51.5,
   "minWage": 69,
   "unemployment": 16.4,
   "unemploymentSource": "historic"
  },
  {
   "year": 2000,
   "deficitPct": -12.7,
   "deficitMeur": -2838.6,
   "debtPct": 50.6,
   "debtMeur": 10975.3,
   "expenditurePct": 53.2,
   "revenuePct": 40.5,
   "interestPct": 4,
   "gdpGrowth": 0.8,
   "gdpMeur": 22368.6,
   "inflation": 12.2,
   "population": 5398657,
   "gdpPcPps": 51.2,
   "minWage": 94,
   "unemployment": 18.8,
   "unemploymentSource": "historic"
  },
  {
   "year": 2001,
   "deficitPct": -7.7,
   "deficitMeur": -1848.2,
   "debtPct": 51.4,
   "debtMeur": 12406.1,
   "expenditurePct": 46.2,
   "revenuePct": 38.5,
   "interestPct": 4,
   "gdpGrowth": 2.9,
   "gdpMeur": 23869.3,
   "inflation": 7.2,
   "population": 5378783,
   "gdpPcPps": 53.1,
   "minWage": 100,
   "unemployment": 19.3,
   "unemploymentSource": "historic"
  },
  {
   "year": 2002,
   "deficitPct": -8.4,
   "deficitMeur": -2196.9,
   "debtPct": 45.6,
   "debtMeur": 12350.2,
   "expenditurePct": 46,
   "revenuePct": 37.6,
   "interestPct": 3.6,
   "gdpGrowth": 4.4,
   "gdpMeur": 26300.3,
   "inflation": 3.5,
   "population": 5378951,
   "gdpPcPps": 54.7,
   "minWage": 115,
   "unemployment": 18.7,
   "unemploymentSource": "historic"
  },
  {
   "year": 2003,
   "deficitPct": -2.3,
   "deficitMeur": -682.7,
   "debtPct": 43.6,
   "debtMeur": 13159.8,
   "expenditurePct": 40,
   "revenuePct": 37.8,
   "interestPct": 2.5,
   "gdpGrowth": 4.9,
   "gdpMeur": 29924.1,
   "inflation": 8.4,
   "population": 5374873,
   "gdpPcPps": 56.7,
   "minWage": 134,
   "unemployment": 17.6,
   "unemploymentSource": "historic"
  },
  {
   "year": 2004,
   "deficitPct": -2.4,
   "deficitMeur": -816.9,
   "debtPct": 42,
   "debtMeur": 15020,
   "expenditurePct": 38.4,
   "revenuePct": 36,
   "interestPct": 2.2,
   "gdpGrowth": 5.4,
   "gdpMeur": 34623.4,
   "inflation": 7.5,
   "population": 5371875,
   "gdpPcPps": 58.2,
   "minWage": 148,
   "unemployment": 18.2,
   "unemploymentSource": "historic"
  },
  {
   "year": 2005,
   "deficitPct": -2.9,
   "deficitMeur": -1121.1,
   "debtPct": 35,
   "debtMeur": 13988.4,
   "expenditurePct": 39.1,
   "revenuePct": 36.3,
   "interestPct": 1.7,
   "gdpGrowth": 6.5,
   "gdpMeur": 39239.7,
   "inflation": 2.8,
   "population": 5372685,
   "gdpPcPps": 61.2,
   "minWage": 168,
   "medianIncome": 2830,
   "povertyRate": 13.3,
   "unemployment": 16.3,
   "unemploymentSource": "historic"
  },
  {
   "year": 2006,
   "deficitPct": -3.6,
   "deficitMeur": -1627.7,
   "debtPct": 31.5,
   "debtMeur": 15544.4,
   "expenditurePct": 38.2,
   "revenuePct": 34.6,
   "interestPct": 1.5,
   "gdpGrowth": 8.9,
   "gdpMeur": 45592,
   "inflation": 4.3,
   "population": 5372928,
   "gdpPcPps": 64.2,
   "minWage": 182,
   "medianIncome": 3313,
   "povertyRate": 11.6,
   "unemployment": 13.4,
   "unemploymentSource": "historic"
  },
  {
   "year": 2007,
   "deficitPct": -2.3,
   "deficitMeur": -1272.6,
   "debtPct": 30.4,
   "debtMeur": 17214.4,
   "expenditurePct": 35.9,
   "revenuePct": 33.7,
   "interestPct": 1.4,
   "gdpGrowth": 10.8,
   "gdpMeur": 56354.7,
   "inflation": 1.9,
   "population": 5373180,
   "gdpPcPps": 67.7,
   "minWage": 221,
   "medianIncome": 3972,
   "povertyRate": 10.6,
   "unemployment": 11.1,
   "unemploymentSource": "historic"
  },
  {
   "year": 2008,
   "deficitPct": -2.5,
   "deficitMeur": -1678.6,
   "debtPct": 28.6,
   "debtMeur": 19629.8,
   "expenditurePct": 36.5,
   "revenuePct": 33.9,
   "interestPct": 1.4,
   "gdpGrowth": 5.4,
   "gdpMeur": 66065.4,
   "inflation": 3.9,
   "population": 5376064,
   "gdpPcPps": 72.1,
   "minWage": 241,
   "medianIncome": 4792,
   "povertyRate": 10.9,
   "unemployment": 9.5,
   "unemploymentSource": "historic"
  },
  {
   "year": 2009,
   "deficitPct": -8.2,
   "deficitMeur": -5242.6,
   "debtPct": 36.4,
   "debtMeur": 23320.7,
   "expenditurePct": 43.2,
   "revenuePct": 35.1,
   "interestPct": 1.5,
   "gdpGrowth": -5.5,
   "gdpMeur": 64055.1,
   "unemployment": 12,
   "inflation": 0.9,
   "population": 5382401,
   "gdpPcPps": 71.5,
   "minWage": 296,
   "medianIncome": 5671,
   "povertyRate": 11,
   "employment": 68.3
  },
  {
   "year": 2010,
   "deficitPct": -7.4,
   "deficitMeur": -5116.3,
   "debtPct": 40.7,
   "debtMeur": 27939.9,
   "expenditurePct": 41,
   "revenuePct": 33.6,
   "interestPct": 1.3,
   "gdpGrowth": 6.8,
   "gdpMeur": 68726.7,
   "unemployment": 14.3,
   "inflation": 0.7,
   "population": 5390410,
   "gdpPcPps": 76,
   "minWage": 308,
   "medianIncome": 6117,
   "povertyRate": 12,
   "employment": 66.5
  },
  {
   "year": 2011,
   "deficitPct": -4.4,
   "deficitMeur": -3119.9,
   "debtPct": 43.3,
   "debtMeur": 30994.2,
   "expenditurePct": 40.8,
   "revenuePct": 36.4,
   "interestPct": 1.5,
   "gdpGrowth": 2.6,
   "gdpMeur": 71629.5,
   "unemployment": 13.5,
   "inflation": 4.1,
   "population": 5392446,
   "gdpPcPps": 75.5,
   "minWage": 317,
   "medianIncome": 6306,
   "povertyRate": 13,
   "employment": 66.8
  },
  {
   "year": 2012,
   "deficitPct": -4.4,
   "deficitMeur": -3219.1,
   "debtPct": 51.7,
   "debtMeur": 38108,
   "expenditurePct": 40,
   "revenuePct": 35.7,
   "interestPct": 1.8,
   "gdpGrowth": 1.6,
   "gdpMeur": 73727.6,
   "unemployment": 13.9,
   "inflation": 3.7,
   "population": 5404322,
   "gdpPcPps": 76.8,
   "minWage": 327,
   "medianIncome": 6927,
   "povertyRate": 13.2,
   "employment": 66.9
  },
  {
   "year": 2013,
   "deficitPct": -2.9,
   "deficitMeur": -2135.7,
   "debtPct": 54.6,
   "debtMeur": 40762.9,
   "expenditurePct": 41.1,
   "revenuePct": 38.2,
   "interestPct": 1.9,
   "gdpGrowth": 0.7,
   "gdpMeur": 74642.7,
   "unemployment": 14.1,
   "inflation": 1.5,
   "population": 5410836,
   "gdpPcPps": 77.2,
   "minWage": 338,
   "medianIncome": 6737,
   "povertyRate": 12.8,
   "employment": 66.9
  },
  {
   "year": 2014,
   "deficitPct": -3.2,
   "deficitMeur": -2484.5,
   "debtPct": 53.4,
   "debtMeur": 40878.2,
   "expenditurePct": 42,
   "revenuePct": 38.7,
   "interestPct": 1.9,
   "gdpGrowth": 2.7,
   "gdpMeur": 76562.3,
   "unemployment": 13.1,
   "inflation": -0.1,
   "population": 5415949,
   "gdpPcPps": 77.7,
   "minWage": 352,
   "medianIncome": 6809,
   "povertyRate": 12.6,
   "employment": 67.8
  },
  {
   "year": 2015,
   "deficitPct": -2.8,
   "deficitMeur": -2236.1,
   "debtPct": 51.6,
   "debtMeur": 41473.6,
   "expenditurePct": 44.1,
   "revenuePct": 41.3,
   "interestPct": 1.8,
   "gdpGrowth": 5.2,
   "gdpMeur": 80376.3,
   "unemployment": 11.5,
   "inflation": -0.3,
   "population": 5421349,
   "gdpPcPps": 78,
   "minWage": 380,
   "medianIncome": 6930,
   "povertyRate": 12.3,
   "employment": 69.6
  },
  {
   "year": 2016,
   "deficitPct": -2.6,
   "deficitMeur": -2116.9,
   "debtPct": 52.1,
   "debtMeur": 42553.9,
   "expenditurePct": 40.9,
   "revenuePct": 38.3,
   "interestPct": 1.7,
   "gdpGrowth": 1.9,
   "gdpMeur": 81621.6,
   "unemployment": 9.6,
   "inflation": -0.5,
   "population": 5426252,
   "gdpPcPps": 72.8,
   "minWage": 405,
   "medianIncome": 6951,
   "povertyRate": 12.7,
   "employment": 71.8
  },
  {
   "year": 2017,
   "deficitPct": -1,
   "deficitMeur": -836.6,
   "debtPct": 51.4,
   "debtMeur": 43653.9,
   "expenditurePct": 39.8,
   "revenuePct": 38.8,
   "interestPct": 1.4,
   "gdpGrowth": 2.9,
   "gdpMeur": 84960.4,
   "unemployment": 8.1,
   "inflation": 1.4,
   "population": 5435343,
   "gdpPcPps": 70,
   "minWage": 435,
   "medianIncome": 7183,
   "povertyRate": 12.4,
   "employment": 73.2
  },
  {
   "year": 2018,
   "deficitPct": -1,
   "deficitMeur": -908.2,
   "debtPct": 49.3,
   "debtMeur": 44479.2,
   "expenditurePct": 39.7,
   "revenuePct": 38.6,
   "interestPct": 1.3,
   "gdpGrowth": 4.1,
   "gdpMeur": 90275.9,
   "unemployment": 6.5,
   "inflation": 2.5,
   "population": 5443120,
   "gdpPcPps": 69.7,
   "minWage": 480,
   "medianIncome": 7462,
   "povertyRate": 12.2,
   "employment": 74.5
  },
  {
   "year": 2019,
   "deficitPct": -1.2,
   "deficitMeur": -1139.3,
   "debtPct": 48,
   "debtMeur": 45391.9,
   "expenditurePct": 40.6,
   "revenuePct": 39.4,
   "interestPct": 1.2,
   "gdpGrowth": 2.3,
   "gdpMeur": 94547.5,
   "unemployment": 5.7,
   "inflation": 2.8,
   "population": 5450421,
   "gdpPcPps": 69.6,
   "minWage": 520,
   "medianIncome": 8119,
   "povertyRate": 11.9,
   "employment": 75.6
  },
  {
   "year": 2020,
   "deficitPct": -5.3,
   "deficitMeur": -4995.1,
   "debtPct": 58.4,
   "debtMeur": 55090.9,
   "expenditurePct": 44.5,
   "revenuePct": 39.2,
   "interestPct": 1.2,
   "gdpGrowth": -2.6,
   "gdpMeur": 94320.6,
   "unemployment": 6.7,
   "inflation": 2,
   "population": 5457873,
   "gdpPcPps": 73.8,
   "minWage": 580,
   "medianIncome": 8703,
   "povertyRate": 11.4,
   "employment": 74.6
  },
  {
   "year": 2021,
   "deficitPct": -5.1,
   "deficitMeur": -5186,
   "debtPct": 60.2,
   "debtMeur": 61355.9,
   "expenditurePct": 44.8,
   "revenuePct": 39.8,
   "interestPct": 1.1,
   "gdpGrowth": 5.7,
   "gdpMeur": 101891.6,
   "unemployment": 6.8,
   "inflation": 2.8,
   "population": 5459781,
   "gdpPcPps": 73.4,
   "minWage": 623,
   "medianIncome": 8473,
   "povertyRate": 12.3,
   "employment": 74.6
  },
  {
   "year": 2022,
   "deficitPct": -1.6,
   "deficitMeur": -1719.5,
   "debtPct": 57.8,
   "debtMeur": 63508.6,
   "expenditurePct": 43.1,
   "revenuePct": 41.5,
   "interestPct": 1,
   "gdpGrowth": 0.5,
   "gdpMeur": 109959.8,
   "unemployment": 6.1,
   "inflation": 12.1,
   "population": 5434712,
   "gdpPcPps": 70.5,
   "minWage": 646,
   "medianIncome": 8819,
   "povertyRate": 13.7,
   "employment": 76.7
  },
  {
   "year": 2023,
   "deficitPct": -5.3,
   "deficitMeur": -6556.4,
   "debtPct": 55.8,
   "debtMeur": 68882.2,
   "expenditurePct": 48.4,
   "revenuePct": 43.1,
   "interestPct": 1.2,
   "gdpGrowth": 2.1,
   "gdpMeur": 123538.7,
   "unemployment": 5.8,
   "inflation": 11,
   "population": 5428792,
   "gdpPcPps": 74.1,
   "minWage": 700,
   "medianIncome": 9214,
   "povertyRate": 14.3,
   "employment": 77.5
  },
  {
   "year": 2024,
   "deficitPct": -5.3,
   "deficitMeur": -6962.8,
   "debtPct": 59.7,
   "debtMeur": 77734.8,
   "expenditurePct": 47.4,
   "revenuePct": 42.1,
   "interestPct": 1.4,
   "gdpGrowth": 1.9,
   "gdpMeur": 130207.5,
   "unemployment": 5.3,
   "inflation": 3.2,
   "population": 5424687,
   "gdpPcPps": 74.3,
   "minWage": 750,
   "medianIncome": 10171,
   "povertyRate": 14.5,
   "employment": 78.1
  },
  {
   "year": 2025,
   "deficitPct": -4.5,
   "deficitMeur": -6086.3,
   "debtPct": 61.4,
   "debtMeur": 83956.8,
   "expenditurePct": 47.9,
   "revenuePct": 43.5,
   "interestPct": 1.5,
   "gdpGrowth": 0.8,
   "gdpMeur": 136754.3,
   "unemployment": 5.4,
   "inflation": 4.2,
   "population": 5419451,
   "gdpPcPps": 74.7,
   "minWage": 816,
   "medianIncome": 12990,
   "povertyRate": 12.2,
   "employment": 78.1
  }
 ],
 "compare": {
  "geos": [
   {
    "code": "SK",
    "label": "Slovensko"
   },
   {
    "code": "CZ",
    "label": "Česko"
   },
   {
    "code": "PL",
    "label": "Poľsko"
   },
   {
    "code": "HU",
    "label": "Maďarsko"
   },
   {
    "code": "AT",
    "label": "Rakúsko"
   },
   {
    "code": "EA20",
    "label": "Eurozóna"
   },
   {
    "code": "EU27_2020",
    "label": "EÚ 27"
   }
  ],
  "indicators": {
   "deficitPct": {
    "label": "Saldo verejnej správy, % HDP",
    "year": 2025,
    "dataset": "gov_10dd_edpt1",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en",
    "updated": "2026-04-22"
   },
   "debtPct": {
    "label": "Dlh verejnej správy, % HDP",
    "year": 2025,
    "dataset": "gov_10dd_edpt1",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table?lang=en",
    "updated": "2026-04-22"
   },
   "gdpGrowth": {
    "label": "Reálny rast HDP, %",
    "year": 2025,
    "dataset": "nama_10_gdp",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en",
    "updated": "2026-09-08"
   },
   "inflation": {
    "label": "Inflácia HICP, %",
    "year": 2025,
    "dataset": "prc_hicp_aind",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_aind/default/table?lang=en",
    "updated": "2026-02-06"
   },
   "unemployment": {
    "label": "Nezamestnanosť 15–74, %",
    "year": 2025,
    "dataset": "une_rt_a",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/une_rt_a/default/table?lang=en",
    "updated": "2026-09-10"
   },
   "gdpPcPps": {
    "label": "HDP na obyvateľa v PPS, EÚ = 100",
    "year": 2025,
    "dataset": "nama_10_pc",
    "url": "https://ec.europa.eu/eurostat/databrowser/view/nama_10_pc/default/table?lang=en",
    "updated": "2026-09-08"
   }
  },
  "rows": [
   {
    "geo": "SK",
    "deficitPct": -4.5,
    "debtPct": 61.4,
    "gdpGrowth": 0.8,
    "inflation": 4.2,
    "unemployment": 5.4,
    "gdpPcPps": 74.7
   },
   {
    "geo": "CZ",
    "deficitPct": -2.1,
    "debtPct": 44.3,
    "gdpGrowth": 2.6,
    "inflation": 2.3,
    "unemployment": 2.8,
    "gdpPcPps": 92.5
   },
   {
    "geo": "PL",
    "deficitPct": -7.3,
    "debtPct": 59.7,
    "gdpGrowth": 3.6,
    "inflation": 3.3,
    "unemployment": 3.1,
    "gdpPcPps": 81.1
   },
   {
    "geo": "HU",
    "deficitPct": -4.7,
    "debtPct": 74.6,
    "gdpGrowth": 0.5,
    "inflation": 4.4,
    "unemployment": 4.4,
    "gdpPcPps": 76.1
   },
   {
    "geo": "AT",
    "deficitPct": -4.2,
    "debtPct": 81.5,
    "gdpGrowth": 0.8,
    "inflation": 3.6,
    "unemployment": 5.7,
    "gdpPcPps": 117.6
   },
   {
    "geo": "EA20",
    "deficitPct": -2.9,
    "debtPct": 87.8,
    "gdpGrowth": 1.2,
    "inflation": 2.1,
    "unemployment": 6.4,
    "gdpPcPps": 103.8
   },
   {
    "geo": "EU27_2020",
    "deficitPct": -3.1,
    "debtPct": 81.7,
    "gdpGrowth": 1.4,
    "inflation": 2.5,
    "unemployment": 6,
    "gdpPcPps": 100
   }
  ]
 }
};
