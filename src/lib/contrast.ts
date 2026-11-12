/** WCAG 2.x 명도 대비 계산 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`올바른 16진수 색이 아닙니다: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 두 색의 명도 대비(1 ~ 21) */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type ContrastCheck = { pair: string; ratio: number; min: number; pass: boolean };

/** 컬러 세트 하나가 지켜야 하는 대비 규칙 */
export function checkColorSet(roles: { bg: string; surface: string; text: string; accent: string }): ContrastCheck[] {
  const rule = (pair: string, a: string, b: string, min: number): ContrastCheck => {
    const ratio = contrastRatio(a, b);
    return { pair, ratio, min, pass: ratio >= min };
  };
  return [
    rule('본문(text) : 배경(bg)', roles.text, roles.bg, 4.5),
    rule('본문(text) : 면(surface)', roles.text, roles.surface, 4.5),
    rule('포인트(accent) : 배경(bg)', roles.accent, roles.bg, 3),
  ];
}
