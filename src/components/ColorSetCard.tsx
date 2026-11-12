import type { ColorRole, ColorSet } from '../types';
import { contrastRatio } from '../lib/contrast';

export const ROLE_LABEL: Record<ColorRole, string> = { bg: '배경', surface: '면·카드', text: '본문', accent: '포인트', accent2: '보조 포인트', border: '경계선' };
const ROLES = Object.keys(ROLE_LABEL) as ColorRole[];

type Props = { set: ColorSet; selected: boolean; badge?: string; onSelect: () => void };

/** 컬러 세트 카드: 60-30-10 비율 견본 + 역할별 6색 칩 + 이름 */
export default function ColorSetCard({ set, selected, badge, onSelect }: Props) {
  const r = set.roles;
  return (
    <div className={`option colorset${selected ? ' is-selected' : ''}`}>
      <button type="button" className="option-main" aria-pressed={selected} onClick={onSelect}>
        <span className="colorset-sample" style={{ background: r.bg, color: r.text, borderColor: r.border }} aria-hidden="true">
          <span className="ratio">
            <i style={{ flex: 60, background: r.bg, color: r.text }}>60</i>
            <i style={{ flex: 30, background: r.surface, color: r.text }}>30</i>
            <i style={{ flex: 10, background: r.accent, color: r.bg }}>10</i>
          </span>
          <span className="mini">
            <b style={{ color: r.text }}>가나다 Aa</b>
            <i style={{ background: r.surface, borderColor: r.border }} />
            <i style={{ background: r.accent }} />
            <i style={{ background: r.accent2 }} />
          </span>
        </span>
        <span className="option-body">
          <span className="option-name">
            {set.name}
            {badge && <em className="badge">{badge}</em>}
          </span>
          <span className="chips">
            {ROLES.map((role) => (
              <span key={role} className="chip" title={`${ROLE_LABEL[role]} ${r[role]}`}>
                <i style={{ background: r[role] }} />
                <small>{ROLE_LABEL[role]}</small>
              </span>
            ))}
          </span>
          <span className="option-desc">
            {set.promptText} · 글자 대비 {contrastRatio(r.text, r.bg).toFixed(1)}:1
          </span>
        </span>
      </button>
    </div>
  );
}
