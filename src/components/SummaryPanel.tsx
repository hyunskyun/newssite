import { detailGroups } from '../data';
import { buildPrompt, resolveSelections } from '../lib/buildPrompt';
import { isDone, useStore, VIEWS, type View } from '../state/store';
import { ROLE_LABEL } from './ColorSetCard';
import SidePanel from './SidePanel';
import type { ColorRole } from '../types';

/** "지금까지 고른 것" 요약. 줄을 누르면 그 단계로 이동한다. */
export default function SummaryPanel() {
  const { state, go } = useStore();
  const r = resolveSelections(state);
  const doneCount = VIEWS.filter((v) => v.part === 'A' && isDone(state, v.key)).length;

  const row = (view: View, label: string, value: string, filled: boolean, extra?: React.ReactNode) => (
    <li key={label}>
      <button type="button" className="summary-row" onClick={() => go(view)}>
        <span className="summary-label">{label}</span>
        <span className={`summary-value${filled ? ' is-default' : ''}`}>
          {value}
          {filled && <small> (기본값)</small>}
          {extra}
        </span>
      </button>
    </li>
  );

  const styleText = [r.styleMain.name, ...r.styleSubs.map((s) => `+ ${s.name}`)].join(' ');
  return (
    <SidePanel title="지금까지 고른 것" count={`${doneCount}/5`}>
      <ul className="summary">
        {row('style', '용도', r.purpose, r.filled.purpose)}
        {row('style', '스타일', styleText, r.filled.style)}
        {row('layout', '레이아웃', r.layout.name, r.filled.layout)}
        {row(
          'color',
          '컬러',
          r.color.name,
          r.filled.color,
          <span className="summary-chips" aria-hidden="true">
            {(Object.keys(ROLE_LABEL) as ColorRole[]).map((k) => (
              <i key={k} style={{ background: r.color.roles[k] }} />
            ))}
          </span>,
        )}
        {row('typography', '타이포', r.typography.name, r.filled.typography)}
        {detailGroups.map((g) => row('details', g.name, r.details[g.key].name, r.filled.details[g.key]))}
        {row('slides', '슬라이드', state.slides.length ? `${state.slides.length}장` : '아직 없음', false)}
      </ul>
      <p className="summary-short">
        <span className="summary-label">한 줄 요약</span>
        {buildPrompt(state, 'short')}
      </p>
      <button type="button" className="btn btn-primary btn-block" onClick={() => go('result')}>
        결과 프롬프트 보기
      </button>
    </SidePanel>
  );
}
