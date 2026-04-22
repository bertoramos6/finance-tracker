interface Props {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
}

function smoothD(pts: [number, number][]): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
    d += ` C${cpx} ${pts[i - 1][1]} ${cpx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
  }
  return d;
}

export default function Sparkline({ data, color = 'var(--blue)', w = 100, h = 36 }: Props) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts: [number, number][] = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((v - min) / rng) * (h - 8),
  ]);
  const d = smoothD(pts);
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={`${d} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`} fill={color} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}
