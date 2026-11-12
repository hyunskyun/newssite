import { useState, type ReactNode } from 'react';

/** 오른쪽 패널. 좁은 화면에서는 아래에 붙는 접이식 바가 된다. */
export default function SidePanel({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className={`side${open ? ' is-open' : ''}`} aria-label={title}>
      <button type="button" className="side-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>
          {title}
          {count && <em className="badge">{count}</em>}
        </span>
        <span aria-hidden="true">{open ? '닫기 ▾' : '펼치기 ▴'}</span>
      </button>
      <h2 className="side-title">
        {title}
        {count && <em className="badge">{count}</em>}
      </h2>
      <div className="side-body">{children}</div>
    </aside>
  );
}
