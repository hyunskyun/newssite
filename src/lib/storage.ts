/** localStorage 저장과 JSON 내보내기/불러오기. 서버로 보내는 것은 없다. */
import { DETAIL_KEYS } from '../data';
import type { AppState, SlideItem, StepKey } from '../types';

export const emptyState = (): AppState => ({ purpose: '', style: { subs: [] }, details: {}, slides: [], unsure: [] });

export const newUid = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const STEP_KEYS: StepKey[] = ['style', 'layout', 'color', 'typography', 'details'];
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export function sanitizeSlides(input: unknown): SlideItem[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw) => {
    const s = obj(raw);
    const typeId = str(s.typeId);
    return typeId ? [{ uid: str(s.uid) ?? newUid(), typeId, memo: typeof s.memo === 'string' ? s.memo : '' }] : [];
  });
}

/** 저장된 값·불러온 파일이 어떤 모양이든 안전한 AppState 로 바꾼다. */
export function sanitizeState(input: unknown): AppState {
  const o = obj(input);
  const style = obj(o.style);
  const main = str(style.main);
  const subs = Array.isArray(style.subs) ? [...new Set(style.subs.filter((x): x is string => typeof x === 'string' && x !== main))].slice(0, 2) : [];
  const d = obj(o.details);
  const details: AppState['details'] = {};
  for (const k of DETAIL_KEYS) if (str(d[k])) details[k] = str(d[k]);
  return {
    purpose: typeof o.purpose === 'string' ? o.purpose : '',
    style: { ...(main ? { main } : {}), subs },
    ...(str(o.layout) ? { layout: str(o.layout) } : {}),
    ...(str(o.color) ? { color: str(o.color) } : {}),
    ...(str(o.typography) ? { typography: str(o.typography) } : {}),
    details,
    slides: sanitizeSlides(o.slides),
    unsure: Array.isArray(o.unsure) ? STEP_KEYS.filter((k) => (o.unsure as unknown[]).includes(k)) : [],
  };
}

const PREFIX = 'dpb:';
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 저장 공간이 없거나 막혀 있어도 앱은 계속 동작한다 */
  }
}

export type Preset = { id: string; name: string; state: AppState };
export type SlideSet = { id: string; name: string; slides: { typeId: string; memo: string }[] };
export type ExportFile = { app: 'design-prompt-builder'; version: 1; state: AppState; presets?: Preset[]; slideSets?: SlideSet[] };

export function toExportFile(state: AppState, presets: Preset[], slideSets: SlideSet[]): ExportFile {
  return { app: 'design-prompt-builder', version: 1, state, presets, slideSets };
}

export function parseExportFile(text: string): { state: AppState; presets: Preset[]; slideSets: SlideSet[] } {
  const data = obj(JSON.parse(text));
  if (data.app !== 'design-prompt-builder') throw new Error('이 앱에서 내보낸 파일이 아니에요.');
  const presets = (Array.isArray(data.presets) ? data.presets : []).flatMap((p) => {
    const x = obj(p);
    return str(x.name) ? [{ id: str(x.id) ?? newUid(), name: str(x.name)!, state: sanitizeState(x.state) }] : [];
  });
  const slideSets = (Array.isArray(data.slideSets) ? data.slideSets : []).flatMap((p) => {
    const x = obj(p);
    return str(x.name) ? [{ id: str(x.id) ?? newUid(), name: str(x.name)!, slides: sanitizeSlides(x.slides).map(({ typeId, memo }) => ({ typeId, memo })) }] : [];
  });
  return { state: sanitizeState(data.state), presets, slideSets };
}

export function downloadJson(filename: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
