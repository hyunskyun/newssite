import { describe, expect, it } from 'vitest';
import { buildPrompt, resolveSelections } from '../src/lib/buildPrompt';
import { effectiveIds, findConflicts, selectedIds } from '../src/lib/conflicts';
import { checkColorSet, contrastRatio } from '../src/lib/contrast';
import { emptyState, sanitizeState } from '../src/lib/storage';
import { colors, detailGroups, layouts, slideCategories, slideTypes, styles, typography } from '../src/data';
import type { AppState } from '../src/types';

const state = (patch: Partial<AppState> = {}): AppState => ({ ...emptyState(), ...patch });

describe('buildPrompt', () => {
  it('PLAN 8장의 한 줄 요약형 예시와 정확히 같다', () => {
    const s = state({
      style: { main: 'minimal', subs: [] },
      layout: 'bento',
      color: 'calm-white-charcoal',
      details: { shadow: 'shadow-soft', decoration: 'decoration-min' },
    });
    expect(buildPrompt(s, 'short')).toBe('미니멀리즘 기반, 벤토 그리드 레이아웃, 화이트·차콜 색상, 은은한 그림자, 장식은 최소로.');
  });

  it('상세형은 8장 템플릿 순서(용도→스타일→레이아웃→컬러→타이포→디테일→슬라이드)를 따른다', () => {
    const s = state({
      purpose: '슬라이드',
      style: { main: 'minimal', subs: ['flat', 'retro'] },
      layout: 'bento',
      color: 'calm-white-charcoal',
      typography: 'sans-single',
      details: { shadow: 'shadow-soft', radius: 'radius-soft', decoration: 'decoration-min', border: 'border-none', spacing: 'spacing-wide' },
      slides: [
        { uid: 'a', typeId: 'cover', memo: '' },
        { uid: 'b', typeId: 'cards4', memo: '실험 안전수칙' },
        { uid: 'c', typeId: 'cards4', memo: '  ' },
      ],
    });
    expect(buildPrompt(s, 'detail')).toBe(
      [
        '[용도] 슬라이드',
        '[전체 스타일] 미니멀리즘을 기반으로, 플랫 디자인과 레트로를 보조로. 벤토 그리드 레이아웃: 크기가 서로 다른 둥근 사각 칸을 도시락처럼 빈틈없이 맞춰 배치',
        '[컬러] 화이트와 차콜 중심의 차분한 톤 (배경 #FFFFFF, 본문 #2B2D31, 포인트 #3A3F47)',
        '[타이포] 깔끔한 산세리프(고딕) 글꼴 하나로 통일, 제목과 본문은 굵기와 크기로만 구분 (한글 Pretendard)',
        '[디테일] 은은한 그림자, 약간 둥근 모서리, 장식은 최소로, 테두리 없음, 여백은 넓게',
        '[슬라이드 구성]',
        '1. 표지: 큰 제목과 부제, 여백 넓게',
        '2. 4요소 카드: 2×2 카드, 각 카드에 아이콘·제목·한 줄 설명: 실험 안전수칙',
        '3. 4요소 카드: 2×2 카드, 각 카드에 아이콘·제목·한 줄 설명',
      ].join('\n'),
    );
  });

  it('아무것도 고르지 않아도 기본값만으로 프롬프트가 만들어진다', () => {
    const detail = buildPrompt(emptyState(), 'detail');
    expect(detail).toContain('[용도] 슬라이드');
    expect(detail).toContain('[전체 스타일] 미니멀리즘을 기반으로. 카드 그리드 레이아웃');
    expect(detail).toContain('[디테일] 은은한 그림자, 약간 둥근 모서리, 장식은 최소로, 테두리 없음, 여백은 넓게');
    expect(detail).not.toContain('[슬라이드 구성]');
    expect(detail).not.toContain('undefined');
    expect(buildPrompt(emptyState(), 'short')).toBe('미니멀리즘 기반, 카드 그리드 레이아웃, 화이트·차콜 색상, 은은한 그림자, 장식은 최소로.');
    const r = resolveSelections(emptyState());
    expect(r.filled).toMatchObject({ purpose: true, style: true, layout: true, color: true, typography: true });
  });

  it('같은 입력이면 항상 같은 출력이고 입력을 바꾸지 않는다', () => {
    const s = state({ style: { main: 'retro', subs: ['glass'] }, slides: [{ uid: 'x', typeId: 'timeline', memo: '연혁' }] });
    const copy = JSON.stringify(s);
    expect(buildPrompt(s, 'detail')).toBe(buildPrompt(JSON.parse(copy), 'detail'));
    expect(JSON.stringify(s)).toBe(copy);
  });

  it('조사를 받침에 맞게 붙이고 보조 스타일은 최대 2개만 쓴다', () => {
    expect(buildPrompt(state({ style: { main: 'retro', subs: ['minimal'] } }), 'detail')).toContain('레트로를 기반으로, 미니멀리즘을 보조로.');
    const three = buildPrompt(state({ style: { main: 'flat', subs: ['retro', 'glass', 'skeuo'] } }), 'detail');
    expect(three).toContain('플랫 디자인을 기반으로, 레트로와 글라스모피즘을 보조로.');
    expect(three).not.toContain('스큐어모피즘');
  });

  it('모르는 id(지워진 옵션 등)는 기본값으로 대신하고 없는 슬라이드 유형은 건너뛴다', () => {
    const s = state({ layout: 'nope', color: 'nope', slides: [{ uid: '1', typeId: 'nope', memo: '' }, { uid: '2', typeId: 'quote', memo: '' }] });
    const out = buildPrompt(s, 'detail');
    expect(out).toContain('카드 그리드 레이아웃');
    expect(out).toContain('1. 핵심 메시지: 중앙에 큰 문장 한 줄');
  });
});

describe('conflicts', () => {
  it('PLAN 5장의 충돌 규칙 네 가지를 양방향으로 찾는다', () => {
    const pairs: [string, string][] = [
      ['skeuo', 'decoration-min'],
      ['retro', 'decoration-min'],
      ['flat', 'shadow-strong'],
      ['neumorph', 'border-thick'],
      ['neobrutal', 'shadow-soft'],
    ];
    for (const [a, b] of pairs) {
      expect(findConflicts([a, b])).toHaveLength(1);
      expect(findConflicts([b, a])).toHaveLength(1);
    }
    expect(findConflicts(['minimal', 'shadow-soft', 'decoration-min'])).toHaveLength(0);
    expect(findConflicts(['neobrutal', 'shadow-none'])).toHaveLength(0);
  });

  it('직접 고른 것만 볼 때와 기본값까지 볼 때를 구분한다', () => {
    const s = state({ style: { main: 'retro', subs: [] } });
    expect(findConflicts(selectedIds(s))).toHaveLength(0);
    const eff = findConflicts(effectiveIds(s)); // 장식 기본값이 "최소"
    expect(eff).toHaveLength(1);
    expect(eff[0].message).toContain('레트로');
  });
});

describe('데이터', () => {
  it('단계별 옵션 수가 PLAN 5장 표와 같다', () => {
    expect(styles).toHaveLength(8);
    expect(layouts).toHaveLength(8);
    expect(typography).toHaveLength(6);
    expect(detailGroups.map((g) => [g.key, g.options.length])).toEqual([['shadow', 3], ['radius', 3], ['decoration', 3], ['border', 3], ['spacing', 3]]);
    for (const list of [styles, layouts, typography, colors, ...detailGroups.map((g) => g.options)]) {
      expect(list.filter((o) => o.isDefault)).toHaveLength(1);
    }
  });

  it('컬러 32세트가 모두 대비 기준을 통과한다', () => {
    expect(colors).toHaveLength(32);
    for (const c of colors) for (const check of checkColorSet(c.roles)) expect(check.pass, `${c.id} ${check.pair} ${check.ratio.toFixed(2)}`).toBe(true);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('슬라이드 레이아웃: 70종 이상, 카테고리 최소 개수, promptText·모양 중복 없음, 필수 13종 포함', () => {
    expect(slideTypes.length).toBeGreaterThanOrEqual(70);
    for (const cat of slideCategories) {
      expect(slideTypes.filter((s) => s.category === cat.name).length, cat.name).toBeGreaterThanOrEqual(cat.min);
    }
    const cats = new Set(slideCategories.map((c) => c.name));
    for (const s of slideTypes) expect(cats.has(s.category), `${s.id}의 카테고리`).toBe(true);
    expect(new Set(slideTypes.map((s) => s.id)).size).toBe(slideTypes.length);
    expect(new Set(slideTypes.map((s) => s.promptText)).size).toBe(slideTypes.length);
    expect(new Set(slideTypes.map((s) => JSON.stringify([!!s.invert, s.shapes]))).size).toBe(slideTypes.length);
    const required = ['cover', 'agenda', 'section', 'cards4', 'compare3', 'photo-focus', 'big-number', 'timeline', 'process', 'table', 'quote', 'summary', 'closing'];
    for (const id of required) expect(slideTypes.some((s) => s.id === id), id).toBe(true);
    expect(slideTypes.filter((s) => s.id === 'section' || s.id === 'summary').every((s) => s.invert)).toBe(true);
  });

  it('도형이 12 × 6.75 캔버스를 벗어나지 않는다', () => {
    for (const s of slideTypes) {
      for (const sh of s.shapes) {
        const xs = 'x1' in sh ? [sh.x1, sh.x2] : 'cx' in sh ? [sh.cx - sh.r, sh.cx + sh.r] : [sh.x, sh.x + sh.w];
        const ys = 'y1' in sh ? [sh.y1, sh.y2] : 'cy' in sh ? [sh.cy - sh.r, sh.cy + sh.r] : [sh.y, sh.y + ('h' in sh ? sh.h : 0)];
        for (const x of xs) expect(x >= -0.01 && x <= 12.01, `${s.id} x=${x}`).toBe(true);
        for (const y of ys) expect(y >= -0.01 && y <= 6.76, `${s.id} y=${y}`).toBe(true);
      }
    }
  });
});

describe('sanitizeState', () => {
  it('깨진 입력을 안전한 상태로 바꾼다', () => {
    expect(sanitizeState(null)).toEqual(emptyState());
    const s = sanitizeState({ purpose: 3, style: { main: 'flat', subs: ['flat', 'retro', 'glass', 'skeuo', 7] }, slides: [{ typeId: 'cover' }, { typeId: 5 }], unsure: ['color', 'x'] });
    expect(s.purpose).toBe('');
    expect(s.style).toEqual({ main: 'flat', subs: ['retro', 'glass'] });
    expect(s.slides).toHaveLength(1);
    expect(s.slides[0]).toMatchObject({ typeId: 'cover', memo: '' });
    expect(s.unsure).toEqual(['color']);
  });
});
