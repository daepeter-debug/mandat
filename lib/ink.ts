// Čitateľná farba textu na farebnom podklade (napr. monogram vo farbe strany): biela, alebo tmavá, ak má väčší kontrast.
const channel = (hex: string, i: number) => {
  const v = parseInt(hex.slice(i, i + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export function inkOn(color: string): string {
  const m = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return "#fff";
  const l = 0.2126 * channel(m[1], 0) + 0.7152 * channel(m[1], 2) + 0.0722 * channel(m[1], 4);
  const onWhite = 1.05 / (l + 0.05), onDark = (l + 0.05) / 0.07;   // tmavý text #1b2a22 má jas ≈ 0,02
  return onWhite >= onDark ? "#fff" : "#1b2a22";
}
