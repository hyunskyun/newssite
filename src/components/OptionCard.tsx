import type { ReactNode } from 'react';

type Props = {
  name: string;
  description: string;
  preview: ReactNode;
  selected?: boolean;
  /** 선택 상태 옆에 붙는 짧은 표시(메인·보조·기본값 등) */
  badge?: string;
  dimmed?: boolean;
  compact?: boolean;
  onSelect: () => void;
  /** 카드 아래에 붙는 보조 동작(예: "메인으로") */
  footer?: ReactNode;
};

/** 이름·한 줄 설명·미리보기를 함께 보여 주는 옵션 카드 */
export default function OptionCard({ name, description, preview, selected, badge, dimmed, compact, onSelect, footer }: Props) {
  return (
    <div className={`option${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}${compact ? ' is-compact' : ''}`}>
      <button type="button" className="option-main" aria-pressed={!!selected} onClick={onSelect}>
        <span className="option-preview">{preview}</span>
        <span className="option-body">
          <span className="option-name">
            {name}
            {badge && <em className="badge">{badge}</em>}
          </span>
          <span className="option-desc">{description}</span>
        </span>
      </button>
      {footer}
    </div>
  );
}
