import { isDone, useStore, VIEWS } from '../state/store';

/** 진행 단계 표시. 어느 단계든 눌러서 바로 이동할 수 있다. */
export default function StepNav() {
  const { state, view, go } = useStore();
  return (
    <nav className="stepnav" aria-label="진행 단계">
      <ol>
        {VIEWS.map((v, i) => {
          const done = isDone(state, v.key);
          const firstOfPart = i === 0 || VIEWS[i - 1].part !== v.part;
          return (
            <li key={v.key} className={firstOfPart ? 'part-start' : undefined}>
              {firstOfPart && <span className="part-label">{v.part === 'A' ? '파트 A · 전체 스타일' : v.part === 'B' ? '파트 B · 슬라이드' : '완성'}</span>}
              <button type="button" className={`step${view === v.key ? ' is-current' : ''}${done ? ' is-done' : ''}`} aria-current={view === v.key ? 'step' : undefined} onClick={() => go(v.key)}>
                <span className="step-num" aria-hidden="true">
                  {done ? '✓' : v.key === 'result' ? '★' : i + 1}
                </span>
                <span className="step-label">{v.label}</span>
                <span className="step-short">{v.short}</span>
                {done && <span className="sr-only"> (완료)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
