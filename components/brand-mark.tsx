// Logo Mandátu: polkruh jedenástich kresiel, tmavá väčšina (6) a svetlá menšina (5) ako odkaz na parlament.
const seats = [[3, 26, 1], [4.7, 19.6, 1], [9.3, 15, 1], [16, 13.2, 1], [8.8, 26, 1], [11.9, 20.2, 1], [22.7, 15, 0], [27.3, 19.6, 0], [29, 26, 0], [20.1, 20.2, 0], [23.2, 26, 0]] as const;

export default function BrandMark() {
  return <svg className="brand-mark" viewBox="0.4 10.6 31.2 18" aria-hidden="true" focusable="false">
    {seats.map(([x, y, majority]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.3} className={majority ? "is-majority" : "is-rest"}/>)}
  </svg>;
}
