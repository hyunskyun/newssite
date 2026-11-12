import { useState } from 'react';
import ColorSetCard from '../components/ColorSetCard';
import OptionCard from '../components/OptionCard';
import Preview from '../components/previews/Preview';
import StepFooter from '../components/StepFooter';
import { colorById, colors, defaults, detailGroups, layouts, moods, purposes, styles, typography } from '../data';
import { findConflicts, selectedIds } from '../lib/conflicts';
import { MAX_SUBS, useStore, VIEWS } from '../state/store';
import type { Option, StepKey } from '../types';

const HELP: Record<StepKey, { title: string; help: string }> = {
  style: { title: '어떤 느낌으로 만들까요?', help: '가장 끌리는 것 하나를 누르면 ‘메인’이 됩니다. 더 누르면 ‘보조’로 최대 2개까지 섞을 수 있어요. 다시 누르면 해제됩니다.' },
  layout: { title: '내용을 어떻게 배치할까요?', help: '레이아웃(그리드)은 화면을 나누고 요소를 줄 맞추는 방식이에요. 하나만 골라 주세요.' },
  color: { title: '어떤 색으로 칠할까요?', help: '먼저 분위기를 고른 뒤 색 묶음(세트) 하나를 고르세요. 넓은 배경 60 · 면 30 · 포인트 10 비율로 쓰면 안정적이에요.' },
  typography: { title: '어떤 글꼴을 쓸까요?', help: '세리프는 획 끝에 작은 삐침이 있는 명조 계열, 산세리프는 삐침이 없는 고딕 계열이에요.' },
  details: { title: '마감은 어떻게 할까요?', help: '그림자·모서리·장식·테두리·여백을 항목마다 하나씩 골라요. 안 고른 항목은 기본값이 들어갑니다.' },
};

function UnsureCard({ step, defaultName }: { step: StepKey; defaultName: string }) {
  const { state, dispatch } = useStore();
  const on = state.unsure.includes(step);
  return (
    <div className={`option unsure${on ? ' is-selected' : ''}`}>
      <button type="button" className="option-main" aria-pressed={on} onClick={() => dispatch({ type: 'toggleUnsure', step })}>
        <span className="option-preview unsure-mark" aria-hidden="true">
          ?
        </span>
        <span className="option-body">
          <span className="option-name">
            잘 모르겠어요
            {on && <em className="badge">선택됨</em>}
          </span>
          <span className="option-desc">괜찮아요. 기본값({defaultName})으로 둘게요. 다시 누르면 해제돼요.</span>
        </span>
      </button>
    </div>
  );
}

function Purpose() {
  const { state, dispatch } = useStore();
  const isPreset = purposes.some((p) => p.name === state.purpose);
  const [custom, setCustom] = useState(state.purpose !== '' && !isPreset);
  const set = (value: string) => dispatch({ type: 'setPurpose', value });
  return (
    <section className="purpose" aria-labelledby="purpose-title">
      <h3 id="purpose-title">
        무엇을 만드나요? <small>선택 사항 · 비워 두면 ‘{defaults.purpose}’</small>
      </h3>
      <div className="chip-row">
        {purposes.map((p) => {
          const on = !custom && state.purpose === p.name;
          return (
            <button key={p.id} type="button" className={`pill${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => { setCustom(false); set(on ? '' : p.name); }}>
              {p.name}
            </button>
          );
        })}
        <button type="button" className={`pill${custom ? ' is-on' : ''}`} aria-pressed={custom} onClick={() => { setCustom(!custom); set(''); }}>
          직접 입력
        </button>
      </div>
      {custom && <input className="input" type="text" value={state.purpose} maxLength={60} placeholder="예: 학급 안내문, 유튜브 썸네일" aria-label="용도 직접 입력" autoFocus onChange={(e) => set(e.target.value)} />}
    </section>
  );
}

export default function StylePart({ step }: { step: StepKey }) {
  const { state, dispatch } = useStore();
  const index = VIEWS.findIndex((v) => v.key === step);
  const unsure = state.unsure.includes(step);
  const conflicts = findConflicts(selectedIds(state));
  const [mood, setMood] = useState(() => colorById.get(state.color ?? '')?.mood ?? moods[0]);

  const simple = (list: Option[], key: 'layout' | 'typography') => (
    <div className="option-grid">
      {list.map((o) => {
        const selected = state[key] === o.id;
        return <OptionCard key={o.id} name={o.name} description={o.description} preview={<Preview option={o} />} selected={selected} badge={selected ? '선택됨' : unsure && o.isDefault ? '기본값' : undefined} onSelect={() => dispatch({ type: 'pick', step: key, id: o.id })} />;
      })}
      <UnsureCard step={key} defaultName={defaults[key].name} />
    </div>
  );

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">파트 A · {index + 1} / 5 단계</p>
        <h2>
          {VIEWS[index].label} <span>— {HELP[step].title}</span>
        </h2>
        <p className="help">{HELP[step].help}</p>
      </header>

      {conflicts.length > 0 && (
        <div className="warn" role="status">
          <strong>어울림 경고</strong>
          <ul>
            {conflicts.map((c) => (
              <li key={c.a.id + c.b.id}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {step === 'style' && (
        <>
          <Purpose />
          <div className="option-grid">
            {styles.map((o) => {
              const isMain = state.style.main === o.id;
              const isSub = state.style.subs.includes(o.id);
              const full = !isMain && !isSub && !!state.style.main && state.style.subs.length >= MAX_SUBS;
              return (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  preview={<Preview option={o} />}
                  selected={isMain || isSub}
                  dimmed={full}
                  badge={isMain ? '메인' : isSub ? '보조' : unsure && o.isDefault ? '기본값' : undefined}
                  onSelect={() => dispatch({ type: 'pickStyle', id: o.id })}
                  footer={
                    isSub ? (
                      <button type="button" className="option-foot" onClick={() => dispatch({ type: 'makeMain', id: o.id })}>
                        메인으로 바꾸기
                      </button>
                    ) : undefined
                  }
                />
              );
            })}
            <UnsureCard step="style" defaultName={defaults.style.name} />
          </div>
          {state.style.subs.length >= MAX_SUBS && <p className="hint">보조 스타일은 최대 {MAX_SUBS}개예요. 다른 것을 넣으려면 고른 보조를 한 번 더 눌러 빼 주세요.</p>}
        </>
      )}

      {step === 'layout' && simple(layouts, 'layout')}
      {step === 'typography' && simple(typography, 'typography')}

      {step === 'color' && (
        <>
          <div className="tabs" role="tablist" aria-label="분위기">
            {moods.map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mood === m} className={`tab${mood === m ? ' is-on' : ''}`} onClick={() => setMood(m)}>
                {m}
                {colorById.get(state.color ?? '')?.mood === m && <span className="tab-dot" aria-label="선택한 세트가 있는 탭" />}
              </button>
            ))}
          </div>
          <div className="option-grid colorset-grid">
            {colors
              .filter((c) => c.mood === mood)
              .map((c) => {
                const selected = state.color === c.id;
                return <ColorSetCard key={c.id} set={c} selected={selected} badge={selected ? '선택됨' : unsure && c.isDefault ? '기본값' : undefined} onSelect={() => dispatch({ type: 'pick', step: 'color', id: c.id })} />;
              })}
          </div>
          <div className="option-grid">
            <UnsureCard step="color" defaultName={defaults.color.name} />
          </div>
          <p className="hint">세트를 고르면 다른 단계의 미리보기와 슬라이드 와이어프레임도 그 색으로 바뀝니다.</p>
        </>
      )}

      {step === 'details' && (
        <>
          {detailGroups.map((g) => (
            <section key={g.key} className="detail-group" aria-labelledby={`dg-${g.key}`}>
              <h3 id={`dg-${g.key}`}>
                {g.name} <small>{g.description}</small>
              </h3>
              <div className="detail-grid">
                {g.options.map((o) => {
                  const selected = state.details[g.key] === o.id;
                  return <OptionCard key={o.id} compact name={o.name} description={o.description} preview={<Preview option={o} />} selected={selected} badge={selected ? '선택됨' : !state.details[g.key] && o.isDefault ? '기본값' : undefined} onSelect={() => dispatch({ type: 'pickDetail', key: g.key, id: o.id })} />;
                })}
              </div>
            </section>
          ))}
          <div className="option-grid">
            <UnsureCard step="details" defaultName="은은한 그림자 · 약간 둥글게 · 장식 최소 · 테두리 없음 · 여백 넓게" />
          </div>
        </>
      )}

      <StepFooter />
    </div>
  );
}
