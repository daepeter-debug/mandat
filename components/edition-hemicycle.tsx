import MiniHemicycle from "@/components/mini-hemicycle";
import { edition } from "@/lib/edition";
import { blocSeats, optionalPartners } from "@/lib/blocs";
const groups = blocSeats(edition.now.rows, optionalPartners.map(p => p.id));
const colors = [groups.coalition, groups.others, groups.opposition].flatMap(g => g.members.flatMap(p => Array.from({ length: p.seats }, () => p.color)));
export default function EditionHemicycle({ onOpen }: { onOpen: () => void }) {
  const w = edition.withPartners;
  return <button type="button" className="edition-seat-link" onClick={onOpen} aria-label="Preskúmať scenár v parlamente">
    <MiniHemicycle className="edition-seat-arc" colors={colors} majority label={`Model Mandát, scenár: ${w.coalitionLabel} ${w.coalition} kresiel, ${w.oppositionLabel} ${w.opposition}, ostatní ${w.others}. Väčšina 76.`}/>
    <span>150 kresiel · scenár Modelu Mandát <span aria-hidden="true">↗</span></span>
  </button>;
}
