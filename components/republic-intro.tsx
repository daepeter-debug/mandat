"use client";

import { ArrowRight, Check, Move, Sprout } from "lucide-react";
import RepublicArt from "@/components/republic-art";
import RepublicCover from "@/components/republic-cover";
import { catalog, type ItemId } from "@/lib/republic";

type Props={
  chapter:number; started:boolean; ready:boolean; placing:boolean; moving:boolean;
  celebration:string|null; needsSpace:boolean; hasGreen:boolean; blocked:boolean; needsFunds:boolean;
  onStart:()=>void; onBuild:(id:ItemId)=>void; onMove:()=>void;
  onFinish:()=>void; onContinue:()=>void; onExplore:()=>void;
};
export default function RepublicIntro(p:Props) {
  const first=p.chapter===0;
  const celebrating=!!p.celebration;
  const welcome=first&&!p.started&&!celebrating;
  return <section className={`republic-intro${celebrating?" is-celebrating":""}${welcome?" republic-welcome":""}`} aria-label="Prvé kroky v štvrti">
    {welcome&&<div className="republic-welcome-scene"><RepublicCover eager/></div>}
    <div className="republic-intro-copy" aria-live="polite">
      <h2 tabIndex={-1}>{celebrating?p.celebration:first&&!p.started?"Vráť život štvrti pri starej stanici.":first?"Miesto, kde sa deti stretnú.":"A čo keby mali knihy na dosah?"}</h2>
      <p>{celebrating?(p.chapter===1?"Eva: „Teraz máme kde byť aj po vyučovaní. Pomôžeš nám ešte s knižnicou?“":"Eva: „Z dvora a knižnice je už miesto pre celú školu. Takto sa začína naša nová štvrť.“"):first&&!p.started?"Zo starej stanice raz môže byť múzeum, tržnica alebo susedská hala. Začni malou pomocou ľuďom, ktorí tu žijú.":first?"Eva, učiteľka: „Po škole nám chýba kúsok zelene. Vyberieš pre deti park alebo záhradu?“":"Eva, učiteľka: „Nájdime knižnici miesto blízko školy. Aj jedna dobre umiestnená budova môže zmeniť celú štvrť.“"}</p>
      {celebrating?<>
        <div className="republic-intro-reward"><Check size={18}/> Hotovo · +2 mince a +1 materiál</div>
        <button className="republic-primary" disabled={p.blocked} onClick={p.onContinue}>{p.chapter===1?"Pomôcť s knižnicou":"Pripraviť prvú slávnosť"}<ArrowRight size={17}/></button>
        {p.chapter===2&&<><p className="republic-intro-note">Nina: „Knižnica je otvorená. Pozvime aj ostatných susedov!“ Čaká ťa sedem herných dní, rozdielne zadania a brána pre tvoju štvrť. Ďalší deň otvoríš hneď po splnení cieľov.</p><button className="republic-intro-skip" onClick={p.onExplore}>Najprv si upravím štvrť</button></>}
      </>:!p.started&&first?<>
        <button className="republic-primary" onClick={p.onStart}>Pomôcť Eve pri škole<ArrowRight size={17}/></button>
        <small>Dve krátke úlohy. Stavby môžeš zadarmo premiestňovať.</small>
      </>:p.ready?<>
        <p className="republic-intro-feedback"><Check size={17}/>{first?"Zeleň aj škola sú spojené s cestou. Dvor môže ožiť.":"Škola aj knižnica sú blízko seba a dostupné po ceste."}</p>
        <button className="republic-primary" disabled={p.blocked} onClick={p.onFinish}>{first?"Otvoriť školský dvor":"Otvoriť knižnicu pre školu"}<ArrowRight size={17}/></button>
      </>:p.placing?<p className="republic-intro-feedback"><Move size={18}/>{p.moving?(first?"Presuň zeleň na označené miesto blízko školy. Presun je zadarmo.":"Presuň zeleň na označené miesto. Je to zadarmo a uvoľníš priestor pri škole."):"Ťukni na označené miesto na mape. Potom potvrď stavbu pod mapou."}</p>
      :p.needsFunds?<><p className="republic-intro-note">Na ďalšiu stavbu teraz chýbajú zdroje. V štvrti otvor dostupnú zásielku alebo vyzdvihni splnené objednávky. K Eve sa môžeš kedykoľvek vrátiť.</p><button className="republic-primary" onClick={p.onExplore}>Prejsť k zásielkam a objednávkam<ArrowRight size={17}/></button></>
      :first&&!p.hasGreen?<div className="republic-intro-choices">{(["park","garden"] as ItemId[]).map(id=><button key={id} disabled={p.blocked} onClick={()=>p.onBuild(id)}><RepublicArt id={id}/><span><b>{catalog[id].name}</b><small>{id==="park"?"Tieň a miesto na oddych":"Spoločné pestovanie a zeleň"}</small><strong>3 mince · 2 materiály</strong></span><ArrowRight size={17}/></button>)}</div>
      :<>
        <p className="republic-intro-note">{first?"Zeleň už máš. Presuň ju bližšie ku škole a k ceste.":p.needsSpace?"Miesto pri škole zaberá zeleň. Presuň ju zadarmo a uvoľni priestor knižnici.":"Vyber miesto pri škole. Knižnica stojí 6 mincí a 3 materiály."}</p>
        <button className="republic-primary" disabled={p.blocked} onClick={first||p.needsSpace?p.onMove:()=>p.onBuild("library")}>{first||p.needsSpace?<><Move size={17}/>Presunúť zeleň</>:<>Vybrať miesto pre knižnicu<ArrowRight size={17}/></>}</button>
      </>}
      {!celebrating&&<button className="republic-intro-skip" onClick={p.onExplore}>Chcem objavovať sám</button>}
    </div>
    {!welcome&&<div className="republic-intro-art" aria-hidden="true"><RepublicArt id={celebrating?(p.chapter===1?"park":"library"):first?"school":"library"}/>{celebrating&&<span><Sprout size={20}/> Štvrť ožíva</span>}</div>}
  </section>;
}
