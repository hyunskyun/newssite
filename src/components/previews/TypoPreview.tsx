import type { FontKey, TypographyOption } from '../../types';

export const FONT_STACK: Record<FontKey, string> = {
  sans: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
  serif: '"Noto Serif KR", serif',
  mono: '"JetBrains Mono", "D2Coding", monospace',
  round: 'Jua, "Pretendard Variable", sans-serif',
};

/** 타이포 미리보기: 옵션 데이터(sample)에 적힌 글꼴·굵기로 실제 글자를 보여 준다. */
export default function TypoPreview({ sample }: { sample: TypographyOption['sample'] }) {
  return (
    <div className="pv pv-typo" aria-hidden="true">
      {sample.pointFont && (
        <span className="pv-typo-point" style={{ fontFamily: FONT_STACK[sample.pointFont] }}>
          No.01 — 2026
        </span>
      )}
      <strong style={{ fontFamily: FONT_STACK[sample.headingFont], fontWeight: sample.headingWeight }}>디자인 제목 Aa</strong>
      <span style={{ fontFamily: FONT_STACK[sample.bodyFont], fontWeight: sample.bodyWeight }}>본문은 이렇게 보여요. 가나다라 123</span>
    </div>
  );
}
