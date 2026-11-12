import { useState } from 'react';
import { buildPrompt } from '../lib/buildPrompt';
import { useStore } from '../state/store';
import type { PromptMode } from '../types';

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 아래 방식으로 다시 시도 */
  }
  // 파일로 직접 연 경우 등 클립보드 API 를 못 쓸 때
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/** 완성된 프롬프트 + 한 줄 요약형/상세형 전환 + 복사 버튼 */
export default function PromptOutput() {
  const { state, notify } = useStore();
  const [mode, setMode] = useState<PromptMode>('detail');
  const text = buildPrompt(state, mode);

  const copy = async () => {
    notify((await copyText(text)) ? '프롬프트를 복사했어요. 원하는 AI 도구에 붙여넣으세요' : '복사하지 못했어요. 글을 직접 선택해 복사해 주세요');
  };

  return (
    <section className="prompt" aria-labelledby="prompt-title">
      <div className="prompt-head">
        <h3 id="prompt-title">완성된 프롬프트</h3>
        <div className="segmented" role="group" aria-label="프롬프트 형식">
          <button type="button" aria-pressed={mode === 'detail'} className={mode === 'detail' ? 'is-on' : ''} onClick={() => setMode('detail')}>
            상세형
          </button>
          <button type="button" aria-pressed={mode === 'short'} className={mode === 'short' ? 'is-on' : ''} onClick={() => setMode('short')}>
            한 줄 요약형
          </button>
        </div>
      </div>
      <pre className="prompt-text" tabIndex={0} aria-label="프롬프트 내용">
        {text}
      </pre>
      <div className="prompt-foot">
        <span className="hint">{mode === 'detail' ? '용도 → 스타일 → 컬러 → 타이포 → 디테일 → 슬라이드 순서로 조립했어요.' : '스타일·레이아웃·색·그림자·장식만 한 줄로 간추렸어요.'}</span>
        <button type="button" className="btn btn-primary" onClick={copy}>
          프롬프트 복사
        </button>
      </div>
    </section>
  );
}
