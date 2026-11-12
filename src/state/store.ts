/** 앱 상태: 선택값(AppState)은 useReducer 로, 부가 데이터(즐겨찾기·프리셋 등)는 별도 상태로 관리하고 모두 localStorage 에 저장한다. */
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { AppState, DetailKey, SlideItem, StepKey } from '../types';
import { emptyState, load, newUid, sanitizeState, save, type Preset, type SlideSet } from '../lib/storage';

export type View = StepKey | 'slides' | 'result';
export const VIEWS: { key: View; label: string; short: string; part: 'A' | 'B' | '결과' }[] = [
  { key: 'style', label: '스타일', short: '스타일', part: 'A' },
  { key: 'layout', label: '레이아웃·그리드', short: '레이아웃', part: 'A' },
  { key: 'color', label: '컬러', short: '컬러', part: 'A' },
  { key: 'typography', label: '타이포그래피', short: '타이포', part: 'A' },
  { key: 'details', label: '디테일', short: '디테일', part: 'A' },
  { key: 'slides', label: '슬라이드 구성', short: '슬라이드', part: 'B' },
  { key: 'result', label: '결과 프롬프트', short: '결과', part: '결과' },
];
export const MAX_SUBS = 2;

export type Action =
  | { type: 'setPurpose'; value: string }
  | { type: 'pickStyle'; id: string }
  | { type: 'makeMain'; id: string }
  | { type: 'pick'; step: 'layout' | 'color' | 'typography'; id: string }
  | { type: 'pickDetail'; key: DetailKey; id: string }
  | { type: 'toggleUnsure'; step: StepKey }
  | { type: 'addSlide'; typeId: string }
  | { type: 'removeSlide'; uid: string }
  | { type: 'moveSlide'; from: number; to: number }
  | { type: 'setMemo'; uid: string; memo: string }
  | { type: 'setSlides'; slides: SlideItem[] }
  | { type: 'replace'; state: AppState }
  | { type: 'reset' };

const sure = (s: AppState, step: StepKey): StepKey[] => s.unsure.filter((k) => k !== step);

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'setPurpose':
      return { ...s, purpose: a.value };
    case 'pickStyle': {
      const { main, subs } = s.style;
      let style: AppState['style'];
      if (main === a.id) style = subs.length ? { main: subs[0], subs: subs.slice(1) } : { subs: [] };
      else if (subs.includes(a.id)) style = { main, subs: subs.filter((x) => x !== a.id) };
      else if (!main) style = { main: a.id, subs };
      else if (subs.length < MAX_SUBS) style = { main, subs: [...subs, a.id] };
      else return s; // 보조는 최대 2개
      return { ...s, style, unsure: sure(s, 'style') };
    }
    case 'makeMain': {
      const { main, subs } = s.style;
      if (!subs.includes(a.id)) return s;
      const rest = subs.filter((x) => x !== a.id);
      return { ...s, style: { main: a.id, subs: (main ? [main, ...rest] : rest).slice(0, MAX_SUBS) } };
    }
    case 'pick': {
      const next = { ...s, unsure: sure(s, a.step) };
      if (s[a.step] === a.id) delete next[a.step];
      else next[a.step] = a.id;
      return next;
    }
    case 'pickDetail': {
      const details = { ...s.details };
      if (details[a.key] === a.id) delete details[a.key];
      else details[a.key] = a.id;
      return { ...s, details, unsure: sure(s, 'details') };
    }
    case 'toggleUnsure': {
      if (s.unsure.includes(a.step)) return { ...s, unsure: sure(s, a.step) };
      // "잘 모르겠어요": 이 단계에서 고른 것을 비우고 기본값에 맡긴다.
      const next: AppState = { ...s, unsure: [...s.unsure, a.step] };
      if (a.step === 'style') next.style = { subs: [] };
      else if (a.step === 'details') next.details = {};
      else delete next[a.step];
      return next;
    }
    case 'addSlide':
      return { ...s, slides: [...s.slides, { uid: newUid(), typeId: a.typeId, memo: '' }] };
    case 'removeSlide':
      return { ...s, slides: s.slides.filter((x) => x.uid !== a.uid) };
    case 'moveSlide': {
      if (a.from === a.to || a.from < 0 || a.to < 0 || a.from >= s.slides.length || a.to >= s.slides.length) return s;
      const slides = [...s.slides];
      const [item] = slides.splice(a.from, 1);
      slides.splice(a.to, 0, item);
      return { ...s, slides };
    }
    case 'setMemo':
      return { ...s, slides: s.slides.map((x) => (x.uid === a.uid ? { ...x, memo: a.memo } : x)) };
    case 'setSlides':
      return { ...s, slides: a.slides };
    case 'replace':
      return a.state;
    case 'reset':
      return emptyState();
  }
}

/** 선택값 외에 기기에 저장해 두는 것들 */
export type Library = { favorites: string[]; recents: string[]; presets: Preset[]; slideSets: SlideSet[] };
const emptyLibrary = (): Library => ({ favorites: [], recents: [], presets: [], slideSets: [] });
const RECENT_MAX = 12;

type Store = {
  state: AppState;
  dispatch: Dispatch<Action>;
  view: View;
  go: (v: View) => void;
  lib: Library;
  setLib: (fn: (lib: Library) => Library) => void;
  /** 슬라이드를 추가하고 "최근 사용"에 기록한다. */
  addSlide: (typeId: string) => void;
  toast: string;
  notify: (message: string) => void;
};
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => sanitizeState(load('state', null)));
  const [view, setView] = useState<View>(() => {
    const v = load<string>('view', 'style');
    return VIEWS.some((x) => x.key === v) ? (v as View) : 'style';
  });
  const [lib, setLibState] = useState<Library>(() => ({ ...emptyLibrary(), ...load<Partial<Library>>('library', {}) }));
  const [toast, setToast] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => save('state', state), [state]);
  useEffect(() => save('view', view), [view]);
  useEffect(() => save('library', lib), [lib]);

  const go = useCallback((v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);
  const setLib = useCallback((fn: (lib: Library) => Library) => setLibState(fn), []);
  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), 2200);
  }, []);
  const addSlide = useCallback((typeId: string) => {
    dispatch({ type: 'addSlide', typeId });
    setLibState((l) => ({ ...l, recents: [typeId, ...l.recents.filter((x) => x !== typeId)].slice(0, RECENT_MAX) }));
  }, []);

  const value = useMemo(() => ({ state, dispatch, view, go, lib, setLib, addSlide, toast, notify }), [state, view, go, lib, setLib, addSlide, toast, notify]);
  return createElement(Ctx.Provider, { value }, children);
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 안에서만 쓸 수 있습니다');
  return s;
}

/** 단계를 마쳤는지(직접 골랐거나 "잘 모르겠어요"를 눌렀는지) */
export function isDone(state: AppState, view: View): boolean {
  if (view === 'slides') return state.slides.length > 0;
  if (view === 'result') return false;
  if (state.unsure.includes(view)) return true;
  if (view === 'style') return !!state.style.main;
  if (view === 'details') return Object.keys(state.details).length > 0;
  return !!state[view];
}
