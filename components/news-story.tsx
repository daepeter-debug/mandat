"use client";
import { useRef, useState, type CSSProperties } from "react";
import { Dialog } from "radix-ui";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Share2, X } from "lucide-react";
import { dayHeading, type NewsDay } from "@/lib/political-news";
import { newsStoryTones, storySummary } from "@/lib/news-story";
import { NewsCategoryChip } from "@/components/news-room";
import { StoryProgress, shareStoryImage, useStoryGestures } from "@/components/story-controls";
import "@/app/story.css";
import "@/app/news-story.css";

export default function NewsStory({ day, older, onClose, onOlder, onDetail }: {
  day: NewsDay; older?: NewsDay; onClose: () => void; onOlder: (date: string) => void; onDetail: (id: string) => void;
}) {
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(false), [hold, setHold] = useState(false);
  const [sharing, setSharing] = useState(false), [message, setMessage] = useState("");
  const card = useRef<HTMLDivElement>(null), count = day.items.length + 2, last = index === count - 1;
  const item = day.items[index - 1], bg = item ? newsStoryTones[item.category] : "#183c31";
  const next = () => setIndex(i => Math.min(count - 1, i + 1)), prev = () => setIndex(i => Math.max(0, i - 1));
  const gestures = useStoryGestures({ card, next, prev, close: onClose, hold: setHold, pause: () => setPaused(v => !v) });
  async function share() {
    if (sharing) return; setSharing(true); setMessage("");
    try {
      const { newsStoryCardImage } = await import("@/components/story-image");
      const blob = await newsStoryCardImage(day, index);
      if (!blob) throw new Error("canvas");
      const result = await shareStoryImage(blob, `mandat-den-${day.date}-${index + 1}.png`, `Deň v politike · ${dayHeading(day.date)}`);
      if (result === "downloaded") setMessage("Karta je uložená medzi stiahnutými súbormi.");
    } catch { setMessage("Kartu sa nepodarilo vytvoriť. Skús zdieľanie znova."); }
    finally { setSharing(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="story-overlay"/>
    <Dialog.Content className="story news-story" ref={card} onKeyDown={gestures.onKeyDown} aria-describedby="news-story-help"
      style={{ "--story-bg": bg, "--dur": "7s", "--play": paused || hold || sharing ? "paused" : "running" } as CSSProperties}>
      <Dialog.Title className="sr-only">Deň za 30 sekúnd · {dayHeading(day.date)}</Dialog.Title>
      <p className="sr-only" id="news-story-help">Ťukni vpravo alebo vľavo na ďalšiu alebo predošlú kartu. Podržaním zastavíš príbeh, potiahnutím nadol ho zavrieš. Fungujú aj šípky, medzerník a Esc.</p>
      <div className="story-top"><StoryProgress count={count} index={index} onNext={next}/><div className="story-bar">
        <span className="story-brand"><span><b>Deň za 30 sekúnd</b><small>{index + 1}/{count} · {dayHeading(day.date)}</small></span></span>
        <button type="button" disabled={sharing} onClick={share} aria-label="Zdieľať kartu"><Share2 size={18}/></button>
        <button type="button" onClick={() => setPaused(v => !v)} aria-label={paused ? "Pokračovať" : "Zastaviť"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>
        <Dialog.Close aria-label="Zavrieť príbeh"><X size={20}/></Dialog.Close>
      </div></div>
      <div className="story-stage news-story-stage" onPointerDown={gestures.onPointerDown} onPointerMove={gestures.onPointerMove} onPointerUp={gestures.onPointerUp} onPointerCancel={gestures.onPointerCancel}>
        <section className="news-story-card" key={index} aria-label={`${index + 1} z ${count}`}>
          {index === 0 ? <><div className="news-story-date" aria-hidden="true">{Number(day.date.slice(8))}<small>{new Date(`${day.date}T12:00:00Z`).toLocaleDateString("sk-SK", { month: "long", timeZone: "Europe/Bratislava" })}</small></div>
            <h2>{dayHeading(day.date)}</h2><p>{day.line || "Podstatné udalosti dňa so zdrojmi."}</p><span className="news-story-source">{day.items.length} správ{day.analyzed !== null ? ` z ${day.analyzed} prejdených udalostí` : ""} · denne overované</span><button type="button" className="news-story-action" onClick={next}>Prejsť udalosťami <ArrowRight size={18}/></button></>
            : last ? <><h2>Si v obraze.</h2><p>{day.items.length} udalostí. Súvislosti a pôvodné zdroje nájdeš v celých zhrnutiach.</p>
              {older && <button type="button" className="news-story-action" onClick={() => onOlder(older.date)}>Ďalší deň <ArrowRight size={18}/><small>{dayHeading(older.date)}</small></button>}
              <button type="button" className="news-story-action secondary" disabled={sharing} onClick={share}><Share2 size={18}/> Zdieľať deň</button><button type="button" className="news-story-return" onClick={onClose}>Späť na správy</button></>
            : <><div className="news-story-rank"><b>{item.rank ?? index}</b><NewsCategoryChip category={item.category}/></div><h2>{item.title}</h2><p>{storySummary(item)}</p><span className="news-story-source">Zdroj: {item.sourceName}</span><button type="button" className="news-story-action" onClick={() => onDetail(item.id)}>Celé zhrnutie <ArrowRight size={18}/></button></>}
        </section>
      </div>
      <p className="story-toast" role="status">{message}</p>
      <div className="story-foot"><button type="button" onClick={prev} disabled={index === 0} aria-label="Predchádzajúca karta"><ChevronLeft size={20}/></button><span>Mandát · vlastné zhrnutia, overiteľné zdroje</span><button type="button" onClick={last ? onClose : next} aria-label={last ? "Zavrieť príbeh" : "Ďalšia karta"}>{last ? <X size={20}/> : <ChevronRight size={20}/>}</button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
