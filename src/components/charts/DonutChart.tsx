import { useState } from 'react';
import { fmtEur } from '../../utils';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  size?: number;
}

export default function DonutChart({ data, size = 180 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) return (
    <div style={{ width: '100%', maxWidth: size, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 12 }}>
      No data
    </div>
  );

  const cx = size / 2, cy = size / 2, r = size * 0.42, ir = r * 0.58;
  let cur = -Math.PI / 2;

  const paths = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const end = cur + angle;
    const large = angle > Math.PI ? 1 : 0;
    const mid = cur + angle / 2;
    const off = hovered === i ? 5 : 0;
    const dx = Math.cos(mid) * off, dy = Math.sin(mid) * off;
    const pt = (rad: number) => [
      cx + rad * Math.cos(cur) + dx, cy + rad * Math.sin(cur) + dy,
      cx + rad * Math.cos(end) + dx, cy + rad * Math.sin(end) + dy,
    ];
    const [x1, y1, x2, y2] = pt(r);
    const [ix1, iy1, ix2, iy2] = pt(ir);
    const path = (
      <path
        key={i}
        d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`}
        fill={d.color}
        opacity={hovered !== null && hovered !== i ? 0.35 : 1}
        style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
      />
    );
    cur = end;
    return path;
  });

  const hd = hovered !== null ? data[hovered] : null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, flexShrink: 1 }}>
      {paths}
      {hd ? (
        <>
          <text x={cx} y={cy - 9} textAnchor="middle" fontSize={10} fill="var(--text2)" fontFamily="Nunito,sans-serif">
            {hd.label.length > 14 ? hd.label.slice(0, 13) + '…' : hd.label}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--text)" fontFamily="Nunito,sans-serif">
            {fmtEur(hd.value)}
          </text>
          <text x={cx} y={cy + 26} textAnchor="middle" fontSize={11} fill="var(--text2)" fontFamily="Nunito,sans-serif">
            {(hd.value / total * 100).toFixed(1)}%
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fill="var(--text2)" fontFamily="Nunito,sans-serif">
          Expenses
        </text>
      )}
    </svg>
  );
}
