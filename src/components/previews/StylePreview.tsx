/** 스타일 미리보기: 같은 작은 화면(카드 + 글줄 + 버튼)을 스타일별 CSS로 다르게 그린다. */
export default function StylePreview({ kind }: { kind: string }) {
  return (
    <div className={`pv pv-style ${kind}`} aria-hidden="true">
      <div className="pv-card">
        <i className="pv-dot" />
        <b className="pv-line pv-l1" />
        <b className="pv-line pv-l2" />
        <span className="pv-btn" />
      </div>
    </div>
  );
}
