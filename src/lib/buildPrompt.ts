/**
 * 선택값 → 프롬프트. UI와 무관한 순수 함수다.
 * 같은 입력이면 항상 같은 문자열을 돌려준다(AI 호출·시간·난수 없음).
 */
import { colorById, defaults, DETAIL_KEYS, detailById, layoutById, slideTypeById, styleById, typographyById } from '../data';
import type { AppState, ColorSet, DetailKey, LayoutOption, Option, PromptMode, SlideType, StepKey, TypographyOption } from '../types';
import { josa } from './korean';

export type Resolved = {
  purpose: string;
  styleMain: Option;
  styleSubs: Option[];
  layout: LayoutOption;
  color: ColorSet;
  typography: TypographyOption;
  details: Record<DetailKey, Option>;
  slides: { type: SlideType; memo: string }[];
  /** 고르지 않아 기본값으로 채운 항목. 결과 화면 표시용이며 프롬프트 본문에는 쓰지 않는다. */
  filled: { purpose: boolean; style: boolean; layout: boolean; color: boolean; typography: boolean; details: Record<DetailKey, boolean> };
};

/** 고르지 않은 단계에 기본값을 채워, 프롬프트에 실제로 들어갈 값을 정한다. */
export function resolveSelections(state: AppState): Resolved {
  const purpose = state.purpose.trim();
  const styleMain = state.style.main ? styleById.get(state.style.main) : undefined;
  const layout = state.layout ? layoutById.get(state.layout) : undefined;
  const color = state.color ? colorById.get(state.color) : undefined;
  const typography = state.typography ? typographyById.get(state.typography) : undefined;

  const details = {} as Record<DetailKey, Option>;
  const detailFilled = {} as Record<DetailKey, boolean>;
  for (const key of DETAIL_KEYS) {
    const picked = state.details[key] ? detailById.get(state.details[key]!) : undefined;
    details[key] = picked ?? defaults.details[key];
    detailFilled[key] = !picked;
  }

  return {
    purpose: purpose || defaults.purpose,
    styleMain: styleMain ?? defaults.style,
    styleSubs: state.style.subs
      .map((id) => styleById.get(id))
      .filter((o): o is Option => !!o && o.id !== (styleMain ?? defaults.style).id)
      .slice(0, 2),
    layout: layout ?? defaults.layout,
    color: color ?? defaults.color,
    typography: typography ?? defaults.typography,
    details,
    slides: state.slides.flatMap((s) => {
      const type = slideTypeById.get(s.typeId);
      return type ? [{ type, memo: s.memo.trim() }] : [];
    }),
    filled: { purpose: !purpose, style: !styleMain, layout: !layout, color: !color, typography: !typography, details: detailFilled },
  };
}

/** "A를 기반으로, B와 C를 보조로" */
function styleSentence(main: Option, subs: Option[]): string {
  const base = `${josa(main.promptText, '을', '를')} 기반으로`;
  if (subs.length === 0) return base;
  const names = subs.map((s) => s.promptText);
  const joined = names.length === 1 ? names[0] : `${josa(names[0], '과', '와')} ${names[1]}`;
  return `${base}, ${josa(joined, '을', '를')} 보조로`;
}

function detailSentence(details: Record<DetailKey, Option>): string {
  return DETAIL_KEYS.map((k) => details[k].promptText).join(', ');
}

export function buildPrompt(state: AppState, mode: PromptMode): string {
  const r = resolveSelections(state);

  if (mode === 'short') {
    return [
      `${r.styleMain.promptText} 기반`,
      `${r.layout.shortText ?? r.layout.name} 레이아웃`,
      `${r.color.name} 색상`,
      r.details.shadow.promptText,
      r.details.decoration.promptText,
    ].join(', ') + '.';
  }

  const { bg, text, accent } = r.color.roles;
  const lines = [
    `[용도] ${r.purpose}`,
    `[전체 스타일] ${styleSentence(r.styleMain, r.styleSubs)}. ${r.layout.promptText}`,
    `[컬러] ${r.color.promptText} (배경 ${bg}, 본문 ${text}, 포인트 ${accent})`,
    `[타이포] ${r.typography.promptText}`,
    `[디테일] ${detailSentence(r.details)}`,
  ];
  if (r.slides.length > 0) {
    lines.push('[슬라이드 구성]');
    r.slides.forEach((s, i) => lines.push(`${i + 1}. ${s.type.promptText}${s.memo ? `: ${s.memo}` : ''}`));
  }
  return lines.join('\n');
}

export const STEP_LABEL: Record<StepKey, string> = {
  style: '스타일',
  layout: '레이아웃·그리드',
  color: '컬러',
  typography: '타이포그래피',
  details: '디테일',
};
