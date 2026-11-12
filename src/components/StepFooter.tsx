import { useStore, VIEWS } from '../state/store';

/** 이전/다음 단계 이동 버튼 */
export default function StepFooter() {
  const { view, go } = useStore();
  const i = VIEWS.findIndex((v) => v.key === view);
  const prev = VIEWS[i - 1];
  const next = VIEWS[i + 1];
  return (
    <div className="step-footer">
      {prev ? (
        <button type="button" className="btn" onClick={() => go(prev.key)}>
          ← {prev.label}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" className="btn btn-primary" onClick={() => go(next.key)}>
          다음: {next.label} →
        </button>
      )}
    </div>
  );
}
