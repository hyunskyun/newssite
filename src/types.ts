/** 색 역할 이름. 와이어프레임·미리보기는 색을 직접 쓰지 않고 역할로 지정한다. */
export type ColorRole = 'bg' | 'surface' | 'text' | 'accent' | 'accent2' | 'border';
/** 도형에서 쓸 수 있는 칠 이름(역할 + 사진 자리용 회색 + 투명). */
export type Paint = ColorRole | 'muted' | 'none';

export type Option = {
  id: string;
  name: string;
  description: string;
  /** 프롬프트(상세형)에 들어가는 문구 */
  promptText: string;
  /** 한 줄 요약형에 들어가는 짧은 문구. 없으면 name을 쓴다. */
  shortText?: string;
  /** previews/ 컴포넌트가 해석하는 미리보기 식별자 */
  preview: string;
  conflictsWith?: string[];
  isDefault?: boolean;
};

/** 레이아웃 옵션은 미리보기를 도형 목록으로 직접 가진다. */
export type LayoutOption = Option & { shapes: Shape[] };

/** 타이포 옵션은 미리보기에 쓸 글꼴 정보를 함께 가진다. */
export type TypographyOption = Option & {
  sample: {
    headingFont: FontKey;
    bodyFont: FontKey;
    headingWeight: number;
    bodyWeight: number;
    pointFont?: FontKey;
  };
};
export type FontKey = 'sans' | 'serif' | 'mono' | 'round';

export type DetailKey = 'shadow' | 'radius' | 'decoration' | 'border' | 'spacing';
export type DetailGroup = { key: DetailKey; name: string; description: string; options: Option[] };

export type ColorSet = {
  id: string;
  mood: string;
  name: string;
  promptText: string;
  isDefault?: boolean;
  roles: Record<ColorRole, string>;
};

export type Align = 'left' | 'center' | 'right';
/** 16:9 캔버스를 12 × 6.75 격자로 나눈 좌표를 쓴다. */
export type Shape =
  | { type: 'rect'; x: number; y: number; w: number; h: number; fill?: Paint; stroke?: Paint; radius?: number; opacity?: number }
  | { type: 'circle'; cx: number; cy: number; r: number; fill?: Paint; stroke?: Paint; width?: number; arc?: number; start?: number; opacity?: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; stroke?: Paint; width?: number; dash?: boolean; opacity?: number }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number; stroke?: Paint; width?: number; opacity?: number }
  | { type: 'textLines'; x: number; y: number; w: number; lines: number; size?: number; gap?: number; fill?: Paint; align?: Align; opacity?: number }
  | { type: 'imagePlaceholder'; x: number; y: number; w: number; h: number; radius?: number };

export type SlideType = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  /** 배경과 포인트 색을 맞바꿔 칠한다(섹션 구분·정리 등). */
  invert?: boolean;
  /** 생성 스크립트가 만든 항목 표시. 직접 추가한 항목에는 넣지 않는다. */
  source?: 'generated';
  promptText: string;
  shapes: Shape[];
};

export type StepKey = 'style' | 'layout' | 'color' | 'typography' | 'details';

export type SlideItem = { uid: string; typeId: string; memo: string };

export type AppState = {
  purpose: string;
  style: { main?: string; subs: string[] };
  layout?: string;
  color?: string;
  typography?: string;
  details: Partial<Record<DetailKey, string>>;
  slides: SlideItem[];
  /** "잘 모르겠어요"를 누른 단계 */
  unsure: StepKey[];
};

export type PromptMode = 'short' | 'detail';
