import { useState } from 'react';
import { slideTypeById } from '../data';
import { newUid } from '../lib/storage';
import { useStore } from '../state/store';
import SidePanel from './SidePanel';
import SlideWireframe from './SlideWireframe';

/** "내 구성": 추가한 슬라이드의 순서 변경·삭제·메모, 그리고 발표 구성 세트 저장·불러오기 */
export default function SlideList() {
  const { state, dispatch, lib, setLib, notify, go } = useStore();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [setName, setSetName] = useState('');
  const slides = state.slides;

  const saveSet = () => {
    const name = setName.trim();
    if (!name || slides.length === 0) return;
    setLib((l) => ({ ...l, slideSets: [{ id: newUid(), name, slides: slides.map(({ typeId, memo }) => ({ typeId, memo })) }, ...l.slideSets.filter((s) => s.name !== name)] }));
    setSetName('');
    notify(`구성 세트 ‘${name}’을(를) 저장했어요`);
  };
  const loadSet = (id: string) => {
    const set = lib.slideSets.find((s) => s.id === id);
    if (!set) return;
    if (slides.length > 0 && !window.confirm(`지금 구성(${slides.length}장)을 ‘${set.name}’(${set.slides.length}장)으로 바꿀까요?`)) return;
    dispatch({ type: 'setSlides', slides: set.slides.map((s) => ({ ...s, uid: newUid() })) });
    notify(`‘${set.name}’을(를) 불러왔어요`);
  };

  return (
    <SidePanel title="내 구성" count={`${slides.length}장`}>
      {slides.length === 0 ? (
        <p className="empty">
          아직 비어 있어요.
          <br />
          슬라이드 유형 카드를 누르면 여기에 순서대로 쌓여요. 같은 유형을 여러 번 넣어도 됩니다.
        </p>
      ) : (
        <ol className="slide-list">
          {slides.map((s, i) => {
            const type = slideTypeById.get(s.typeId);
            return (
              <li
                key={s.uid}
                className={`slide-item${dragOver === i && dragFrom !== null && dragFrom !== i ? ' is-over' : ''}${dragFrom === i ? ' is-dragging' : ''}`}
                onDragOver={(e) => { if (dragFrom !== null) { e.preventDefault(); setDragOver(i); } }}
                onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) dispatch({ type: 'moveSlide', from: dragFrom, to: i }); setDragFrom(null); setDragOver(null); }}
              >
                <div className="slide-item-top">
                  <span
                    className="drag-handle"
                    draggable
                    title="끌어서 순서 바꾸기"
                    aria-hidden="true"
                    onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.uid); const li = e.currentTarget.closest('li'); if (li) e.dataTransfer.setDragImage(li, 12, 12); }}
                    onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                  >
                    ⠿
                  </span>
                  <span className="slide-num">{i + 1}</span>
                  <span className="slide-thumb">{type ? <SlideWireframe shapes={type.shapes} invert={type.invert} label="" /> : null}</span>
                  <span className="slide-name">{type?.name ?? `(없어진 유형: ${s.typeId})`}</span>
                  <span className="slide-actions">
                    <button type="button" className="icon-btn" aria-label={`${i + 1}번 ${type?.name ?? ''} 위로`} disabled={i === 0} onClick={() => dispatch({ type: 'moveSlide', from: i, to: i - 1 })}>
                      ▲
                    </button>
                    <button type="button" className="icon-btn" aria-label={`${i + 1}번 ${type?.name ?? ''} 아래로`} disabled={i === slides.length - 1} onClick={() => dispatch({ type: 'moveSlide', from: i, to: i + 1 })}>
                      ▼
                    </button>
                    <button type="button" className="icon-btn" aria-label={`${i + 1}번 ${type?.name ?? ''} 삭제`} onClick={() => dispatch({ type: 'removeSlide', uid: s.uid })}>
                      ✕
                    </button>
                  </span>
                </div>
                <input className="input memo" type="text" value={s.memo} maxLength={120} placeholder="한 줄 메모(주제) — 예: 실험 안전수칙" aria-label={`${i + 1}번 슬라이드 메모`} onChange={(e) => dispatch({ type: 'setMemo', uid: s.uid, memo: e.target.value })} />
              </li>
            );
          })}
        </ol>
      )}

      {slides.length > 0 && (
        <div className="side-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={() => go('result')}>
            결과 프롬프트 보기
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => { if (window.confirm('내 구성을 모두 비울까요?')) dispatch({ type: 'setSlides', slides: [] }); }}>
            모두 비우기
          </button>
        </div>
      )}

      <section className="sets" aria-labelledby="sets-title">
        <h3 id="sets-title">발표 구성 세트</h3>
        <p className="hint">자주 쓰는 순서를 이름 붙여 저장해 두고 다시 불러와요.</p>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); saveSet(); }}>
          <input className="input" type="text" value={setName} maxLength={40} placeholder="세트 이름 — 예: 수업 기본형" aria-label="구성 세트 이름" onChange={(e) => setSetName(e.target.value)} />
          <button type="submit" className="btn" disabled={!setName.trim() || slides.length === 0}>
            저장
          </button>
        </form>
        {lib.slideSets.length === 0 ? (
          <p className="empty small">저장한 세트가 없어요.</p>
        ) : (
          <ul className="saved-list">
            {lib.slideSets.map((s) => (
              <li key={s.id}>
                <span>
                  {s.name} <small>{s.slides.length}장</small>
                </span>
                <span>
                  <button type="button" className="btn btn-small" onClick={() => loadSet(s.id)}>
                    불러오기
                  </button>
                  <button type="button" className="icon-btn" aria-label={`세트 ${s.name} 삭제`} onClick={() => setLib((l) => ({ ...l, slideSets: l.slideSets.filter((x) => x.id !== s.id) }))}>
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SidePanel>
  );
}
