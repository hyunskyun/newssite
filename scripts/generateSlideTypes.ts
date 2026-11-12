/**
 * 슬라이드 레이아웃 데이터 생성기.
 *
 *   npm run gen:slides
 *
 * - 기본 레이아웃(직접 설계) + 변형 규칙(열 수, 정렬, 이미지 위치, 배경 반전)으로 만든 조합을
 *   src/data/slideTypes.json 에 쓴다.
 * - 어색한 조합은 걸러 내고, 무엇을 남기고 걸렀는지 scripts/slideVariants.review.md 에 적어
 *   사람이 확인할 수 있게 한다.
 * - slideTypes.json 에 사람이 직접 추가한 항목("source": "generated" 가 없는 항목)은 그대로 보존한다.
 *
 * 좌표는 16:9 캔버스를 12 × 6.75 격자로 나눈 값이다.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Shape, SlideType, Paint, Align } from '../src/types';

const W = 12;
const H = 6.75;
const M = 0.9; // 좌우 여백
const R_ = W - M; // 오른쪽 끝

type Extra = { fill?: Paint; stroke?: Paint; opacity?: number; radius?: number; width?: number; align?: Align; size?: number; gap?: number; dash?: boolean; arc?: number; start?: number };

/** 굵은 한 줄(제목) */
const T = (x: number, y: number, w: number, size = 0.4, o: Extra = {}): Shape => ({ type: 'textLines', x, y, w, lines: 1, size, fill: 'text', ...o });
/** 옅은 여러 줄(본문) */
const P = (x: number, y: number, w: number, lines = 2, o: Extra = {}): Shape => ({ type: 'textLines', x, y, w, lines, size: 0.13, fill: 'text', opacity: 0.5, ...o });
const R = (x: number, y: number, w: number, h: number, o: Extra = {}): Shape => ({ type: 'rect', x, y, w, h, fill: 'surface', radius: 0.14, ...o });
const IMG = (x: number, y: number, w: number, h: number, radius = 0.14): Shape => ({ type: 'imagePlaceholder', x, y, w, h, radius });
const C = (cx: number, cy: number, r: number, o: Extra = {}): Shape => ({ type: 'circle', cx, cy, r, fill: 'accent', ...o });
const L = (x1: number, y1: number, x2: number, y2: number, o: Extra = {}): Shape => ({ type: 'line', x1, y1, x2, y2, stroke: 'border', width: 0.05, ...o });
const A = (x1: number, y1: number, x2: number, y2: number, o: Extra = {}): Shape => ({ type: 'arrow', x1, y1, x2, y2, stroke: 'accent', width: 0.07, ...o });

/** 내용 슬라이드 상단의 작은 제목 */
const head = (): Shape[] => [T(M, 0.65, 4.2, 0.3)];

const cols = (n: number, gap = 0.3, x0 = M, x1 = R_) => {
  const w = (x1 - x0 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), w, i }));
};
const rows = (n: number, y0: number, y1: number, gap = 0.25) => {
  const h = (y1 - y0 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ y: y0 + i * (h + gap), h, i }));
};

/** 카드 한 장: (아이콘) + 제목 + 설명 */
const card = (x: number, y: number, w: number, h: number, icon = true, o: Extra = {}): Shape[] => {
  const pad = Math.min(0.32, w * 0.16);
  const out: Shape[] = [R(x, y, w, h, o)];
  let ty = y + pad;
  if (icon) {
    const r = Math.min(0.24, w * 0.13);
    out.push(C(x + pad + r, y + pad + r, r));
    ty = y + pad + r * 2 + 0.25;
  }
  out.push(T(x + pad, ty, (w - pad * 2) * 0.62, 0.17));
  const room = y + h - (ty + 0.4) - pad;
  if (room > 0.1) out.push(P(x + pad, ty + 0.4, w - pad * 2, room > 0.7 ? 3 : room > 0.4 ? 2 : 1));
  return out;
};

type Def = Omit<SlideType, 'source'>;
const defs: Def[] = [];
const add = (d: Def) => defs.push(d);

/* ───────────────────────── 표지·오프닝 ───────────────────────── */
const COVER = '표지·오프닝';
add({
  id: 'cover', name: '표지', category: COVER, tags: ['표지', '제목', '중앙', '오프닝'],
  description: '발표의 첫 장. 제목과 부제를 한가운데 크게 둔다',
  promptText: '표지: 큰 제목과 부제, 여백 넓게',
  shapes: [T(2.5, 2.4, 7, 0.52), T(3.75, 3.3, 4.5, 0.18, { opacity: 0.5 }), L(5.4, 4.15, 6.6, 4.15, { stroke: 'accent', width: 0.09 }), T(4.9, 5.75, 2.2, 0.11, { opacity: 0.4 })],
});
add({
  id: 'cover-left', name: '표지 · 왼쪽 정렬', category: COVER, tags: ['표지', '왼쪽 정렬', '포인트 막대'],
  description: '제목을 왼쪽에 붙이고 세로 포인트 막대로 힘을 준 표지',
  promptText: '왼쪽 정렬 표지: 왼쪽에 세로 포인트 막대, 그 옆에 큰 제목과 부제를 왼쪽 정렬, 왼쪽 아래에 날짜·발표자 한 줄',
  shapes: [R(M, 2.0, 0.14, 1.75, { fill: 'accent', radius: 0 }), T(1.4, 2.05, 6.6, 0.52), T(1.4, 2.95, 4.2, 0.52), T(1.4, 3.6, 3.6, 0.15, { opacity: 0.5 }), T(M, 5.75, 2.6, 0.11, { opacity: 0.4 })],
});
add({
  id: 'cover-right', name: '표지 · 오른쪽 정렬', category: COVER, tags: ['표지', '오른쪽 정렬'],
  description: '제목을 오른쪽 아래로 몰아 여백의 긴장감을 주는 표지',
  promptText: '오른쪽 정렬 표지: 화면 오른쪽 아래에 큰 제목과 부제를 오른쪽 정렬, 왼쪽 위는 크게 비우고 작은 로고 자리만 둠',
  shapes: [C(1.25, 1.05, 0.3, { fill: 'accent' }), T(4.3, 3.6, 6.8, 0.52), T(6.3, 4.5, 4.8, 0.52), T(7.5, 5.4, 3.6, 0.15, { opacity: 0.5 })],
});
add({
  id: 'cover-image-right', name: '표지 · 좌 제목 + 우 이미지', category: COVER, tags: ['표지', '이미지', '좌우 분할'],
  description: '왼쪽에 제목, 오른쪽 절반에 대표 이미지를 두는 표지',
  promptText: '이미지 표지: 왼쪽 절반에 큰 제목·부제·작은 포인트 선, 오른쪽 절반은 화면 끝까지 꽉 채운 대표 이미지',
  shapes: [IMG(6.6, 0, 5.4, H, 0), L(M, 2.2, 1.9, 2.2, { stroke: 'accent', width: 0.09 }), T(M, 2.6, 4.8, 0.45), T(M, 3.35, 3.4, 0.45), T(M, 4.2, 3.8, 0.15, { opacity: 0.5 })],
});
add({
  id: 'cover-fullbleed', name: '표지 · 풀블리드 이미지', category: COVER, tags: ['표지', '배경 이미지', '풀블리드'],
  description: '사진을 화면 가득 깔고 아래쪽에 제목을 얹는 표지',
  promptText: '풀블리드 표지: 화면 전체를 채운 배경 사진, 아래쪽 1/3에 어두운 반투명 띠를 깔고 그 위에 밝은 색 제목과 부제',
  shapes: [IMG(0, 0, W, H, 0), R(0, 3.9, W, 2.85, { fill: 'text', opacity: 0.6, radius: 0 }), T(M, 4.5, 6.5, 0.48, { fill: 'bg' }), T(M, 5.4, 4, 0.17, { fill: 'bg', opacity: 0.75 })],
});
add({
  id: 'cover-typo', name: '표지 · 타이포 중심', category: COVER, tags: ['표지', '타이포', '큰 글자'],
  description: '그림 없이 아주 큰 글자만으로 화면을 채우는 표지',
  promptText: '타이포 표지: 이미지 없이 화면을 가득 채우는 아주 큰 제목 3줄(마지막 줄만 포인트 색), 아래에 가는 가로선과 작은 날짜·발표자 줄',
  shapes: [T(M, 0.9, 9.6, 0.8), T(M, 2.15, 7.4, 0.8), T(M, 3.4, 5, 0.8, { fill: 'accent' }), L(M, 5.45, R_, 5.45, { stroke: 'text', width: 0.04 }), T(M, 5.8, 2.6, 0.11, { opacity: 0.5 }), T(R_ - 1.6, 5.8, 1.6, 0.11, { opacity: 0.5 })],
});
add({
  id: 'cover-presenter', name: '표지 · 날짜·발표자 강조', category: COVER, tags: ['표지', '발표자', '날짜', '프로필'],
  description: '제목 아래에 발표자와 날짜를 카드로 또렷하게 보여 주는 표지',
  promptText: '발표자 강조 표지: 위쪽에 제목과 부제, 아래쪽에 가로로 긴 카드를 두고 그 안에 원형 프로필 사진 자리·발표자 이름·소속, 오른쪽 끝에 날짜 알약 배지',
  shapes: [T(M, 1.3, 7.2, 0.48), T(M, 2.15, 4.6, 0.17, { opacity: 0.5 }), R(M, 4.25, 10.2, 1.5), C(1.85, 5.0, 0.42, { fill: 'muted' }), T(2.55, 4.72, 2.4, 0.19), T(2.55, 5.15, 1.7, 0.12, { opacity: 0.5 }), R(8.9, 4.72, 1.85, 0.56, { fill: 'accent', radius: 0.28 })],
});
add({
  id: 'cover-invert', name: '표지 · 배경 반전', category: COVER, tags: ['표지', '배경 반전', '색 배경'], invert: true,
  description: '배경 전체를 메인색으로 칠해 강한 첫인상을 주는 표지',
  promptText: '배경 반전 표지: 배경 전체를 메인색으로 채우고 가운데에 밝은 색 큰 제목과 부제, 아래에 가는 선과 날짜 한 줄',
  shapes: [T(2.2, 2.5, 7.6, 0.52), T(3.6, 3.4, 4.8, 0.18, { opacity: 0.7 }), L(M, 5.5, R_, 5.5, { stroke: 'text', width: 0.03, opacity: 0.5 }), T(M, 5.8, 2.2, 0.11, { opacity: 0.6 })],
});
add({
  id: 'cover-split-color', name: '표지 · 색면 분할', category: COVER, tags: ['표지', '색면', '분할', '연도'],
  description: '왼쪽 색면에 연도나 회차를 크게, 오른쪽에 제목을 두는 표지',
  promptText: '색면 분할 표지: 왼쪽 40%는 메인색 면에 연도·회차 같은 큰 숫자, 오른쪽 60%는 밝은 배경에 제목과 부제를 왼쪽 정렬',
  shapes: [R(0, 0, 4.6, H, { fill: 'accent', radius: 0 }), T(1.0, 2.75, 2.6, 0.75, { fill: 'bg' }), T(1.0, 3.85, 1.5, 0.14, { fill: 'bg', opacity: 0.7 }), T(5.4, 2.55, 5.4, 0.42), T(5.4, 3.25, 3.8, 0.42), T(5.4, 4.1, 4.2, 0.15, { opacity: 0.5 })],
});

/* ───────────────────────── 목차·구분 ───────────────────────── */
const TOC = '목차·구분';
add({
  id: 'agenda', name: '목차', category: TOC, tags: ['목차', '번호', '리스트', '순서'],
  description: '오늘 다룰 내용을 번호 순서대로 보여 준다',
  promptText: '목차: 번호가 붙은 항목 리스트',
  shapes: [...head(), ...rows(5, 1.65, 6.0, 0.2).flatMap(({ y, i }) => [C(M + 0.27, y + 0.3, 0.27, { fill: i === 0 ? 'accent' : 'surface' }), T(1.85, y + 0.2, 5.6 - (i % 3) * 0.9, 0.19), L(1.85, y + 0.72, R_, y + 0.72)])],
});
add({
  id: 'agenda-2col', name: '목차 · 2열', category: TOC, tags: ['목차', '2열', '6항목'],
  description: '항목이 많을 때 두 줄로 나눠 보여 주는 목차',
  promptText: '2열 목차: 위에 제목, 그 아래 2열 × 3행으로 6개 항목, 각 항목은 네모 번호 칸 + 항목 이름 + 한 줄 설명',
  shapes: [...head(), ...cols(2, 0.6).flatMap(({ x, w }) => rows(3, 1.8, 5.9, 0.35).flatMap(({ y }) => [R(x, y, 0.75, 0.75, { fill: 'accent', radius: 0.12 }), T(x + 1.05, y + 0.1, w * 0.5, 0.18), P(x + 1.05, y + 0.5, w - 1.4, 1)]))],
});
add({
  id: 'agenda-cards', name: '목차 · 카드형', category: TOC, tags: ['목차', '카드', '4항목'],
  description: '각 장을 카드 한 장씩으로 보여 주는 목차',
  promptText: '카드형 목차: 가로로 나란한 카드 4장, 각 카드 위쪽에 큰 번호(포인트 색), 아래쪽에 장 제목과 두 줄 설명',
  shapes: [...head(), ...cols(4).flatMap(({ x, w }) => [R(x, 1.75, w, 4.1), T(x + 0.3, 2.1, 0.7, 0.45, { fill: 'accent' }), T(x + 0.3, 4.3, w - 0.9, 0.18), P(x + 0.3, 4.72, w - 0.6, 2)])],
});
add({
  id: 'agenda-side', name: '목차 · 좌측 색면', category: TOC, tags: ['목차', '색면', '좌우 분할'],
  description: '왼쪽 색면에 "목차" 제목, 오른쪽에 항목을 나열한다',
  promptText: '색면 목차: 왼쪽 1/3은 메인색 면에 "목차" 제목, 오른쪽 2/3에 번호 + 항목 이름 5줄을 가는 구분선으로 나눠 나열',
  shapes: [R(0, 0, 4, H, { fill: 'accent', radius: 0 }), T(0.9, 3.0, 2.2, 0.42, { fill: 'bg' }), T(0.9, 3.75, 1.4, 0.13, { fill: 'bg', opacity: 0.7 }), ...rows(5, 1.0, 5.9, 0.1).flatMap(({ y, h, i }) => [T(4.8, y + 0.3, 0.42, 0.2, { fill: 'accent' }), T(5.6, y + 0.3, 4.6 - (i % 2) * 1.1, 0.19), L(4.8, y + h, R_, y + h)])],
});
add({
  id: 'section', name: '섹션 구분', category: TOC, tags: ['섹션', '구분', '배경 반전', '번호'], invert: true,
  description: '새 장이 시작될 때 색 배경과 큰 번호로 분위기를 바꾼다',
  promptText: '섹션 구분: 배경을 메인색으로 반전, 큰 번호와 제목',
  shapes: [T(M, 1.9, 1.9, 1.1, { opacity: 0.45 }), T(M, 3.6, 6.6, 0.48), T(M, 4.45, 4, 0.16, { opacity: 0.7 })],
});
add({
  id: 'section-big-number', name: '섹션 구분 · 큰 번호', category: TOC, tags: ['섹션', '구분', '큰 번호'],
  description: '밝은 배경에서 아주 큰 장 번호로 구분하는 간지',
  promptText: '큰 번호 섹션 구분: 왼쪽 1/3의 옅은 면에 포인트 색의 아주 큰 장 번호, 오른쪽에 장 제목과 두 줄 소개',
  shapes: [R(0, 0, 4.4, H, { radius: 0 }), T(1.1, 2.5, 2.2, 1.6, { fill: 'accent' }), T(5.2, 2.65, 5.4, 0.44), P(5.2, 3.5, 4.6, 2, { size: 0.15 })],
});
add({
  id: 'section-progress', name: '섹션 구분 · 진행 바', category: TOC, tags: ['섹션', '구분', '진행 바', '단계'],
  description: '전체 중 지금 어디쯤인지 진행 바로 함께 알려 주는 간지',
  promptText: '진행 바 섹션 구분: 가운데 왼쪽에 작은 장 번호 라벨과 큰 장 제목, 화면 아래에 5칸 진행 바를 두고 지금까지 온 칸만 포인트 색으로 채움',
  shapes: [T(M, 2.2, 1.3, 0.14, { fill: 'accent' }), T(M, 2.7, 7, 0.48), T(M, 3.55, 4.2, 0.16, { opacity: 0.5 }), ...cols(5, 0.15).flatMap(({ x, w, i }) => [R(x, 5.5, w, 0.16, { fill: i < 2 ? 'accent' : 'border', radius: 0.08 }), T(x, 5.85, w * 0.5, 0.09, { opacity: i < 2 ? 0.7 : 0.3 })])],
});
add({
  id: 'section-line', name: '섹션 구분 · 가는 선', category: TOC, tags: ['섹션', '구분', '미니멀', '선'],
  description: '가는 선 하나와 제목만으로 조용히 장을 나누는 간지',
  promptText: '선 섹션 구분: 밝은 배경에 작은 장 번호 라벨, 화면을 가로지르는 가는 선, 그 아래 장 제목을 왼쪽 정렬, 오른쪽 아래에 쪽 번호',
  shapes: [T(M, 2.45, 1.4, 0.13, { fill: 'accent' }), L(M, 2.95, R_, 2.95, { stroke: 'text', width: 0.035 }), T(M, 3.35, 6.5, 0.44), T(R_ - 0.6, 5.9, 0.6, 0.11, { opacity: 0.4 })],
});

/* ───────────────────────── 텍스트 중심 ───────────────────────── */
const TEXT = '텍스트 중심';
add({
  id: 'quote', name: '인용·핵심 메시지', category: TEXT, tags: ['핵심 메시지', '한 줄', '중앙', '강조'],
  description: '꼭 기억했으면 하는 문장 하나만 가운데 크게 보여 준다',
  promptText: '핵심 메시지: 중앙에 큰 문장 한 줄',
  shapes: [T(1.6, 3.05, 8.8, 0.55)],
});
add({
  id: 'bullets', name: '불릿 리스트', category: TEXT, tags: ['불릿', '리스트', '글머리'],
  description: '여러 항목을 점(불릿)으로 나열하는 가장 기본적인 글 슬라이드',
  promptText: '불릿 리스트: 위에 제목, 그 아래 둥근 점(불릿)이 붙은 한 줄짜리 항목 5개를 왼쪽 정렬로 나열',
  shapes: [...head(), ...rows(5, 1.8, 5.8, 0.3).flatMap(({ y, i }) => [C(M + 0.1, y + 0.2, 0.1), T(M + 0.55, y + 0.11, 8 - (i % 3) * 1.4, 0.18, { opacity: 0.7 })])],
});
add({
  id: 'quote-mark', name: '인용문', category: TEXT, tags: ['인용', '따옴표', '출처'],
  description: '다른 사람의 말이나 글을 따옴표와 함께 옮겨 보여 준다',
  promptText: '인용문: 왼쪽 위에 포인트 색 큰 따옴표, 그 아래 큰 글씨 인용문 2줄, 짧은 선 뒤에 말한 사람 이름과 출처 한 줄',
  shapes: [C(1.3, 1.6, 0.36), C(2.2, 1.6, 0.36), T(M, 2.6, 9.6, 0.38), T(M, 3.3, 6.8, 0.38), L(M, 4.55, 1.9, 4.55, { stroke: 'accent', width: 0.07 }), T(M, 4.9, 2.6, 0.14, { opacity: 0.55 })],
});
add({
  id: 'definition', name: '용어 정의', category: TEXT, tags: ['용어', '정의', '개념', '사전'],
  description: '새로운 용어를 왼쪽에 크게, 뜻을 오른쪽에 풀어 쓴다',
  promptText: '용어 정의: 왼쪽에 용어를 크게 쓰고 그 아래 작은 영문·발음, 가운데 포인트 색 세로선, 오른쪽에 뜻풀이 문단 5줄',
  shapes: [T(M, 2.6, 3.3, 0.52), T(M, 3.4, 1.7, 0.13, { opacity: 0.45 }), L(5, 1.6, 5, 5.2, { stroke: 'accent', width: 0.07 }), P(5.6, 2.3, 5.4, 5, { size: 0.16 })],
});
add({
  id: 'question', name: '질문 제시', category: TEXT, tags: ['질문', '물음', '도입', '생각'],
  description: '청중에게 질문을 던져 생각하게 만드는 슬라이드',
  promptText: '질문 제시: 가운데 위에 포인트 색 큰 원(물음표 자리), 그 아래 큰 글씨 질문 한 줄을 가운데 정렬, 맨 아래 작은 보조 문구',
  shapes: [C(6, 2.1, 0.85), C(6, 2.1, 0.3, { fill: 'bg' }), T(2.6, 3.7, 6.8, 0.42), T(4.2, 4.55, 3.6, 0.15, { opacity: 0.5 })],
});
add({
  id: 'two-column-text', name: '2단 텍스트', category: TEXT, tags: ['2단', '본문', '문단'],
  description: '긴 글을 신문처럼 두 단으로 나눠 읽기 쉽게 한다',
  promptText: '2단 텍스트: 위에 제목, 그 아래 본문을 같은 너비의 2단으로 나누고 각 단 맨 위에 작은 소제목',
  shapes: [...head(), T(M, 1.75, 2.2, 0.16, { fill: 'accent' }), P(M, 2.25, 4.8, 9), T(6.3, 1.75, 2.2, 0.16, { fill: 'accent' }), P(6.3, 2.25, 4.8, 9)],
});
add({
  id: 'summary-box', name: '요약 박스', category: TEXT, tags: ['요약', '박스', '강조 상자'],
  description: '설명 글 아래에 꼭 기억할 내용을 상자로 따로 묶는다',
  promptText: '요약 박스: 위에 제목과 본문 3줄, 아래에 왼쪽 변이 포인트 색 굵은 선인 강조 상자를 두고 그 안에 소제목과 요약 2줄',
  shapes: [...head(), P(M, 1.75, 10.2, 3, { size: 0.15 }), R(M, 3.55, 10.2, 2.3, { stroke: 'border' }), R(M, 3.55, 0.16, 2.3, { fill: 'accent', radius: 0 }), T(1.5, 3.95, 2.8, 0.2), P(1.5, 4.55, 8.9, 2, { size: 0.15 })],
});
add({
  id: 'statement-sub', name: '핵심 문장 + 근거 3개', category: TEXT, tags: ['주장', '근거', '3열'],
  description: '위에 주장을 크게, 아래에 뒷받침하는 근거 셋을 나란히 둔다',
  promptText: '주장과 근거: 위쪽에 큰 글씨 주장 2줄, 가로 구분선 아래에 3열로 근거를 나란히 배치(각 열은 포인트 색 소제목 + 설명 3줄)',
  shapes: [T(M, 1.0, 9.6, 0.42), T(M, 1.75, 6, 0.42), L(M, 3.2, R_, 3.2), ...cols(3, 0.5).flatMap(({ x, w }) => [T(x, 3.7, w * 0.5, 0.17, { fill: 'accent' }), P(x, 4.2, w, 3)])],
});
add({
  id: 'numbered-points', name: '번호 문단', category: TEXT, tags: ['번호', '문단', '3가지'],
  description: '세 가지 내용을 번호와 함께 위에서 아래로 설명한다',
  promptText: '번호 문단: 위에 제목, 그 아래 세로로 3단락, 각 단락은 왼쪽에 포인트 색 네모 번호 칸, 오른쪽에 소제목과 설명 한 줄',
  shapes: [...head(), ...rows(3, 1.75, 5.9, 0.4).flatMap(({ y }) => [R(M, y, 0.85, 0.85, { fill: 'accent', radius: 0.12 }), T(2.15, y + 0.1, 3.6, 0.2), P(2.15, y + 0.55, 8.6, 2)])],
});
add({
  id: 'text-sidebar', name: '본문 + 사이드 노트', category: TEXT, tags: ['본문', '사이드', '참고', '노트'],
  description: '본문 옆에 참고 사항이나 팁을 작은 상자로 곁들인다',
  promptText: '본문과 사이드 노트: 왼쪽 2/3에 제목과 본문 문단, 오른쪽 1/3에 옅은 면 상자를 세로로 길게 두고 그 안에 포인트 색 "참고" 소제목과 메모 5줄',
  shapes: [...head(), P(M, 1.8, 6.3, 9, { size: 0.14 }), R(7.9, 1.55, 3.2, 4.35), T(8.2, 1.95, 1.5, 0.17, { fill: 'accent' }), P(8.2, 2.5, 2.6, 6)],
});

/* ───────────────────────── 카드·그리드 ───────────────────────── */
const CARDS = '카드·그리드';
add({
  id: 'compare3', name: '3요소 비교', category: CARDS, tags: ['3요소', '3열', '카드', '비교'],
  description: '세 가지를 같은 크기의 카드로 나란히 놓고 견준다',
  promptText: '3요소 비교: 3열 카드, 제목과 짧은 설명',
  shapes: [...head(), ...cols(3).flatMap(({ x, w }) => card(x, 1.7, w, 4.2, false))],
});
add({
  id: 'cards4', name: '4요소 카드', category: CARDS, tags: ['4요소', '2×2', '카드', '아이콘'],
  description: '네 가지 내용을 2×2 카드에 아이콘과 함께 담는다',
  promptText: '4요소 카드: 2×2 카드, 각 카드에 아이콘·제목·한 줄 설명',
  shapes: [...head(), ...rows(2, 1.6, 6.0).flatMap(({ y, h }) => cols(2).flatMap(({ x, w }) => [R(x, y, w, h), C(x + 0.65, y + h / 2, 0.32), T(x + 1.3, y + h / 2 - 0.35, w * 0.45, 0.19), P(x + 1.3, y + h / 2 + 0.15, w - 1.7, 1)]))],
});
add({
  id: 'cards6', name: '6요소 카드 (3×2)', category: CARDS, tags: ['6요소', '3×2', '카드'],
  description: '여섯 가지 내용을 3×2 카드로 한눈에 보여 준다',
  promptText: '6요소 카드: 3열 × 2행 카드 6장, 각 카드에 작은 아이콘·제목·한 줄 설명',
  shapes: [...head(), ...rows(2, 1.6, 6.0).flatMap(({ y, h }) => cols(3).flatMap(({ x, w }) => card(x, y, w, h)))],
});
add({
  id: 'bento4', name: '벤토 4셀', category: CARDS, tags: ['벤토', '4셀', '비대칭'],
  description: '큰 칸 하나와 작은 칸 셋을 도시락처럼 맞춘다',
  promptText: '벤토 4셀: 왼쪽 절반을 차지하는 큰 칸 1개(메인 내용), 오른쪽 위에 가로로 긴 칸 1개, 오른쪽 아래에 작은 칸 2개를 빈틈없이 배치',
  shapes: [...head(), R(M, 1.5, 5.0, 4.5, { fill: 'accent' }), T(1.3, 4.6, 3, 0.26, { fill: 'bg' }), T(1.3, 5.2, 2, 0.13, { fill: 'bg', opacity: 0.7 }), R(6.15, 1.5, 4.95, 2.1), T(6.5, 1.9, 2.2, 0.18), P(6.5, 2.4, 4, 2), R(6.15, 3.85, 2.35, 2.15), C(6.75, 4.45, 0.25), T(6.5, 5.3, 1.3, 0.14), R(8.75, 3.85, 2.35, 2.15), C(9.35, 4.45, 0.25, { fill: 'accent2' }), T(9.1, 5.3, 1.3, 0.14)],
});
add({
  id: 'bento5', name: '벤토 5셀', category: CARDS, tags: ['벤토', '5셀', '비대칭'],
  description: '위에 큰 칸 둘, 아래에 작은 칸 셋을 맞춘 벤토',
  promptText: '벤토 5셀: 윗줄에 넓은 칸 1개(약 60%)와 좁은 칸 1개(약 40%), 아랫줄에 같은 너비의 칸 3개, 넓은 칸 하나만 포인트 색으로 강조',
  shapes: [...head(), R(M, 1.5, 6.1, 2.3), T(1.25, 1.9, 2.6, 0.2), P(1.25, 2.45, 4.8, 2), R(7.25, 1.5, 3.85, 2.3, { fill: 'accent' }), T(7.6, 2.3, 1.9, 0.5, { fill: 'bg' }), T(7.6, 3.1, 1.4, 0.12, { fill: 'bg', opacity: 0.7 }), ...cols(3, 0.25).flatMap(({ x, w }) => [R(x, 4.05, w, 1.95), C(x + 0.55, 4.6, 0.22), T(x + 0.33, 5.1, w * 0.5, 0.15), P(x + 0.33, 5.45, w - 0.7, 1)])],
});
add({
  id: 'bento6', name: '벤토 6셀', category: CARDS, tags: ['벤토', '6셀', '비대칭'],
  description: '크기가 다른 여섯 칸으로 여러 내용을 리듬 있게 담는다',
  promptText: '벤토 6셀: 왼쪽에 세로로 긴 칸 1개, 가운데에 위아래 2칸, 오른쪽에 위 가로로 넓은 칸 1개와 아래 작은 2칸, 총 6칸을 빈틈없이 배치하고 한 칸만 포인트 색',
  shapes: [...head(), R(M, 1.5, 2.9, 4.5), IMG(1.15, 1.75, 2.4, 2.2, 0.1), T(1.15, 4.3, 1.7, 0.17), P(1.15, 4.7, 2.3, 2), R(4.05, 1.5, 2.6, 2.1, { fill: 'accent' }), T(4.35, 2.2, 1.4, 0.4, { fill: 'bg' }), R(4.05, 3.85, 2.6, 2.15), T(4.35, 4.2, 1.4, 0.15), P(4.35, 4.6, 2, 2), R(6.9, 1.5, 4.2, 2.1), T(7.2, 1.85, 2, 0.17), P(7.2, 2.3, 3.5, 2), R(6.9, 3.85, 1.98, 2.15), C(7.89, 4.75, 0.4, { fill: 'accent2' }), R(9.12, 3.85, 1.98, 2.15), C(10.11, 4.75, 0.4, { fill: 'none', stroke: 'accent', width: 0.12 })],
});
add({
  id: 'icon-grid', name: '아이콘 그리드', category: CARDS, tags: ['아이콘', '그리드', '8개', '기능'],
  description: '카드 없이 아이콘과 이름만 줄 맞춰 많이 보여 준다',
  promptText: '아이콘 그리드: 4열 × 2행으로 8개 항목, 카드 테두리 없이 각 항목은 원형 아이콘 + 아래 가운데 정렬 이름 + 짧은 한 줄',
  shapes: [...head(), ...rows(2, 1.7, 5.9, 0.3).flatMap(({ y }) => cols(4, 0.4).flatMap(({ x, w, i }) => [C(x + w / 2, y + 0.55, 0.42, { fill: i % 2 ? 'accent2' : 'accent' }), T(x + w / 2 - 0.7, y + 1.2, 1.4, 0.16), T(x + w / 2 - 0.5, y + 1.55, 1.0, 0.1, { opacity: 0.45 })]))],
});
add({
  id: 'cards-list', name: '가로형 카드 리스트', category: CARDS, tags: ['리스트', '가로 카드', '3행'],
  description: '가로로 긴 카드를 위아래로 쌓아 항목을 차례로 소개한다',
  promptText: '가로형 카드 리스트: 화면 너비의 가로로 긴 카드 3장을 세로로 쌓고, 각 카드는 왼쪽 아이콘 + 제목 + 한 줄 설명 + 오른쪽 끝 화살표',
  shapes: [...head(), ...rows(3, 1.6, 6.0, 0.25).flatMap(({ y, h }) => [R(M, y, 10.2, h), C(1.65, y + h / 2, 0.33), T(2.35, y + h / 2 - 0.3, 3, 0.18), P(2.35, y + h / 2 + 0.12, 6, 1), A(10.2, y + h / 2, 10.7, y + h / 2, { width: 0.06 })])],
});
add({
  id: 'cards-featured', name: '대표 카드 + 보조 2장', category: CARDS, tags: ['대표', '강조 카드', '1+2'],
  description: '가장 중요한 하나를 크게, 나머지 둘을 작게 보여 준다',
  promptText: '대표 카드와 보조 카드: 왼쪽에 포인트 색으로 채운 큰 대표 카드 1장(큰 제목 + 설명), 오른쪽에 일반 카드 2장을 위아래로 쌓음',
  shapes: [...head(), R(M, 1.6, 5.4, 4.4, { fill: 'accent' }), C(1.6, 2.3, 0.35, { fill: 'bg' }), T(1.25, 4.1, 3.6, 0.3, { fill: 'bg' }), P(1.25, 4.75, 4.4, 2, { fill: 'bg', opacity: 0.75 }), ...rows(2, 1.6, 6.0).flatMap(({ y, h }) => [R(6.55, y, 4.55, h), T(6.9, y + 0.4, 2.2, 0.18), P(6.9, y + 0.85, 3.8, 3)])],
});

/* ───────────────────────── 이미지 중심 ───────────────────────── */
const IMAGE = '이미지 중심';
add({
  id: 'photo2', name: '사진 2장', category: IMAGE, tags: ['사진', '2장', '나란히'],
  description: '사진 두 장을 나란히 놓고 각각 설명을 붙인다',
  promptText: '사진 2장: 위에 제목, 같은 크기의 가로 사진 2장을 좌우로 나란히, 각 사진 아래에 캡션 한 줄',
  shapes: [...head(), ...cols(2).flatMap(({ x, w }) => [IMG(x, 1.6, w, 3.6), T(x, 5.45, w * 0.45, 0.15), T(x, 5.8, w * 0.7, 0.1, { opacity: 0.45 })])],
});
add({
  id: 'photo3', name: '사진 3장', category: IMAGE, tags: ['사진', '3장', '세로 사진'],
  description: '세로로 긴 사진 세 장을 나란히 보여 준다',
  promptText: '사진 3장: 위에 제목, 세로로 긴 사진 3장을 같은 간격으로 나란히, 각 사진 아래 가운데 정렬 캡션',
  shapes: [...head(), ...cols(3).flatMap(({ x, w }) => [IMG(x, 1.6, w, 3.85), T(x + w / 2 - 0.8, 5.7, 1.6, 0.14)])],
});
add({
  id: 'gallery', name: '갤러리', category: IMAGE, tags: ['갤러리', '사진 모음', '3×2'],
  description: '사진 여섯 장을 바둑판처럼 모아 보여 준다',
  promptText: '갤러리: 위에 제목, 같은 크기의 사진 6장을 3열 × 2행 격자로 좁은 간격을 두고 배열, 캡션 없음',
  shapes: [...head(), ...rows(2, 1.55, 6.05, 0.15).flatMap(({ y, h }) => cols(3, 0.15).map(({ x, w }) => IMG(x, y, w, h, 0.08)))],
});
add({
  id: 'photo-caption', name: '큰 사진 + 캡션', category: IMAGE, tags: ['사진', '캡션', '중앙'],
  description: '사진 한 장을 액자처럼 가운데 두고 아래에 설명을 단다',
  promptText: '큰 사진과 캡션: 여백을 두고 가운데에 큰 가로 사진 1장, 사진 아래에 가운데 정렬 캡션 제목과 작은 설명 한 줄',
  shapes: [IMG(1.6, 0.7, 8.8, 4.3), T(4.4, 5.35, 3.2, 0.18), T(4.9, 5.8, 2.2, 0.1, { opacity: 0.45 })],
});
add({
  id: 'photo-mosaic', name: '사진 모자이크 (1+2)', category: IMAGE, tags: ['사진', '모자이크', '3장', '비대칭'],
  description: '큰 사진 하나와 작은 사진 둘을 붙여 한 덩어리로 보여 준다',
  promptText: '사진 모자이크: 왼쪽에 큰 사진 1장, 오른쪽에 작은 사진 2장을 위아래로 쌓아 한 덩어리로, 사진 사이 간격은 좁게, 맨 아래 왼쪽에 캡션 한 줄',
  shapes: [IMG(M, 0.7, 6.4, 4.9, 0.1), IMG(7.45, 0.7, 3.65, 2.375, 0.1), IMG(7.45, 3.225, 3.65, 2.375, 0.1), T(M, 5.95, 3.4, 0.13, { opacity: 0.55 })],
});
add({
  id: 'photo-strip', name: '사진 띠 + 3단 설명', category: IMAGE, tags: ['사진', '띠', '파노라마', '3단'],
  description: '가로로 긴 사진 띠 아래에 설명을 세 칸으로 나눠 적는다',
  promptText: '사진 띠와 3단 설명: 위에 제목, 화면 좌우 끝까지 닿는 가로로 긴 사진 띠, 그 아래 3열로 소제목 + 설명 2줄',
  shapes: [...head(), IMG(0, 1.5, W, 2.5, 0), ...cols(3, 0.5).flatMap(({ x, w }) => [T(x, 4.45, w * 0.5, 0.17), P(x, 4.9, w, 2)])],
});

/* ───────────────────────── 데이터·숫자 ───────────────────────── */
const DATA = '데이터·숫자';
add({
  id: 'big-number', name: '큰 숫자 강조', category: DATA, tags: ['숫자', '통계', '강조', '핵심 수치'],
  description: '가장 중요한 숫자 하나를 아주 크게 보여 준다',
  promptText: '핵심 숫자 강조: 숫자를 크게, 설명은 한 줄',
  shapes: [T(M, 1.7, 5.2, 1.5, { fill: 'accent' }), T(M, 3.75, 4.6, 0.19, { opacity: 0.6 }), ...rows(2, 1.5, 5.3, 0.3).flatMap(({ y, h }) => [R(7.6, y, 3.5, h), T(7.95, y + 0.4, 1.5, 0.42), T(7.95, y + 1.1, 2.2, 0.12, { opacity: 0.5 })])],
});
add({
  id: 'numbers3', name: '숫자 3개', category: DATA, tags: ['숫자', '3개', '통계'],
  description: '세 가지 수치를 같은 무게로 나란히 보여 준다',
  promptText: '숫자 3개: 위에 제목, 3열로 큰 숫자(포인트 색) + 숫자 이름 + 설명 2줄, 열 사이에 가는 세로 구분선',
  shapes: [...head(), ...cols(3, 0.8).flatMap(({ x, w, i }) => [T(x, 2.3, w * 0.75, 0.75, { fill: 'accent' }), T(x, 3.5, w * 0.5, 0.17), P(x, 3.95, w * 0.9, 2), ...(i > 0 ? [L(x - 0.4, 2.2, x - 0.4, 4.7)] : [])])],
});
const axes = (x0: number, y0: number, x1: number, y1: number): Shape[] => [L(x0, y0, x0, y1, { stroke: 'text', width: 0.04, opacity: 0.5 }), L(x0, y1, x1, y1, { stroke: 'text', width: 0.04, opacity: 0.5 })];
add({
  id: 'bar-chart', name: '막대 차트', category: DATA, tags: ['차트', '막대', '그래프', '비교'],
  description: '항목별 크기를 세로 막대로 비교한다',
  promptText: '막대 차트: 위에 제목, 세로 막대 6개의 차트를 화면 가득, 가장 높은 막대 하나만 포인트 색으로 강조하고 나머지는 보조색, 막대 아래에 항목 이름',
  shapes: [...head(), ...axes(1.4, 1.6, 11.1, 5.6), ...[1.5, 2.3, 1.9, 3.1, 2.6, 3.7].flatMap((h, i) => [R(1.9 + i * 1.5, 5.6 - h, 0.95, h, { fill: i === 5 ? 'accent' : 'accent2', radius: 0.06 }), T(1.95 + i * 1.5, 5.85, 0.85, 0.09, { opacity: 0.4 })])],
});
const linePts = [[1.9, 4.7], [3.6, 4.0], [5.3, 4.3], [7.0, 3.1], [8.7, 2.7], [10.4, 1.9]];
add({
  id: 'line-chart', name: '선 차트', category: DATA, tags: ['차트', '선', '추이', '변화'],
  description: '시간에 따른 변화를 꺾은선으로 보여 준다',
  promptText: '선 차트: 위에 제목, 옅은 가로 눈금선 위에 꺾은선 1개(포인트 색)와 점 6개, 마지막 점 옆에 값 라벨 배지',
  shapes: [...head(), ...[2.6, 3.6, 4.6].map((y) => L(1.4, y, 11.1, y, { dash: true })), ...axes(1.4, 1.6, 11.1, 5.6), ...linePts.slice(1).map((p, i) => L(linePts[i][0], linePts[i][1], p[0], p[1], { stroke: 'accent', width: 0.09 })), ...linePts.map((p) => C(p[0], p[1], 0.15)), R(9.75, 1.15, 1.3, 0.45, { fill: 'accent', radius: 0.1 })],
});
add({
  id: 'pie-chart', name: '원형 차트', category: DATA, tags: ['차트', '원형', '도넛', '비율'],
  description: '전체에서 각 항목이 차지하는 비율을 도넛 모양으로 보여 준다',
  promptText: '원형 차트: 위에 제목, 왼쪽에 3조각 도넛 차트(가장 큰 조각이 포인트 색, 가운데에 합계 숫자), 오른쪽에 색 네모 + 항목 이름 + 비율로 된 범례 3줄',
  shapes: [...head(), C(3.9, 3.8, 1.55, { fill: 'none', stroke: 'border', width: 0.75 }), C(3.9, 3.8, 1.55, { fill: 'none', stroke: 'accent', width: 0.75, arc: 0.52, start: 0 }), C(3.9, 3.8, 1.55, { fill: 'none', stroke: 'accent2', width: 0.75, arc: 0.28, start: 0.52 }), T(3.4, 3.65, 1.0, 0.3), ...rows(3, 2.4, 5.2, 0.3).flatMap(({ y, i }) => [R(7.0, y + 0.1, 0.4, 0.4, { fill: (['accent', 'accent2', 'border'] as const)[i], radius: 0.06 }), T(7.7, y + 0.2, 2.2 - i * 0.3, 0.17), T(10.3, y + 0.2, 0.8, 0.17, { opacity: 0.5 })])],
});
add({
  id: 'table', name: '비교표', category: DATA, tags: ['표', '비교', '행열', '테이블'],
  description: '여러 항목을 행과 열로 정리해 꼼꼼히 비교한다',
  promptText: '비교표: 헤더 행을 강조한 깔끔한 표',
  shapes: [...head(), R(M, 1.6, 10.2, 0.75, { fill: 'accent', radius: 0.08 }), ...cols(4, 0.3, M + 0.3, R_ - 0.3).map(({ x, w }) => T(x, 1.88, w * 0.6, 0.17, { fill: 'bg' })), ...rows(4, 2.35, 6.0, 0).flatMap(({ y, h, i }) => [...cols(4, 0.3, M + 0.3, R_ - 0.3).map(({ x, w, i: c }) => T(x, y + h / 2 - 0.07, w * (c === 0 ? 0.75 : 0.45), 0.14, { opacity: c === 0 ? 0.8 : 0.45 })), L(M, y + h, R_, y + h, { opacity: i === 3 ? 0 : 1 })])],
});
add({
  id: 'progress', name: '진행률 막대', category: DATA, tags: ['진행률', '퍼센트', '달성도', '막대'],
  description: '목표 대비 얼마나 왔는지 가로 막대로 보여 준다',
  promptText: '진행률 막대: 위에 제목, 4개 항목을 세로로 나열, 각 항목은 이름 + 오른쪽 끝 퍼센트 숫자 + 그 아래 옅은 바탕 막대 위에 달성한 만큼만 포인트 색으로 채운 가로 막대',
  shapes: [...head(), ...rows(4, 1.7, 5.9, 0.35).flatMap(({ y, i }) => [T(M, y, 2.4 - (i % 2) * 0.5, 0.16), T(R_ - 0.7, y, 0.7, 0.16, { fill: 'accent' }), R(M, y + 0.38, 10.2, 0.28, { fill: 'border', radius: 0.14 }), R(M, y + 0.38, [8.2, 6.1, 9.3, 3.9][i], 0.28, { fill: 'accent', radius: 0.14 })])],
});
add({
  id: 'kpi-cards', name: 'KPI 카드', category: DATA, tags: ['KPI', '지표', '카드', '대시보드'],
  description: '핵심 지표 네 개를 카드로 정리해 현황판처럼 보여 준다',
  promptText: 'KPI 카드: 위에 제목, 가로로 카드 4장, 각 카드에 작은 지표 이름·큰 숫자·증감 배지·작은 추세선(스파크라인)',
  shapes: [...head(), ...cols(4).flatMap(({ x, w, i }) => [R(x, 1.9, w, 3.6), T(x + 0.28, 2.25, w * 0.45, 0.12, { opacity: 0.5 }), T(x + 0.28, 2.75, w * 0.6, 0.5), R(x + 0.28, 3.6, 0.8, 0.3, { fill: i === 2 ? 'accent2' : 'accent', radius: 0.15 }), L(x + 0.28, 4.95, x + w * 0.4, 4.6, { stroke: 'accent', width: 0.06 }), L(x + w * 0.4, 4.6, x + w * 0.62, 4.8, { stroke: 'accent', width: 0.06 }), L(x + w * 0.62, 4.8, x + w - 0.28, 4.3, { stroke: 'accent', width: 0.06 })])],
});
add({
  id: 'before-after', name: '전후 비교', category: DATA, tags: ['전후', '비포 애프터', '변화', '개선'],
  description: '바뀌기 전과 후의 수치를 나란히 놓아 변화를 강조한다',
  promptText: '전후 비교: 위에 제목, 왼쪽 "이전" 패널(옅은 면, 회색 숫자)과 오른쪽 "이후" 패널(포인트 색 테두리, 포인트 색 큰 숫자)을 나란히, 두 패널 사이에 오른쪽을 향한 화살표',
  shapes: [...head(), R(M, 1.7, 4.4, 4.1), T(1.3, 2.1, 1.0, 0.14, { opacity: 0.5 }), T(1.3, 3.0, 2.4, 0.7, { opacity: 0.35 }), P(1.3, 4.3, 3.4, 2), A(5.55, 3.75, 6.45, 3.75, { width: 0.1 }), R(6.7, 1.7, 4.4, 4.1, { fill: 'bg', stroke: 'accent' }), T(7.1, 2.1, 1.0, 0.14, { fill: 'accent' }), T(7.1, 3.0, 2.9, 0.7, { fill: 'accent' }), P(7.1, 4.3, 3.4, 2)],
});
add({
  id: 'bar-horizontal', name: '가로 막대 순위', category: DATA, tags: ['차트', '가로 막대', '순위', '랭킹'],
  description: '항목을 큰 순서대로 가로 막대로 줄 세운다',
  promptText: '가로 막대 순위: 위에 제목, 5개 항목을 값이 큰 순서로 세로 나열, 각 줄은 왼쪽 항목 이름 + 길이가 값에 비례하는 가로 막대 + 막대 끝 숫자, 1위 막대만 포인트 색',
  shapes: [...head(), ...rows(5, 1.7, 5.9, 0.3).flatMap(({ y, h, i }) => { const w = [7.4, 6.0, 4.9, 3.5, 2.2][i]; return [T(M, y + h / 2 - 0.08, 1.6 - (i % 2) * 0.3, 0.15, { opacity: 0.7 }), R(2.9, y, w, h, { fill: i === 0 ? 'accent' : 'accent2', radius: 0.08 }), T(2.9 + w + 0.2, y + h / 2 - 0.08, 0.6, 0.15, { opacity: 0.5 })]; })],
});
add({
  id: 'chart-text', name: '차트 + 해설', category: DATA, tags: ['차트', '해설', '분석', '좌우'],
  description: '왼쪽에 차트, 오른쪽에 그 차트가 말해 주는 내용을 적는다',
  promptText: '차트와 해설: 왼쪽 60%에 세로 막대 차트(막대 5개), 오른쪽 40%에 포인트 색 핵심 수치 한 줄과 해설 제목, 불릿 3줄',
  shapes: [...head(), ...axes(1.3, 1.7, 6.9, 5.6), ...[1.4, 2.2, 1.8, 2.9, 3.5].map((h, i) => R(1.7 + i * 1.02, 5.6 - h, 0.7, h, { fill: i === 4 ? 'accent' : 'accent2', radius: 0.06 })), T(7.7, 1.8, 2.2, 0.55, { fill: 'accent' }), T(7.7, 2.75, 3, 0.19), ...rows(3, 3.4, 5.5, 0.2).flatMap(({ y }) => [C(7.8, y + 0.15, 0.08), T(8.1, y + 0.08, 2.9, 0.13, { opacity: 0.5 })])],
});
add({
  id: 'stat-rings', name: '원형 진행률 3개', category: DATA, tags: ['원형', '진행률', '링', '퍼센트'],
  description: '세 가지 달성률을 동그란 링으로 나란히 보여 준다',
  promptText: '원형 진행률 3개: 위에 제목, 가로로 원형 링 3개, 각 링은 달성한 만큼만 포인트 색으로 채우고 가운데에 퍼센트 숫자, 링 아래에 가운데 정렬 항목 이름',
  shapes: [...head(), ...cols(3, 0.6).flatMap(({ x, w, i }) => { const cx = x + w / 2; return [C(cx, 3.35, 1.1, { fill: 'none', stroke: 'border', width: 0.3 }), C(cx, 3.35, 1.1, { fill: 'none', stroke: 'accent', width: 0.3, arc: [0.78, 0.55, 0.9][i], start: 0 }), T(cx - 0.45, 3.2, 0.9, 0.3), T(cx - 0.8, 5.05, 1.6, 0.16), T(cx - 0.55, 5.45, 1.1, 0.1, { opacity: 0.45 })]; })],
});

/* ───────────────────────── 프로세스·흐름 ───────────────────────── */
const PROC = '프로세스·흐름';
add({
  id: 'process', name: '프로세스 단계', category: PROC, tags: ['프로세스', '단계', '화살표', '절차'],
  description: '일이 진행되는 순서를 화살표로 이어진 상자로 보여 준다',
  promptText: '프로세스: 화살표로 이어진 단계 박스',
  shapes: [...head(), ...cols(4, 0.7).flatMap(({ x, w, i }) => [R(x, 2.5, w, 2.1, i === 0 ? { fill: 'accent' } : {}), T(x + 0.25, 2.85, 0.5, 0.2, { fill: i === 0 ? 'bg' : 'accent' }), T(x + 0.25, 3.45, w - 0.9, 0.16, { fill: i === 0 ? 'bg' : 'text' }), T(x + 0.25, 3.9, w - 0.6, 0.1, { fill: i === 0 ? 'bg' : 'text', opacity: 0.5 }), ...(i < 3 ? [A(x + w + 0.12, 3.55, x + w + 0.58, 3.55)] : [])])],
});
add({
  id: 'process-vertical', name: '세로 단계', category: PROC, tags: ['프로세스', '세로', '단계', '순서'],
  description: '단계를 위에서 아래로 내려가며 설명한다',
  promptText: '세로 단계: 위에 제목, 왼쪽에 세로선으로 이어진 번호 원 4개, 각 원 오른쪽에 단계 이름과 한 줄 설명을 담은 가로로 긴 상자',
  shapes: [...head(), L(1.4, 2.0, 1.4, 5.6, { stroke: 'accent', width: 0.06 }), ...rows(4, 1.6, 6.0, 0.2).flatMap(({ y, h }) => [C(1.4, y + h / 2, 0.32), R(2.2, y, 8.9, h), T(2.55, y + h / 2 - 0.28, 2.4, 0.17), P(2.55, y + h / 2 + 0.1, 6.5, 1)])],
});
add({
  id: 'arrow-flow', name: '원형 노드 흐름', category: PROC, tags: ['흐름', '노드', '화살표', '5단계'],
  description: '동그란 단계 다섯 개를 화살표로 이어 흐름을 보여 준다',
  promptText: '원형 노드 흐름: 위에 제목, 가로로 원 5개를 화살표로 연결, 현재 단계 원만 포인트 색으로 채우고 나머지는 테두리만, 각 원 아래에 단계 이름과 짧은 설명',
  shapes: [...head(), ...cols(5, 0.2).flatMap(({ x, w, i }) => { const cx = x + w / 2; return [C(cx, 3.0, 0.55, i === 1 ? {} : { fill: 'surface', stroke: 'accent', width: 0.06 }), T(cx - 0.6, 4.0, 1.2, 0.15), T(cx - 0.45, 4.35, 0.9, 0.09, { opacity: 0.45 }), ...(i < 4 ? [A(cx + 0.7, 3.0, cx + w + 0.2 - 0.7, 3.0)] : [])]; })],
});
add({
  id: 'cycle', name: '순환', category: PROC, tags: ['순환', '사이클', '반복', '고리'],
  description: '끝나면 다시 처음으로 돌아가는 반복 과정을 고리로 보여 준다',
  promptText: '순환: 가운데 주제 원을 중심으로 위·오른쪽·아래·왼쪽에 단계 원 4개를 놓고 시계 방향 화살표로 이어 고리를 만듦, 각 단계 원 옆에 이름',
  shapes: [C(6, 3.375, 0.8, { fill: 'surface' }), T(5.5, 3.3, 1.0, 0.15), C(6, 1.25, 0.55), C(8.6, 3.375, 0.55, { fill: 'accent2' }), C(6, 5.5, 0.55), C(3.4, 3.375, 0.55, { fill: 'accent2' }), A(6.75, 1.55, 8.2, 2.75), A(8.2, 4.0, 6.75, 5.2), A(5.25, 5.2, 3.8, 4.0), A(3.8, 2.75, 5.25, 1.55), T(6.8, 0.95, 1.4, 0.14), T(9.4, 3.3, 1.4, 0.14), T(6.8, 5.75, 1.4, 0.14), T(1.2, 3.3, 1.4, 0.14)],
});
add({
  id: 'funnel', name: '깔때기', category: PROC, tags: ['깔때기', '퍼널', '전환', '단계별 감소'],
  description: '단계를 거칠수록 수가 줄어드는 과정을 깔때기로 보여 준다',
  promptText: '깔때기: 위에 제목, 왼쪽에 아래로 갈수록 좁아지는 가로 띠 4단(위가 가장 넓고 진함), 각 띠 오른쪽에 단계 이름과 숫자',
  shapes: [...head(), ...rows(4, 1.7, 5.9, 0.12).flatMap(({ y, h, i }) => { const w = 6.4 - i * 1.3; return [R(4.1 - w / 2, y, w, h, { fill: 'accent', radius: 0.08, opacity: 1 - i * 0.2 }), T(8.0, y + h / 2 - 0.2, 1.7, 0.16), T(8.0, y + h / 2 + 0.12, 1.0, 0.1, { opacity: 0.45 }), L(4.1 + w / 2 + 0.15, y + h / 2, 7.8, y + h / 2, { dash: true })]; })],
});
add({
  id: 'stairs', name: '계단', category: PROC, tags: ['계단', '성장', '단계 상승', '레벨'],
  description: '한 단계씩 올라가는 성장 과정을 계단으로 보여 준다',
  promptText: '계단: 위에 제목, 왼쪽에서 오른쪽으로 갈수록 높아지는 계단 4칸(마지막 칸만 포인트 색), 각 칸 위에 단계 이름과 한 줄 설명',
  shapes: [...head(), ...cols(4, 0.12).flatMap(({ x, w, i }) => { const h = 1.0 + i * 0.85; return [R(x, 6.0 - h, w, h, { fill: i === 3 ? 'accent' : 'surface', radius: 0.08 }), T(x + 0.1, 6.0 - h - 0.75, w * 0.55, 0.16), T(x + 0.1, 6.0 - h - 0.4, w * 0.75, 0.1, { opacity: 0.45 })]; })],
});
add({
  id: 'branch', name: '분기', category: PROC, tags: ['분기', '갈래', '선택지', '경우'],
  description: '하나의 출발점에서 여러 갈래로 나뉘는 경우를 보여 준다',
  promptText: '분기: 위에 제목, 왼쪽에 출발 상자 1개(포인트 색), 거기서 화살표 3개가 갈라져 오른쪽에 세로로 놓인 결과 상자 3개로 이어짐, 각 결과 상자에 이름과 한 줄 설명',
  shapes: [...head(), R(M, 3.0, 2.8, 1.5, { fill: 'accent' }), T(1.25, 3.6, 1.8, 0.2, { fill: 'bg' }), ...rows(3, 1.65, 5.85, 0.3).flatMap(({ y, h }) => [A(3.85, 3.75, 6.0, y + h / 2), R(6.2, y, 4.9, h), T(6.55, y + h / 2 - 0.27, 2.0, 0.17), P(6.55, y + h / 2 + 0.1, 3.8, 1)])],
});
add({
  id: 'checklist', name: '체크리스트', category: PROC, tags: ['체크리스트', '확인', '할 일', '점검'],
  description: '확인하거나 준비할 일을 체크 상자와 함께 나열한다',
  promptText: '체크리스트: 위에 제목, 체크 상자 + 한 줄 항목 5개를 세로로 나열, 완료된 위 3개는 포인트 색으로 채운 체크 상자, 나머지 2개는 빈 상자',
  shapes: [...head(), ...rows(5, 1.7, 5.9, 0.25).flatMap(({ y, h, i }) => [R(M, y + h / 2 - 0.25, 0.5, 0.5, i < 3 ? { fill: 'accent', radius: 0.1 } : { fill: 'bg', stroke: 'text', radius: 0.1 }), T(1.75, y + h / 2 - 0.09, 6.5 - (i % 3) * 1.1, 0.18, { opacity: i < 3 ? 0.8 : 0.5 }), L(M, y + h + 0.12, R_, y + h + 0.12, { opacity: i === 4 ? 0 : 1 })])],
});
add({
  id: 'process-3big', name: '3단계 큰 카드', category: PROC, tags: ['3단계', '카드', '화살표', '절차'],
  description: '세 단계를 큼직한 카드로 자세히 설명한다',
  promptText: '3단계 큰 카드: 위에 제목, 세로로 긴 큰 카드 3장을 화살표로 연결, 각 카드 위쪽에 번호 원, 그 아래 단계 이름과 설명 3줄',
  shapes: [...head(), ...cols(3, 0.8).flatMap(({ x, w, i }) => [R(x, 1.7, w, 4.2), C(x + 0.65, 2.35, 0.35), T(x + 0.3, 3.15, w * 0.55, 0.19), P(x + 0.3, 3.65, w - 0.6, 3), ...(i < 2 ? [A(x + w + 0.15, 3.8, x + w + 0.65, 3.8)] : [])])],
});

/* ───────────────────────── 타임라인·로드맵 ───────────────────────── */
const TIME = '타임라인·로드맵';
add({
  id: 'timeline', name: '타임라인', category: TIME, tags: ['타임라인', '가로', '연표', '5단계'],
  description: '시간 순서대로 일어난 일을 가로선 위에 늘어놓는다',
  promptText: '타임라인: 가로 흐름 5단계, 단계별 라벨',
  shapes: [...head(), L(M, 3.3, R_, 3.3, { stroke: 'accent', width: 0.07 }), ...cols(5, 0.2).flatMap(({ x, w, i }) => { const cx = x + w / 2; return [C(cx, 3.3, 0.24, i === 4 ? { fill: 'bg', stroke: 'accent', width: 0.08 } : {}), T(cx - 0.4, 2.55, 0.8, 0.13, { fill: 'accent' }), T(cx - 0.65, 3.95, 1.3, 0.16), T(cx - 0.5, 4.3, 1.0, 0.09, { opacity: 0.45 })]; })],
});
add({
  id: 'timeline-vertical', name: '세로 타임라인', category: TIME, tags: ['타임라인', '세로', '연표'],
  description: '위에서 아래로 내려가며 시간 순서를 보여 준다',
  promptText: '세로 타임라인: 위에 제목, 왼쪽 1/4 지점에 세로선과 점 4개, 선 왼쪽에 날짜, 선 오른쪽에 사건 제목과 한 줄 설명',
  shapes: [...head(), L(3.1, 1.7, 3.1, 5.9, { stroke: 'accent', width: 0.06 }), ...rows(4, 1.7, 5.9, 0.2).flatMap(({ y }) => [T(1.3, y + 0.2, 1.2, 0.15, { fill: 'accent' }), C(3.1, y + 0.27, 0.2), T(3.8, y + 0.18, 3.0, 0.18), P(3.8, y + 0.56, 6.6, 1)])],
});
add({
  id: 'timeline-years', name: '연도별', category: TIME, tags: ['연도', '연혁', '역사', '4개'],
  description: '연도를 크게 써서 해마다 있었던 일을 정리한다',
  promptText: '연도별 타임라인: 위에 제목, 4열로 각 열 맨 위에 포인트 색 큰 연도, 그 아래 열을 관통하는 가로선과 점, 그 아래 옅은 카드에 그해의 일 2줄',
  shapes: [...head(), L(M, 2.95, R_, 2.95), ...cols(4).flatMap(({ x, w }) => [T(x, 1.95, w * 0.6, 0.5, { fill: 'accent' }), C(x + 0.12, 2.95, 0.14), R(x, 3.45, w, 2.4), T(x + 0.25, 3.8, w * 0.5, 0.16), P(x + 0.25, 4.25, w - 0.5, 3)])],
});
add({
  id: 'roadmap', name: '로드맵 단계', category: TIME, tags: ['로드맵', '계획', '지금 다음 나중', '칸반'],
  description: '앞으로 할 일을 지금·다음·나중 세 칸으로 나눠 보여 준다',
  promptText: '로드맵: 위에 제목, "지금·다음·나중" 3열, 각 열 위에 알약 모양 단계 이름표(지금만 포인트 색), 그 아래 할 일 카드를 2~3장씩 세로로 쌓음',
  shapes: [...head(), ...cols(3).flatMap(({ x, w, i }) => [R(x, 1.6, 1.5, 0.48, { fill: (['accent', 'accent2', 'border'] as const)[i], radius: 0.24 }), ...rows(3, 2.35, 6.0, 0.2).slice(0, 3 - (i === 2 ? 1 : 0)).flatMap(({ y, h }) => [R(x, y, w, h), T(x + 0.25, y + 0.25, w * 0.5, 0.14), T(x + 0.25, y + 0.58, w * 0.7, 0.09, { opacity: 0.45 })])])],
});
add({
  id: 'gantt', name: '간트형 일정', category: TIME, tags: ['간트', '일정', '기간', '스케줄'],
  description: '여러 작업의 시작과 끝을 가로 막대로 겹쳐 보여 주는 일정표',
  promptText: '간트형 일정: 위에 제목, 맨 위에 기간(주·월) 눈금 6칸, 왼쪽에 작업 이름 5줄, 각 줄에 시작과 길이가 서로 다른 가로 막대, 옅은 세로 눈금선, 진행 중인 막대만 포인트 색',
  shapes: [...head(), ...cols(6, 0, 3.3, R_).flatMap(({ x, w }) => [T(x + 0.2, 1.65, w * 0.4, 0.1, { opacity: 0.45 }), L(x, 1.95, x, 6.0)]), L(M, 1.95, R_, 1.95), ...rows(5, 2.15, 5.95, 0.25).flatMap(({ y, h, i }) => { const [s, len] = [[0, 2.6], [1.3, 2.6], [2.6, 3.2], [4.2, 2.0], [5.4, 2.4]][i]; return [T(M, y + h / 2 - 0.07, 1.8 - (i % 2) * 0.4, 0.14, { opacity: 0.7 }), R(3.3 + s, y, len, h, { fill: i === 2 ? 'accent' : 'accent2', radius: 0.12 })]; })],
});
add({
  id: 'milestones', name: '마일스톤', category: TIME, tags: ['마일스톤', '목표 지점', '지그재그'],
  description: '중요한 목표 지점을 선 위아래로 번갈아 표시한다',
  promptText: '마일스톤: 화면 가운데 가로선, 그 위에 큰 점 5개, 각 점의 설명 카드를 선 위·아래로 번갈아 배치하고 점과 카드를 짧은 세로선으로 연결, 마지막 점은 깃발처럼 포인트 색 강조',
  shapes: [L(M, 3.375, R_, 3.375, { stroke: 'text', width: 0.05, opacity: 0.6 }), ...cols(5, 0.2).flatMap(({ x, w, i }) => { const cx = x + w / 2; const up = i % 2 === 0; const cy = up ? 0.9 : 4.35; return [L(cx, up ? 2.4 : 3.375, cx, up ? 3.375 : 4.35, { stroke: 'accent', width: 0.05 }), C(cx, 3.375, i === 4 ? 0.3 : 0.2, { fill: i === 4 ? 'accent' : 'accent2' }), R(x, cy, w, 1.5), T(x + 0.2, cy + 0.3, w * 0.5, 0.15), P(x + 0.2, cy + 0.7, w - 0.4, 2, { size: 0.1 })]; })],
});
add({
  id: 'timeline-cards', name: '타임라인 카드', category: TIME, tags: ['타임라인', '카드', '4단계'],
  description: '시간 순서를 따라 각 시점을 카드로 자세히 설명한다',
  promptText: '타임라인 카드: 위에 제목, 그 아래 가로선과 점 4개, 각 점 아래에 날짜 라벨과 세로로 긴 카드(제목 + 설명 3줄)를 매달듯 배치',
  shapes: [...head(), L(M, 1.9, R_, 1.9, { stroke: 'accent', width: 0.06 }), ...cols(4).flatMap(({ x, w }) => [C(x + 0.2, 1.9, 0.2), T(x, 2.4, 0.9, 0.12, { fill: 'accent' }), R(x, 2.85, w, 3.05), T(x + 0.25, 3.2, w * 0.55, 0.17), P(x + 0.25, 3.65, w - 0.5, 3)])],
});

/* ───────────────────────── 비교·관계 ───────────────────────── */
const COMP = '비교·관계';
add({
  id: 'compare-2', name: '좌우 비교', category: COMP, tags: ['비교', '좌우', 'VS', '대결'],
  description: '두 가지를 좌우에 놓고 맞대어 비교한다',
  promptText: '좌우 비교: 위에 제목, 좌우에 같은 크기의 패널 2개(왼쪽은 옅은 면, 오른쪽은 포인트 색 면), 두 패널이 만나는 가운데에 "VS" 원형 배지, 각 패널에 이름과 특징 3줄',
  shapes: [...head(), R(M, 1.6, 4.95, 4.4), T(1.3, 2.05, 2.2, 0.24), ...rows(3, 2.9, 5.5, 0.2).map(({ y }) => T(1.3, y + 0.2, 3.6, 0.13, { opacity: 0.5 })), R(6.15, 1.6, 4.95, 4.4, { fill: 'accent' }), T(6.95, 2.05, 2.2, 0.24, { fill: 'bg' }), ...rows(3, 2.9, 5.5, 0.2).map(({ y }) => T(6.95, y + 0.2, 3.6, 0.13, { fill: 'bg', opacity: 0.7 })), C(6, 3.8, 0.55, { fill: 'bg', stroke: 'text', width: 0.06 }), T(5.7, 3.72, 0.6, 0.15)],
});
add({
  id: 'compare-3col', name: '3열 비교 (가운데 강조)', category: COMP, tags: ['비교', '3열', '요금제', '추천'],
  description: '세 가지 안을 나란히 놓고 추천하는 하나를 도드라지게 한다',
  promptText: '3열 비교: 위에 제목, 세로로 긴 패널 3개, 각 패널 위에 색 띠 머리(이름)와 그 아래 항목 4줄, 가운데 패널만 포인트 색 머리와 테두리로 강조하고 위아래로 조금 더 크게',
  shapes: [...head(), ...cols(3, 0.35).flatMap(({ x, w, i }) => { const mid = i === 1; const y = mid ? 1.45 : 1.75; const h = mid ? 4.7 : 4.1; return [R(x, y, w, h, mid ? { fill: 'bg', stroke: 'accent' } : {}), R(x, y, w, 0.85, { fill: mid ? 'accent' : 'accent2', radius: 0.14 }), T(x + 0.3, y + 0.33, w * 0.45, 0.18, { fill: 'bg' }), ...rows(4, y + 1.15, y + h - 0.3, 0.1).flatMap(({ y: ry, h: rh }) => [C(x + 0.42, ry + rh / 2, 0.09, { fill: mid ? 'accent' : 'accent2' }), T(x + 0.7, ry + rh / 2 - 0.06, w - 1.3, 0.12, { opacity: 0.5 })])]; })],
});
add({
  id: 'pros-cons', name: '장단점', category: COMP, tags: ['장단점', '찬반', '좋은 점 나쁜 점'],
  description: '좋은 점과 아쉬운 점을 두 칸으로 나눠 정리한다',
  promptText: '장단점: 위에 제목, 좌우 2열, 왼쪽 열 머리에 포인트 색 원(＋)과 "장점", 오른쪽 열 머리에 보조색 원(－)과 "단점", 각 열에 한 줄 항목 4개, 두 열 사이에 세로 구분선',
  shapes: [...head(), L(6, 1.7, 6, 5.9), ...cols(2, 1.0).flatMap(({ x, w, i }) => [C(x + 0.35, 2.05, 0.35, { fill: i === 0 ? 'accent' : 'accent2' }), R(x + 0.17, 2.0, 0.36, 0.1, { fill: 'bg', radius: 0 }), ...(i === 0 ? [R(x + 0.3, 1.87, 0.1, 0.36, { fill: 'bg', radius: 0 })] : []), T(x + 0.95, 1.95, 1.3, 0.2), ...rows(4, 2.8, 5.8, 0.2).flatMap(({ y }) => [C(x + 0.12, y + 0.25, 0.08, { fill: i === 0 ? 'accent' : 'accent2' }), T(x + 0.45, y + 0.18, w - 1.0, 0.14, { opacity: 0.55 })])])],
});
add({
  id: 'matrix-2x2', name: '2×2 매트릭스', category: COMP, tags: ['매트릭스', '사분면', '2축', '우선순위'],
  description: '두 가지 기준으로 나눈 네 칸에 항목을 분류한다',
  promptText: '2×2 매트릭스: 가로축과 세로축이 가운데서 교차하는 사분면, 축 끝에 기준 이름 라벨, 네 칸에 각각 이름과 한 줄 설명, 오른쪽 위 칸만 포인트 색으로 강조',
  shapes: [T(M, 0.6, 3.6, 0.26), ...[[2.2, 1.3, false], [6.55, 1.3, true], [2.2, 3.65, false], [6.55, 3.65, false]].flatMap(([x, y, hot]) => [R(x as number, y as number, 4.2, 2.2, hot ? { fill: 'accent' } : {}), T((x as number) + 0.3, (y as number) + 0.35, 1.8, 0.17, { fill: hot ? 'bg' : 'text' }), T((x as number) + 0.3, (y as number) + 0.8, 2.8, 0.1, { fill: hot ? 'bg' : 'text', opacity: 0.6 })]), A(1.9, 6.1, 10.95, 6.1, { stroke: 'text', width: 0.05 }), A(1.9, 6.1, 1.9, 1.15, { stroke: 'text', width: 0.05 }), T(9.6, 6.3, 1.3, 0.1, { opacity: 0.5 }), T(0.5, 1.3, 1.1, 0.1, { opacity: 0.5 })],
});
add({
  id: 'venn', name: '벤 다이어그램', category: COMP, tags: ['벤 다이어그램', '공통점', '겹침', '교집합'],
  description: '두 가지의 공통점과 차이점을 겹친 원으로 보여 준다',
  promptText: '벤 다이어그램: 위에 제목, 반투명한 큰 원 2개를 가운데서 겹치게 배치(왼쪽 포인트 색, 오른쪽 보조색), 각 원 안쪽에 고유한 특징 2줄, 겹친 부분에 공통점 라벨',
  shapes: [...head(), C(4.6, 3.75, 2.05, { fill: 'accent', opacity: 0.55 }), C(7.4, 3.75, 2.05, { fill: 'accent2', opacity: 0.55 }), T(3.0, 3.35, 1.4, 0.16), T(3.0, 3.8, 1.1, 0.1, { opacity: 0.6 }), T(5.5, 3.6, 1.0, 0.18), T(7.7, 3.35, 1.4, 0.16), T(7.7, 3.8, 1.1, 0.1, { opacity: 0.6 })],
});
add({
  id: 'pyramid', name: '피라미드', category: COMP, tags: ['피라미드', '위계', '단계', '기초'],
  description: '아래가 넓고 위가 좁은 층으로 중요도나 위계를 보여 준다',
  promptText: '피라미드: 위에 제목, 왼쪽에 위로 갈수록 좁아지는 4층 피라미드(맨 위층이 포인트 색, 아래로 갈수록 옅게), 각 층 오른쪽에 점선으로 이어진 층 이름과 한 줄 설명',
  shapes: [...head(), ...rows(4, 1.6, 5.9, 0.1).flatMap(({ y, h, i }) => { const w = 1.6 + i * 1.5; return [R(4.0 - w / 2, y, w, h, { fill: i === 0 ? 'accent' : 'accent2', radius: 0.06, opacity: i === 0 ? 1 : 1 - (i - 1) * 0.25 }), L(4.0 + w / 2 + 0.15, y + h / 2, 7.6, y + h / 2, { dash: true }), T(7.8, y + h / 2 - 0.2, 1.6, 0.16), T(7.8, y + h / 2 + 0.12, 2.6, 0.1, { opacity: 0.45 })]; })],
});
add({
  id: 'hierarchy', name: '계층도', category: COMP, tags: ['계층도', '조직도', '트리', '구조'],
  description: '위에서 아래로 갈라지는 나무 모양으로 구조를 보여 준다',
  promptText: '계층도: 위에 제목, 맨 위 가운데에 최상위 상자 1개(포인트 색), 그 아래 2단에 상자 3개, 3단에 상자 6개(2단 상자마다 2개씩)를 선으로 연결한 나무 구조',
  shapes: [...head(), R(4.9, 1.45, 2.2, 0.85, { fill: 'accent' }), T(5.3, 1.8, 1.4, 0.15, { fill: 'bg' }), L(6, 2.3, 6, 2.75), L(2.5, 2.75, 9.5, 2.75), ...[2.5, 6, 9.5].flatMap((cx) => [L(cx, 2.75, cx, 3.15), R(cx - 1.1, 3.15, 2.2, 0.85, { fill: 'accent2' }), T(cx - 0.7, 3.5, 1.4, 0.14, { fill: 'bg' }), L(cx, 4.0, cx, 4.4), L(cx - 0.8, 4.4, cx + 0.8, 4.4), ...[-0.8, 0.8].flatMap((d) => [L(cx + d, 4.4, cx + d, 4.8), R(cx + d - 0.7, 4.8, 1.4, 0.8), T(cx + d - 0.4, 5.14, 0.8, 0.11, { opacity: 0.6 })])])],
});
add({
  id: 'spectrum', name: '스펙트럼', category: COMP, tags: ['스펙트럼', '위치', '양극단', '척도'],
  description: '양 끝 사이 어디쯤에 있는지 한 줄의 척도 위에 표시한다',
  promptText: '스펙트럼: 위에 제목, 화면 가운데에 좌우로 긴 척도 막대(3구간으로 색이 진해짐), 양 끝에 반대되는 기준 이름, 척도 위에 위치를 나타내는 원형 표식 3개와 그 위 이름 라벨',
  shapes: [...head(), R(M, 3.35, 3.4, 0.4, { fill: 'border', radius: 0.2 }), R(4.3, 3.35, 3.4, 0.4, { fill: 'accent2', radius: 0 }), R(7.7, 3.35, 3.4, 0.4, { fill: 'accent', radius: 0.2 }), T(M, 4.1, 1.5, 0.14, { opacity: 0.6 }), T(R_ - 1.5, 4.1, 1.5, 0.14, { opacity: 0.6 }), ...[2.4, 5.6, 9.3].flatMap((cx) => [C(cx, 3.55, 0.34, { fill: 'bg', stroke: 'text', width: 0.08 }), L(cx, 2.75, cx, 3.2, { stroke: 'text', opacity: 0.6 }), T(cx - 0.6, 2.4, 1.2, 0.15)]), P(M, 5.0, 7, 2)],
});
add({
  id: 'hub-spoke', name: '중심과 주변', category: COMP, tags: ['허브', '중심', '관계도', '방사형'],
  description: '가운데 핵심 주제와 그것에 연결된 요소들을 방사형으로 보여 준다',
  promptText: '중심과 주변: 화면 가운데에 포인트 색 큰 원(핵심 주제), 그 둘레에 작은 원 6개를 고르게 놓고 가운데 원과 선으로 연결, 각 작은 원 옆에 이름 라벨',
  shapes: [...[[2.9, 1.5], [9.1, 1.5], [1.9, 3.375], [10.1, 3.375], [2.9, 5.25], [9.1, 5.25]].flatMap(([cx, cy], i) => [L(6, 3.375, cx, cy, { stroke: 'accent2', width: 0.05 }), C(cx, cy, 0.5, { fill: 'surface', stroke: 'accent2', width: 0.06 }), T(i % 2 === 0 ? cx - 0.5 : cx - 0.5, cy + 0.68, 1.0, 0.11, { opacity: 0.6 })]), C(6, 3.375, 1.15), T(5.3, 3.28, 1.4, 0.19, { fill: 'bg' })],
});

/* ───────────────────────── 정리·마무리 ───────────────────────── */
const END = '정리·마무리';
add({
  id: 'summary', name: '정리', category: END, tags: ['정리', '요약', '배경 반전', '3줄'], invert: true,
  description: '발표 내용을 색 배경 위에 세 줄로 간추린다',
  promptText: '정리: 배경을 메인색으로 반전, 핵심 3줄 요약',
  shapes: [T(M, 0.9, 2.4, 0.3), ...rows(3, 2.0, 5.75, 0.35).flatMap(({ y, i }) => [T(M, y + 0.2, 0.5, 0.36, { opacity: 0.5 }), T(1.9, y + 0.25, 7.6 - i * 1.1, 0.26)])],
});
add({
  id: 'checkpoints', name: '체크포인트', category: END, tags: ['체크포인트', '확인', '복습', '점검'],
  description: '꼭 확인하고 넘어갈 내용을 체크 표시와 함께 정리한다',
  promptText: '체크포인트: 위에 제목, 가로로 긴 카드 3장을 세로로 쌓고 각 카드 왼쪽에 포인트 색 체크 원, 오른쪽에 확인할 내용 한 문장과 작은 보충 설명',
  shapes: [...head(), ...rows(3, 1.6, 6.0, 0.25).flatMap(({ y, h }) => [R(M, y, 10.2, h, { fill: 'bg', stroke: 'border' }), C(1.65, y + h / 2, 0.33), C(1.65, y + h / 2, 0.12, { fill: 'bg' }), T(2.35, y + h / 2 - 0.3, 5.5, 0.19), T(2.35, y + h / 2 + 0.15, 3.6, 0.1, { opacity: 0.45 })])],
});
add({
  id: 'next-steps', name: '다음 단계', category: END, tags: ['다음 단계', '할 일', '액션', '계획'],
  description: '발표가 끝난 뒤 무엇을 할지 순서대로 안내한다',
  promptText: '다음 단계: 위에 제목, 3열 카드를 화살표로 연결, 각 카드에 "1·2·3" 큰 번호, 할 일 한 문장, 맨 아래 담당·기한을 적는 작은 알약 배지',
  shapes: [...head(), ...cols(3, 0.7).flatMap(({ x, w, i }) => [R(x, 1.8, w, 3.9), T(x + 0.3, 2.15, 0.55, 0.5, { fill: 'accent' }), T(x + 0.3, 3.2, w - 0.9, 0.18), T(x + 0.3, 3.6, w - 1.4, 0.18), R(x + 0.3, 4.85, 1.4, 0.4, { fill: 'accent2', radius: 0.2 }), ...(i < 2 ? [A(x + w + 0.12, 3.75, x + w + 0.58, 3.75)] : [])])],
});
add({
  id: 'key3', name: '핵심 3가지', category: END, tags: ['핵심', '3가지', '요점', '테이크어웨이'],
  description: '꼭 가져갈 세 가지를 큼직하게 다시 짚어 준다',
  promptText: '핵심 3가지: 위에 제목, 카드 없이 3열로 나누고 각 열 위에 포인트 색 굵은 가로선, 그 아래 큰 번호·핵심 문장 2줄·설명 2줄',
  shapes: [...head(), ...cols(3, 0.5).flatMap(({ x, w }) => [R(x, 1.8, w, 0.1, { fill: 'accent', radius: 0 }), T(x, 2.3, 0.7, 0.6, { fill: 'accent', opacity: 0.4 }), T(x, 3.4, w * 0.9, 0.22), T(x, 3.85, w * 0.6, 0.22), P(x, 4.6, w * 0.95, 2)])],
});
add({
  id: 'qna', name: 'Q&A', category: END, tags: ['Q&A', '질문', '질의응답'],
  description: '질문을 받는 시간임을 알리는 슬라이드',
  promptText: 'Q&A: 화면 가운데에 아주 큰 "Q&A" 글자, 그 아래 "질문을 기다립니다" 같은 한 줄, 주변에 크기가 다른 말풍선 모양 장식 2개',
  shapes: [C(2.6, 1.9, 0.75, { fill: 'accent2', opacity: 0.6 }), C(9.7, 4.9, 1.05, { fill: 'accent', opacity: 0.35 }), T(3.9, 2.45, 4.2, 1.0, { fill: 'accent' }), T(4.3, 4.1, 3.4, 0.17, { opacity: 0.55 })],
});
add({
  id: 'closing', name: '마무리', category: END, tags: ['마무리', '감사', '끝', '연락처'],
  description: '감사 인사로 발표를 끝내고 연락할 곳을 알려 준다',
  promptText: '마무리: 감사 문구와 Q&A 안내',
  shapes: [T(3.2, 2.2, 5.6, 0.52), T(4.4, 3.1, 3.2, 0.16, { opacity: 0.5 }), L(M, 4.75, R_, 4.75), ...cols(3, 0.4, 2.0, 10.0).flatMap(({ x, w }) => [C(x + 0.3, 5.4, 0.2, { fill: 'accent' }), T(x + 0.7, 5.33, w - 1.1, 0.13, { opacity: 0.6 })])],
});
add({
  id: 'thanks-contact', name: '감사 + 연락처 카드', category: END, tags: ['감사', '연락처', '명함', 'QR'],
  description: '감사 인사 옆에 명함처럼 연락처를 정리해 보여 준다',
  promptText: '감사와 연락처: 왼쪽에 큰 감사 문구 2줄, 오른쪽에 명함 같은 카드(원형 프로필 사진 자리, 이름, 이메일·전화·SNS 3줄)와 카드 아래쪽 QR 코드 자리 네모',
  shapes: [T(M, 2.4, 4.4, 0.52), T(M, 3.25, 2.8, 0.52, { fill: 'accent' }), T(M, 4.3, 3.2, 0.14, { opacity: 0.5 }), R(6.7, 1.1, 4.4, 4.55), C(7.55, 1.95, 0.45, { fill: 'muted' }), T(8.25, 1.75, 1.8, 0.2), T(8.25, 2.15, 1.2, 0.1, { opacity: 0.5 }), ...rows(3, 2.9, 4.1, 0.1).flatMap(({ y }) => [C(7.25, y + 0.15, 0.1), T(7.55, y + 0.09, 2.0, 0.11, { opacity: 0.55 })]), R(9.75, 4.3, 1.0, 1.0, { fill: 'bg', stroke: 'text', radius: 0.06 }), R(9.95, 4.5, 0.6, 0.6, { fill: 'text', radius: 0, opacity: 0.6 })],
});

/* ───────────────────────── 변형 규칙 ─────────────────────────
 * 변형 축: 열 수(2~6), 정렬(좌·중·우), 이미지 위치(좌·우·상·배경), 배경 반전 여부.
 * 조합을 모두 만들어 본 뒤 규칙으로 걸러 내고, 결과를 검토 목록에 남긴다.
 */
type Review = { id: string; name: string; kept: boolean; reason: string };
const review: Review[] = [];
const variant = (d: Def, skip?: string) => {
  if (skip) {
    review.push({ id: d.id, name: d.name, kept: false, reason: skip });
    return;
  }
  review.push({ id: d.id, name: d.name, kept: true, reason: '' });
  add(d);
};

// 1) 아이콘 카드: 열 수 2~6 × 배경 반전
for (const n of [2, 3, 4, 5, 6]) {
  for (const invert of [false, true]) {
    const name = `${n}열 아이콘 카드${invert ? ' · 배경 반전' : ''}`;
    variant(
      {
        id: `cards-${n}col${invert ? '-invert' : ''}`, name, category: CARDS, invert: invert || undefined,
        tags: [`${n}열`, `${n}요소`, '카드', '아이콘', ...(invert ? ['배경 반전'] : [])],
        description: `${n}가지 내용을 아이콘 카드 ${n}장에 한 줄로 나란히 담는다${invert ? ' (색 배경)' : ''}`,
        promptText: `${n}열 아이콘 카드${invert ? '(배경 반전)' : ''}: ${invert ? '배경을 메인색으로 반전하고 ' : ''}위에 제목, 세로로 긴 카드 ${n}장을 한 줄에 나란히, 각 카드 위쪽에 원형 아이콘, 그 아래 제목과 ${n >= 5 ? '한 줄' : '2~3줄'} 설명`,
        shapes: [...head(), ...cols(n, n >= 5 ? 0.2 : 0.3).flatMap(({ x, w }) => card(x, 1.7, w, 4.2, true))],
      },
      invert && n !== 3 && n !== 4 ? '배경 반전은 3·4열만 남김(2열은 색면이 너무 넓고, 5·6열은 카드가 잘게 쪼개져 산만함)' : undefined,
    );
  }
}

// 2) 사진 카드: 열 수 2~6
for (const n of [2, 3, 4, 5, 6]) {
  variant(
    {
      id: `imgcards-${n}col`, name: `${n}열 사진 카드`, category: CARDS,
      tags: [`${n}열`, '사진 카드', '카드', '썸네일'],
      description: `위에 사진이 들어간 카드 ${n}장을 나란히 놓는다`,
      promptText: `${n}열 사진 카드: 위에 제목, 카드 ${n}장을 한 줄에 나란히, 각 카드는 위쪽 절반이 사진, 아래쪽에 제목과 설명 2줄`,
      shapes: [...head(), ...cols(n).flatMap(({ x, w }) => [R(x, 1.7, w, 4.2), IMG(x, 1.7, w, 2.1), T(x + 0.28, 4.1, w * 0.55, 0.17), P(x + 0.28, 4.55, w - 0.56, 2)])],
    },
    n >= 5 ? '5열 이상은 사진이 너무 작아 알아보기 어려움' : undefined,
  );
}

// 3) 사진 + 핵심 문장: 이미지 위치(좌·우·상·배경) × 정렬(좌·중·우)
const posName = { left: '왼쪽', right: '오른쪽', top: '위', bg: '배경' } as const;
const alignName = { left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬' } as const;
for (const pos of ['left', 'right', 'top', 'bg'] as const) {
  for (const align of ['left', 'center', 'right'] as const) {
    const required = pos === 'left' && align === 'left';
    let skip: string | undefined;
    if (align === 'right' && pos !== 'left') skip = '오른쪽 정렬 문장은 사진이 왼쪽에 있을 때만 자연스러움';
    else if (align === 'right') skip = '사진과 멀어지는 쪽으로 정렬되어 시선이 끊김';
    else if (align === 'center' && (pos === 'left' || pos === 'right')) skip = '좁은 반쪽 칸에서 가운데 정렬은 줄 길이가 들쭉날쭉해 어색함';

    const shapes: Shape[] = [];
    const sentence = (x: number, y: number, w: number, o: Extra = {}) => {
      const x2 = (ww: number) => (align === 'center' ? x + (w - ww) / 2 : x);
      shapes.push(T(x2(w), y, w, 0.42, o), T(x2(w * 0.65), y + 0.75, w * 0.65, 0.42, o), L(x2(1.0), y + 1.7, x2(1.0) + 1.0, y + 1.7, { stroke: o.fill === 'bg' ? 'bg' : 'accent', width: 0.08 }));
    };
    let structure = '';
    if (pos === 'left') { shapes.push(IMG(0, 0, 6, H, 0)); sentence(6.9, 2.35, 4.2); structure = '왼쪽 절반에 화면 끝까지 채운 큰 사진, 오른쪽 절반에 핵심 문장'; }
    if (pos === 'right') { shapes.push(IMG(6, 0, 6, H, 0)); sentence(M, 2.35, 4.2); structure = '오른쪽 절반에 화면 끝까지 채운 큰 사진, 왼쪽 절반에 핵심 문장'; }
    if (pos === 'top') { shapes.push(IMG(0, 0, W, 3.6, 0)); sentence(align === 'center' ? 2.5 : M, 4.2, 7); structure = '위쪽 절반에 가로로 꽉 찬 사진, 아래쪽에 핵심 문장'; }
    if (pos === 'bg') { shapes.push(IMG(0, 0, W, H, 0), R(0, 0, W, H, { fill: 'text', opacity: 0.5, radius: 0 })); sentence(align === 'center' ? 2.5 : M, 2.5, 7, { fill: 'bg' }); structure = '화면 전체를 채운 배경 사진 위에 어두운 반투명 막을 덮고, 그 위에 밝은 색 핵심 문장'; }

    variant(
      required
        ? {
            id: 'photo-focus', name: '사진 + 핵심 문장', category: IMAGE, tags: ['사진', '핵심 문장', '좌우 분할', '강조'],
            description: '큰 사진 한 장 옆에 하고 싶은 말 한 문장만 크게 둔다',
            promptText: '사진 강조: 큰 사진 한 장과 핵심 문장 하나만 크게',
            shapes,
          }
        : {
            id: `photo-${pos}-${align}`, name: `사진 ${posName[pos]} + 문장 ${alignName[align]}`, category: IMAGE,
            tags: ['사진', '핵심 문장', `사진 ${posName[pos]}`, alignName[align], ...(pos === 'bg' ? ['배경 이미지', '오버레이'] : [])],
            description: pos === 'bg' ? `사진을 배경으로 깔고 그 위에 문장을 ${alignName[align]}로 얹는다` : `사진을 ${posName[pos]}에 두고 핵심 문장을 ${alignName[align]}로 둔다`,
            promptText: `사진(${posName[pos]}) + 핵심 문장(${alignName[align]}): ${structure} 2줄을 ${alignName[align]}로 크게, 문장 아래 짧은 포인트 선`,
            shapes,
          },
      skip,
    );
  }
}

/* ───────────────────────── 검증 + 쓰기 ───────────────────────── */
const round = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const norm = <T,>(v: T): T => JSON.parse(JSON.stringify(v, round));

// 같은 모양(도형 목록이 완전히 같은) 조합은 뒤에 나온 것을 걸러 낸다.
const seen = new Map<string, string>();
const generated: SlideType[] = [];
for (const d of defs) {
  const item: SlideType = norm({ ...d, source: 'generated' as const });
  const sig = JSON.stringify([item.invert ?? false, item.shapes]);
  const dup = seen.get(sig);
  if (dup) {
    const r = review.find((x) => x.id === d.id);
    if (r) { r.kept = false; r.reason = `"${dup}"와 모양이 같아 제외`; }
    continue;
  }
  seen.set(sig, item.id);
  generated.push(item);
}

const dataPath = fileURLToPath(new URL('../src/data/slideTypes.json', import.meta.url));
const manual: SlideType[] = existsSync(dataPath) ? (JSON.parse(readFileSync(dataPath, 'utf8')) as SlideType[]).filter((s) => s.source !== 'generated') : [];
const genIds = new Set(generated.map((g) => g.id));
const clash = manual.filter((m) => genIds.has(m.id));
if (clash.length) throw new Error(`직접 추가한 항목의 id가 생성 항목과 겹칩니다: ${clash.map((c) => c.id).join(', ')}`);

// 카테고리 순서대로 모아 둔다(같은 카테고리 안에서는 정의한 순서 유지, 직접 추가한 항목은 그 뒤).
const categoryOrder = (JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/slideCategories.json', import.meta.url)), 'utf8')) as { name: string }[]).map((c) => c.name);
const rank = (s: SlideType) => { const i = categoryOrder.indexOf(s.category); return i < 0 ? categoryOrder.length : i; };
const all = [...generated, ...manual].map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i).map((x) => x.s);
// 한 항목을 여러 줄로 쓰되 도형은 한 줄에 하나씩 써서 사람이 읽고 고치기 쉽게 한다.
const body = all
  .map((s) => {
    const { shapes, ...rest } = s;
    const headLines = JSON.stringify(rest, null, 2).slice(0, -2);
    return `${headLines},\n  "shapes": [\n${shapes.map((sh) => `    ${JSON.stringify(sh)}`).join(',\n')}\n  ]\n}`;
  })
  .map((t) => t.split('\n').map((l) => `  ${l}`).join('\n'))
  .join(',\n');
writeFileSync(dataPath, `[\n${body}\n]\n`);

const kept = review.filter((r) => r.kept);
const dropped = review.filter((r) => !r.kept);
const md = [
  '# 슬라이드 레이아웃 변형 검토 목록',
  '',
  '`npm run gen:slides` 가 만든 파일입니다. 변형 규칙(열 수 · 정렬 · 이미지 위치 · 배경 반전)으로 조합한 결과를 사람이 확인하기 위한 목록입니다.',
  '',
  `- 조합 ${review.length}개 중 ${kept.length}개 채택, ${dropped.length}개 제외`,
  `- 전체 레이아웃 ${all.length}종 (직접 설계 ${generated.length - kept.length}종 + 변형 ${kept.length}종 + 직접 추가 ${manual.length}종)`,
  '',
  '## 채택한 변형',
  '',
  '| id | 이름 |',
  '| --- | --- |',
  ...kept.map((r) => `| ${r.id} | ${r.name} |`),
  '',
  '## 제외한 변형',
  '',
  '| id | 이름 | 제외 이유 |',
  '| --- | --- | --- |',
  ...dropped.map((r) => `| ${r.id} | ${r.name} | ${r.reason} |`),
  '',
].join('\n');
writeFileSync(fileURLToPath(new URL('./slideVariants.review.md', import.meta.url)), md);

console.log(`slideTypes.json: ${all.length}종 (변형 ${kept.length}종 채택, ${dropped.length}종 제외)`);
