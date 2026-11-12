/** 디테일 미리보기: 작은 상자 하나를 옵션별 CSS(.d-그림자·모서리…)로 다르게 그린다. */
export default function DetailPreview({ kind }: { kind: string }) {
  const group = kind.split('-')[0];
  return (
    <div className={`pv pv-detail d-${group} ${kind}`} aria-hidden="true">
      {group === 'spacing' ? (
        <div className="pv-box pv-space">
          <i />
          <i />
          <i />
        </div>
      ) : (
        <div className="pv-box">
          {group === 'decoration' && (
            <>
              <i className="deco deco1" />
              <i className="deco deco2" />
              <i className="deco deco3" />
              <i className="deco deco4" />
            </>
          )}
          <b className="pv-line pv-l1" />
          <b className="pv-line pv-l2" />
        </div>
      )}
    </div>
  );
}
