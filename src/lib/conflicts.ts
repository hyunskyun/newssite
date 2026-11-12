/**
 * 충돌 경고 규칙. 옵션의 conflictsWith 를 읽어 어울리지 않는 조합을 찾는다.
 * 경고만 하고 선택을 막지 않는다. 프롬프트에도 넣지 않는다.
 */
import { DETAIL_KEYS, detailById, styleById } from '../data';
import type { AppState, Option } from '../types';
import { resolveSelections } from './buildPrompt';

export type Conflict = { a: Option; b: Option; message: string };

/** 스타일은 이름으로, 디테일은 '은은한 그림자'처럼 프롬프트 문구로 부른다. */
const label = (o: Option): string => (styleById.has(o.id) ? `‘${o.name}’ 스타일` : `‘${o.promptText}’`);
const lookup = (id: string): Option | undefined => styleById.get(id) ?? detailById.get(id);

/** 사용자가 직접 고른 옵션 id (기본값으로 채워진 것은 제외) */
export function selectedIds(state: AppState): string[] {
  return [state.style.main, ...state.style.subs, ...DETAIL_KEYS.map((k) => state.details[k])].filter((x): x is string => !!x);
}

/** 프롬프트에 실제로 들어가는 옵션 id (기본값 포함) */
export function effectiveIds(state: AppState): string[] {
  const r = resolveSelections(state);
  return [r.styleMain.id, ...r.styleSubs.map((s) => s.id), ...DETAIL_KEYS.map((k) => r.details[k].id)];
}

export function findConflicts(ids: string[]): Conflict[] {
  const chosen = new Set(ids);
  const seen = new Set<string>();
  const out: Conflict[] = [];
  for (const id of ids) {
    const a = lookup(id);
    for (const otherId of a?.conflictsWith ?? []) {
      const b = lookup(otherId);
      if (!a || !b || !chosen.has(otherId)) continue;
      const key = [id, otherId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a, b, message: `${label(a)} + ${label(b)} 조합은 잘 어울리지 않아요. 그대로 써도 되지만 결과가 어색할 수 있어요.` });
    }
  }
  return out;
}
