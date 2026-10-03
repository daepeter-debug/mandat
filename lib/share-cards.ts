// Náhľady pri zdieľaní odkazu (og:image). Obrázky 1200 × 630 generuje scripts/build-og.mjs
// z ilustrácií v public/images/illustrations; vodoznak ilustrácie ostáva viditeľný. Karta bez ilustrácie (image: null)
// má namiesto nej sálu zhora vo farbách klubov (Parlament).
export type ShareCard = { view: string; image: string | null; title: string; text: string };

export const shareCards: ShareCard[] = [
  { view: "overview", image: "volby", title: "Slovensko v číslach", text: "Prieskumy, parlament, vlády a verejné financie. Overiteľne a zrozumiteľne." },
  { view: "polls", image: "prieskumy", title: "Archív meraní", text: "Kto sa pýtal, kedy a koho. Výsledky s metodikou a pôvodným zdrojom." },
  { view: "parliament", image: null, title: "Parlament", text: "150 kresiel v 2D aj 3D, hlasovania NR SR a ako hlasoval každý poslanec a poslankyňa." },
  { view: "news", image: "volby", title: "Deň v politike", text: "Čo by nemalo zapadnúť: denný súhrn slovenskej politiky, zoradený od najdôležitejšej správy." },
  { view: "finance", image: "hospodarenie", title: "Ako hospodári štát", text: "Deficit, dlh, životná úroveň a porovnanie so susedmi od roku 1995." },
  { view: "responsibility", image: "zodpovednost", title: "Kto nesie zodpovednosť za stav krajiny", text: "Koľko času strávila každá strana vo vláde od roku 1993." },
  { view: "model", image: "volby", title: "Vlastný model parlamentu", text: "Posuňte podporu strán a poskladajte vlastnú väčšinu." },
  { view: "game", image: "mala-republika", title: "Herňa", text: "Kvíz Tridsiatka, Koalícia slov, Denná väčšina, Do decembra a Malá republika." },
];

export const shareCardFor = (view: string | undefined): ShareCard => shareCards.find(c => c.view === view) ?? shareCards[0];
export const shareImagePath = (card: ShareCard) => `/og/${card.view}.jpg`;
