import { useRef, useState } from 'react';
import { ROLE_LABEL } from '../components/ColorSetCard';
import PromptOutput from '../components/PromptOutput';
import SlideWireframe from '../components/SlideWireframe';
import StepFooter from '../components/StepFooter';
import { detailGroups } from '../data';
import { resolveSelections } from '../lib/buildPrompt';
import { effectiveIds, findConflicts } from '../lib/conflicts';
import { downloadJson, newUid, parseExportFile, toExportFile } from '../lib/storage';
import { useStore, type View } from '../state/store';
import type { ColorRole } from '../types';

export default function Result() {
  const { state, dispatch, go, lib, setLib, notify } = useStore();
  const r = resolveSelections(state);
  const conflicts = findConflicts(effectiveIds(state));
  const [presetName, setPresetName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const rows: { view: View; label: string; value: React.ReactNode; filled: boolean }[] = [
    { view: 'style', label: '용도', value: r.purpose, filled: r.filled.purpose },
    { view: 'style', label: '스타일', value: [`${r.styleMain.name}(메인)`, ...r.styleSubs.map((s) => `${s.name}(보조)`)].join(' + '), filled: r.filled.style },
    { view: 'layout', label: '레이아웃·그리드', value: r.layout.name, filled: r.filled.layout },
    {
      view: 'color',
      label: '컬러',
      value: (
        <>
          {r.color.mood} · {r.color.name}
          <span className="result-chips">
            {(Object.keys(ROLE_LABEL) as ColorRole[]).map((k) => (
              <span key={k} className="chip" title={`${ROLE_LABEL[k]} ${r.color.roles[k]}`}>
                <i style={{ background: r.color.roles[k] }} />
                <small>
                  {ROLE_LABEL[k]} {r.color.roles[k]}
                </small>
              </span>
            ))}
          </span>
        </>
      ),
      filled: r.filled.color,
    },
    { view: 'typography', label: '타이포그래피', value: r.typography.name, filled: r.filled.typography },
    ...detailGroups.map((g) => ({ view: 'details' as View, label: g.name, value: r.details[g.key].name, filled: r.filled.details[g.key] })),
  ];

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    setLib((l) => ({ ...l, presets: [{ id: newUid(), name, state }, ...l.presets.filter((p) => p.name !== name)] }));
    setPresetName('');
    notify(`프리셋 ‘${name}’을(를) 저장했어요`);
  };
  const loadPreset = (id: string) => {
    const p = lib.presets.find((x) => x.id === id);
    if (!p || !window.confirm(`지금 고른 내용을 프리셋 ‘${p.name}’으로 바꿀까요?`)) return;
    dispatch({ type: 'replace', state: { ...p.state, slides: p.state.slides.map((s) => ({ ...s, uid: newUid() })) } });
    notify(`‘${p.name}’을(를) 불러왔어요`);
  };
  const importFile = async (file: File) => {
    try {
      const data = parseExportFile(await file.text());
      if (!window.confirm('불러온 파일의 내용으로 지금 고른 것을 바꿀까요?\n(파일에 든 프리셋·구성 세트는 기존 목록에 더해져요)')) return;
      dispatch({ type: 'replace', state: data.state });
      setLib((l) => ({
        ...l,
        presets: [...data.presets.filter((p) => !l.presets.some((x) => x.id === p.id)), ...l.presets],
        slideSets: [...data.slideSets.filter((p) => !l.slideSets.some((x) => x.id === p.id)), ...l.slideSets],
      }));
      notify('파일을 불러왔어요');
    } catch (e) {
      notify(e instanceof SyntaxError ? 'JSON 파일을 읽지 못했어요. 파일이 깨졌을 수 있어요' : e instanceof Error ? e.message : '파일을 불러오지 못했어요');
    }
  };

  return (
    <div className="page result">
      <header className="page-head">
        <p className="eyebrow">완성</p>
        <h2>
          결과 프롬프트 <span>— 복사해서 AI 도구에 붙여넣으세요</span>
        </h2>
        <p className="help">고르지 않은 항목은 기본값으로 채웠어요. 바꾸고 싶으면 ‘다시 고르기’를 누르세요. 다른 단계의 선택은 그대로 남습니다.</p>
      </header>

      <PromptOutput />

      {conflicts.length > 0 && (
        <div className="warn" role="status">
          <strong>어울림 경고</strong> <small>(프롬프트에는 들어가지 않아요)</small>
          <ul>
            {conflicts.map((c) => (
              <li key={c.a.id + c.b.id}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-cols">
        <section className="panel" aria-labelledby="res-a">
          <h3 id="res-a">파트 A · 전체 스타일</h3>
          <ul className="result-rows">
            {rows.map((row) => (
              <li key={row.label}>
                <span className="summary-label">{row.label}</span>
                <span className="result-value">
                  {row.value}
                  {row.filled && <em className="badge badge-muted">기본값으로 채움</em>}
                </span>
                <button type="button" className="btn btn-small" aria-label={`${row.label} 다시 고르기`} onClick={() => go(row.view)}>
                  다시 고르기
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="res-b">
          <h3 id="res-b">
            파트 B · 슬라이드 구성 <small>{r.slides.length}장</small>
            <button type="button" className="btn btn-small" onClick={() => go('slides')}>
              {r.slides.length ? '구성 고치기' : '슬라이드 추가하기'}
            </button>
          </h3>
          {r.slides.length === 0 ? (
            <p className="empty">슬라이드 구성이 비어 있어요. 이대로도 전체 스타일 프롬프트는 쓸 수 있고, 슬라이드를 추가하면 장면별 지시가 함께 들어갑니다.</p>
          ) : (
            <ol className="result-slides">
              {r.slides.map((s, i) => (
                <li key={i}>
                  <span className="slide-num">{i + 1}</span>
                  <span className="slide-thumb">
                    <SlideWireframe shapes={s.type.shapes} invert={s.type.invert} label="" />
                  </span>
                  <span>
                    <strong>{s.type.name}</strong>
                    {s.memo && <span className="memo-text"> — {s.memo}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="result-cols">
        <section className="panel" aria-labelledby="res-preset">
          <h3 id="res-preset">프리셋으로 저장</h3>
          <p className="hint">지금 고른 전체 내용(스타일 + 슬라이드 구성)에 이름을 붙여 이 기기에 저장해요.</p>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); savePreset(); }}>
            <input className="input" type="text" value={presetName} maxLength={40} placeholder="프리셋 이름 — 예: 과학 수업용" aria-label="프리셋 이름" onChange={(e) => setPresetName(e.target.value)} />
            <button type="submit" className="btn" disabled={!presetName.trim()}>
              저장
            </button>
          </form>
          {lib.presets.length === 0 ? (
            <p className="empty small">저장한 프리셋이 없어요.</p>
          ) : (
            <ul className="saved-list">
              {lib.presets.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.name} <small>슬라이드 {p.state.slides.length}장</small>
                  </span>
                  <span>
                    <button type="button" className="btn btn-small" onClick={() => loadPreset(p.id)}>
                      불러오기
                    </button>
                    <button type="button" className="icon-btn" aria-label={`프리셋 ${p.name} 삭제`} onClick={() => setLib((l) => ({ ...l, presets: l.presets.filter((x) => x.id !== p.id) }))}>
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="res-json">
          <h3 id="res-json">파일로 내보내기 · 불러오기</h3>
          <p className="hint">선택 내용과 저장한 프리셋·구성 세트를 JSON 파일 하나로 보관하거나 다른 기기로 옮길 수 있어요. 서버로 보내는 것은 없습니다.</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => { downloadJson('design-prompt.json', toExportFile(state, lib.presets, lib.slideSets)); notify('JSON 파일로 내보냈어요'); }}>
              JSON 내보내기
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              JSON 불러오기
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="JSON 파일 선택" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f); }} />
          </div>
        </section>
      </div>
      <StepFooter />
    </div>
  );
}
