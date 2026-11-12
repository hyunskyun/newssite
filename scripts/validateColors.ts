/**
 * 컬러 프리셋 대비 검증. 빌드 전에 실행되며, 하나라도 실패하면 빌드를 중단한다.
 *   npm run validate
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkColorSet } from '../src/lib/contrast';
import type { ColorSet } from '../src/types';

const path = fileURLToPath(new URL('../src/data/colors.json', import.meta.url));
const sets = JSON.parse(readFileSync(path, 'utf8')) as ColorSet[];
const ROLES = ['bg', 'surface', 'text', 'accent', 'accent2', 'border'] as const;

const problems: string[] = [];
const ids = new Set<string>();
for (const set of sets) {
  if (ids.has(set.id)) problems.push(`${set.id}: id가 중복됩니다`);
  ids.add(set.id);
  const missing = ROLES.filter((r) => !/^#[0-9a-f]{6}$/i.test(set.roles?.[r] ?? ''));
  if (missing.length) {
    problems.push(`${set.id}: 색이 비었거나 형식이 틀렸습니다 (${missing.join(', ')})`);
    continue;
  }
  for (const c of checkColorSet(set.roles)) {
    if (!c.pass) problems.push(`${set.id}: ${c.pair} = ${c.ratio.toFixed(2)}:1 (최소 ${c.min}:1)`);
  }
}

const moods = new Map<string, number>();
for (const s of sets) moods.set(s.mood, (moods.get(s.mood) ?? 0) + 1);
if (sets.length !== 32) problems.push(`세트 수가 32개가 아닙니다 (${sets.length}개)`);
for (const [mood, n] of moods) if (n !== 4) problems.push(`분위기 "${mood}"의 세트가 4개가 아닙니다 (${n}개)`);
if (sets.filter((s) => s.isDefault).length !== 1) problems.push('기본값(isDefault) 세트는 정확히 1개여야 합니다');

if (problems.length) {
  console.error(`컬러 검증 실패 ${problems.length}건:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`컬러 검증 통과: ${sets.length}세트 (분위기 ${moods.size}탭), 본문 4.5:1 · 포인트 3:1 이상`);
