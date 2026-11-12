import { memo, type CSSProperties } from 'react';
import type { Paint, Shape } from '../types';

/**
 * 도형 목록(shapes)을 읽어 16:9 와이어프레임을 그리는 렌더러.
 * 레이아웃마다 컴포넌트를 만들지 않고, 이 컴포넌트 하나가 모든 슬라이드 유형을 그린다.
 * 색은 역할 이름으로만 지정하므로 컬러 세트(CSS 변수 --c-*)가 바뀌면 함께 바뀐다.
 */
const W = 12;
const H = 6.75;
const paint = (p: Paint | undefined, fallback: Paint): string => {
  const v = p ?? fallback;
  return v === 'none' ? 'none' : `var(--w-${v})`;
};

function draw(s: Shape, key: number) {
  switch (s.type) {
    case 'rect': {
      const style: CSSProperties = { fill: paint(s.fill, 'surface'), stroke: paint(s.stroke, 'none'), strokeWidth: 0.06 };
      return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={Math.min(s.radius ?? 0, s.w / 2, s.h / 2)} opacity={s.opacity} style={style} />;
    }
    case 'circle': {
      const style: CSSProperties = { fill: paint(s.fill, 'accent'), stroke: paint(s.stroke, 'none'), strokeWidth: s.width ?? 0.06 };
      if (s.arc === undefined) return <circle key={key} cx={s.cx} cy={s.cy} r={s.r} opacity={s.opacity} style={style} />;
      // arc: 0~1 만큼만 그린 고리(도넛·진행률). start: 시작 위치(0 = 12시 방향)
      return <circle key={key} cx={s.cx} cy={s.cy} r={s.r} opacity={s.opacity} style={style} pathLength={1} strokeDasharray={`${s.arc} ${1 - s.arc}`} transform={`rotate(${-90 + (s.start ?? 0) * 360} ${s.cx} ${s.cy})`} />;
    }
    case 'line':
      return <line key={key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} opacity={s.opacity} strokeDasharray={s.dash ? '0.16 0.14' : undefined} strokeLinecap="round" style={{ stroke: paint(s.stroke, 'border'), strokeWidth: s.width ?? 0.05 }} />;
    case 'arrow': {
      const w = s.width ?? 0.07;
      const head = w * 3.2;
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      const bx = s.x2 - Math.cos(angle) * head;
      const by = s.y2 - Math.sin(angle) * head;
      const nx = -Math.sin(angle) * head * 0.6;
      const ny = Math.cos(angle) * head * 0.6;
      const color = paint(s.stroke, 'accent');
      return (
        <g key={key} opacity={s.opacity}>
          <line x1={s.x1} y1={s.y1} x2={bx} y2={by} strokeLinecap="round" style={{ stroke: color, strokeWidth: w }} />
          <polygon points={`${s.x2},${s.y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`} style={{ fill: color }} />
        </g>
      );
    }
    case 'textLines': {
      // 글자 대신 굵기가 다른 둥근 막대로 "글줄"을 나타낸다.
      const size = s.size ?? 0.14;
      const gap = s.gap ?? size * 0.95;
      return (
        <g key={key} opacity={s.opacity} style={{ fill: paint(s.fill, 'text') }}>
          {Array.from({ length: s.lines }, (_, i) => {
            const w = s.lines > 1 && i === s.lines - 1 ? s.w * 0.6 : s.w;
            const x = s.align === 'center' ? s.x + (s.w - w) / 2 : s.align === 'right' ? s.x + s.w - w : s.x;
            return <rect key={i} x={x} y={s.y + i * (size + gap)} width={w} height={size} rx={Math.min(size * 0.3, 0.08)} />;
          })}
        </g>
      );
    }
    case 'imagePlaceholder': {
      // 사진 자리: 회색 면 + 산·해 모양 아이콘 (실제 사진 없음)
      const k = Math.min(s.w, s.h) * 0.55;
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      return (
        <g key={key}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={Math.min(s.radius ?? 0, s.w / 2, s.h / 2)} style={{ fill: 'var(--w-muted)' }} />
          {k > 0.5 && (
            <g opacity={0.5} style={{ fill: 'var(--w-bg)' }}>
              <circle cx={cx - k * 0.22} cy={cy - k * 0.2} r={k * 0.11} />
              <polygon points={`${cx - k / 2},${cy + k * 0.34} ${cx - k * 0.12},${cy - k * 0.06} ${cx + k * 0.08},${cy + k * 0.14} ${cx + k * 0.24},${cy - k * 0.02} ${cx + k / 2},${cy + k * 0.34}`} />
            </g>
          )}
        </g>
      );
    }
  }
}

type Props = { shapes: Shape[]; invert?: boolean; label?: string; className?: string };

function SlideWireframe({ shapes, invert, label, className }: Props) {
  return (
    <svg className={`wf${invert ? ' invert' : ''}${className ? ` ${className}` : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? '와이어프레임'} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={W} height={H} style={{ fill: 'var(--w-bg)' }} />
      {shapes.map(draw)}
    </svg>
  );
}

export default memo(SlideWireframe);
