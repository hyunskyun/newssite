import { useMemo, useState } from 'react';
import SlideWireframe from '../components/SlideWireframe';
import StepFooter from '../components/StepFooter';
import { slideCategories, slideTypeById, slideTypes } from '../data';
import { useStore } from '../state/store';
import type { SlideType } from '../types';

const ALL = '전체';
const FAV = '★ 즐겨찾기';
const RECENT = '최근 사용';

/** 파트 B: 슬라이드 유형 라이브러리(카테고리 탭·검색·즐겨찾기·최근 사용). 카드를 누르면 "내 구성"에 추가된다. */
export default function SlidePart() {
  const { state, lib, setLib, addSlide, notify } = useStore();
  const [tab, setTab] = useState(ALL);
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of state.slides) m.set(s.typeId, (m.get(s.typeId) ?? 0) + 1);
    return m;
  }, [state.slides]);

  const list = useMemo(() => {
    let base: SlideType[];
    if (tab === ALL) base = slideTypes;
    else if (tab === FAV) base = slideTypes.filter((s) => lib.favorites.includes(s.id));
    else if (tab === RECENT) base = lib.recents.flatMap((id) => slideTypeById.get(id) ?? []);
    else base = slideTypes.filter((s) => s.category === tab);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s) => [s.name, s.category, ...s.tags].some((t) => t.toLowerCase().includes(q)));
  }, [tab, query, lib.favorites, lib.recents]);

  const toggleFav = (id: string) => setLib((l) => ({ ...l, favorites: l.favorites.includes(id) ? l.favorites.filter((x) => x !== id) : [...l.favorites, id] }));
  const tabs = [
    { name: ALL, n: slideTypes.length },
    { name: FAV, n: lib.favorites.filter((id) => slideTypeById.has(id)).length },
    { name: RECENT, n: lib.recents.filter((id) => slideTypeById.has(id)).length },
    ...slideCategories.map((c) => ({ name: c.name, n: slideTypes.filter((s) => s.category === c.name).length })),
  ];

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">파트 B · 슬라이드 구성</p>
        <h2>
          슬라이드 구성 <span>— 어떤 장면을 어떤 순서로 보여 줄까요?</span>
        </h2>
        <p className="help">마음에 드는 유형 카드를 누르면 ‘내 구성’에 순서대로 쌓입니다. 회색 막대는 글, 산 그림은 사진 자리예요. 별(☆)을 누르면 즐겨찾기에 모아 둘 수 있어요.</p>
      </header>

      <div className="library-tools">
        <input className="input search" type="search" value={query} placeholder={`이름·태그로 찾기 (예: 차트, 3열, 사진) — 전체 ${slideTypes.length}종`} aria-label="슬라이드 유형 검색" onChange={(e) => setQuery(e.target.value)} />
        <div className="tabs" role="tablist" aria-label="카테고리">
          {tabs.map((t) => (
            <button key={t.name} type="button" role="tab" aria-selected={tab === t.name} className={`tab${tab === t.name ? ' is-on' : ''}`} onClick={() => setTab(t.name)}>
              {t.name} <small>{t.n}</small>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="empty">
          {query.trim()
            ? `‘${query.trim()}’에 맞는 유형이 없어요. 다른 낱말로 찾거나 ‘전체’ 탭에서 찾아보세요.`
            : tab === FAV
              ? '아직 즐겨찾기가 없어요. 카드 오른쪽 위의 별(☆)을 눌러 모아 보세요.'
              : tab === RECENT
                ? '아직 쓴 유형이 없어요. 카드를 눌러 추가하면 여기에 모여요.'
                : '이 카테고리에는 유형이 없어요.'}
        </p>
      ) : (
        <ul className="thumb-grid">
          {list.map((s) => {
            const fav = lib.favorites.includes(s.id);
            const n = counts.get(s.id) ?? 0;
            return (
              <li key={s.id} className={`thumb${n ? ' is-used' : ''}`}>
                <button type="button" className="thumb-main" title={`${s.description}\n\n프롬프트: ${s.promptText}`} onClick={() => { addSlide(s.id); notify(`‘${s.name}’을(를) ${state.slides.length + 1}번째로 추가했어요`); }}>
                  <SlideWireframe shapes={s.shapes} invert={s.invert} label={`${s.name} 와이어프레임`} />
                  <span className="thumb-name">
                    {s.name}
                    {n > 0 && <em className="badge">×{n}</em>}
                  </span>
                  <span className="thumb-desc">{s.description}</span>
                </button>
                <button type="button" className={`star${fav ? ' is-on' : ''}`} aria-pressed={fav} aria-label={`${s.name} 즐겨찾기`} onClick={() => toggleFav(s.id)}>
                  {fav ? '★' : '☆'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <StepFooter />
    </div>
  );
}
