import type { CSSProperties } from 'react';
import StepNav from './components/StepNav';
import SlideList from './components/SlideList';
import SummaryPanel from './components/SummaryPanel';
import { resolveSelections } from './lib/buildPrompt';
import Result from './pages/Result';
import SlidePart from './pages/SlidePart';
import StylePart from './pages/StylePart';
import { StoreProvider, useStore } from './state/store';

function Shell() {
  const { state, dispatch, view, go, toast, notify } = useStore();
  // 선택한(또는 기본) 컬러 세트를 CSS 변수로 내려 모든 미리보기가 같은 색을 쓰게 한다.
  const roles = resolveSelections(state).color.roles;
  const vars = Object.fromEntries(Object.entries(roles).map(([k, v]) => [`--c-${k}`, v])) as CSSProperties;

  const reset = () => {
    if (!window.confirm('고른 내용과 슬라이드 구성을 모두 지우고 처음부터 다시 할까요?\n(저장한 프리셋·구성 세트·즐겨찾기는 남아요)')) return;
    dispatch({ type: 'reset' });
    go('style');
    notify('처음 상태로 되돌렸어요');
  };

  return (
    <div className={`app view-${view}`} style={vars}>
      <header className="topbar">
        <h1>
          디자인 프롬프트 빌더 <small>고르기만 하면 지시문이 완성돼요</small>
        </h1>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          처음부터
        </button>
      </header>
      <div className="shell">
        <StepNav />
        <main id="main">{view === 'slides' ? <SlidePart /> : view === 'result' ? <Result /> : <StylePart key={view} step={view} />}</main>
        {view === 'slides' ? <SlideList /> : view !== 'result' && <SummaryPanel />}
      </div>
      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
